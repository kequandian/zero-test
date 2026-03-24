use std::{
    collections::HashMap,
    path::{Path, PathBuf},
    sync::Arc,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use axum::{
    Json, Router,
    extract::{Path as AxumPath, State},
    http::StatusCode,
    response::sse::{Event, KeepAlive, Sse},
    routing::{get, post},
};
use futures::{Stream, StreamExt};
use serde::{Deserialize, Serialize};
use tokio::{
    process::Command,
    sync::{RwLock, broadcast},
};
use tokio_stream::wrappers::BroadcastStream;
use uuid::Uuid;

#[derive(Clone)]
struct AppState {
    service_root: PathBuf,
    workspace_root: PathBuf,
    script_path: PathBuf,
    jobs: Arc<RwLock<HashMap<Uuid, JobHandle>>>,
}

#[derive(Clone)]
struct JobHandle {
    state: JobState,
    tx: broadcast::Sender<JobEvent>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "snake_case")]
enum JobStatus {
    Queued,
    Running,
    Succeeded,
    Failed,
}

#[derive(Clone, Serialize)]
struct JobState {
    id: Uuid,
    status: JobStatus,
    output_path: Option<String>,
    error: Option<String>,
    created_at_ms: u128,
    updated_at_ms: u128,
    duration_ms: Option<u128>,
}

#[derive(Clone, Serialize)]
struct JobEvent {
    job_id: Uuid,
    kind: String,
    message: String,
    timestamp_ms: u128,
}

#[derive(Deserialize, Clone)]
struct RenderRequest {
    markdown: Option<String>,
    markdown_path: Option<String>,
    output_path: Option<String>,
    css_path: Option<String>,
    header: Option<String>,
    footer: Option<String>,
}

#[derive(Serialize)]
struct ApiError {
    error: String,
}

#[derive(Serialize)]
struct AsyncRenderResponse {
    job_id: Uuid,
    status_url: String,
    events_url: String,
}

#[derive(Serialize)]
struct SyncRenderResponse {
    output_path: String,
    duration_ms: u128,
}

#[tokio::main]
async fn main() {
    let service_root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let workspace_root = std::env::var("WORKSPACE_ROOT")
        .map(PathBuf::from)
        .unwrap_or_else(|_| service_root.clone());
    let script_path = service_root.join("render-pdf-mdpdf/scripts/render.js");

    if !script_path.exists() {
        eprintln!("render script not found: {}", script_path.to_string_lossy());
        std::process::exit(1);
    }

    let state = AppState {
        service_root,
        workspace_root,
        script_path,
        jobs: Arc::new(RwLock::new(HashMap::new())),
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/v1/render/sync", post(render_sync))
        .route("/api/v1/render/async", post(render_async))
        .route("/api/v1/render/jobs/{id}", get(get_job))
        .route("/api/v1/render/jobs/{id}/events", get(job_events))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:39090")
        .await
        .expect("bind failed");

    println!("render-mdpdf-service listening on http://0.0.0.0:39090");
    axum::serve(listener, app).await.expect("server failed");
}

async fn health() -> &'static str {
    "ok"
}

async fn render_sync(
    State(state): State<AppState>,
    Json(req): Json<RenderRequest>,
) -> Result<Json<SyncRenderResponse>, (StatusCode, Json<ApiError>)> {
    let job_id = Uuid::new_v4();
    let started = Instant::now();
    let output_path = run_render(&state, job_id, req, None)
        .await
        .map_err(internal_err)?;
    Ok(Json(SyncRenderResponse {
        output_path: output_path.to_string_lossy().to_string(),
        duration_ms: started.elapsed().as_millis(),
    }))
}

async fn render_async(
    State(state): State<AppState>,
    Json(req): Json<RenderRequest>,
) -> Result<Json<AsyncRenderResponse>, (StatusCode, Json<ApiError>)> {
    let job_id = Uuid::new_v4();
    let created_at = now_ms();
    let (tx, _rx) = broadcast::channel(64);
    let job_state = JobState {
        id: job_id,
        status: JobStatus::Queued,
        output_path: None,
        error: None,
        created_at_ms: created_at,
        updated_at_ms: created_at,
        duration_ms: None,
    };

    {
        let mut jobs = state.jobs.write().await;
        jobs.insert(
            job_id,
            JobHandle {
                state: job_state.clone(),
                tx: tx.clone(),
            },
        );
    }

    let _ = tx.send(JobEvent {
        job_id,
        kind: "queued".to_string(),
        message: "job accepted".to_string(),
        timestamp_ms: now_ms(),
    });

    let state_clone = state.clone();
    tokio::spawn(async move {
        let started = Instant::now();
        update_job_status(&state_clone, job_id, JobStatus::Running, None, None, None).await;
        let _ = tx.send(JobEvent {
            job_id,
            kind: "running".to_string(),
            message: "markdown to pdf conversion started".to_string(),
            timestamp_ms: now_ms(),
        });

        match run_render(&state_clone, job_id, req, Some(tx.clone())).await {
            Ok(output) => {
                update_job_status(
                    &state_clone,
                    job_id,
                    JobStatus::Succeeded,
                    Some(output.to_string_lossy().to_string()),
                    None,
                    Some(started.elapsed().as_millis()),
                )
                .await;
                let _ = tx.send(JobEvent {
                    job_id,
                    kind: "succeeded".to_string(),
                    message: "pdf generated".to_string(),
                    timestamp_ms: now_ms(),
                });
            }
            Err(err) => {
                update_job_status(
                    &state_clone,
                    job_id,
                    JobStatus::Failed,
                    None,
                    Some(err),
                    Some(started.elapsed().as_millis()),
                )
                .await;
                let _ = tx.send(JobEvent {
                    job_id,
                    kind: "failed".to_string(),
                    message: "conversion failed".to_string(),
                    timestamp_ms: now_ms(),
                });
            }
        }
    });

    Ok(Json(AsyncRenderResponse {
        job_id,
        status_url: format!("/api/v1/render/jobs/{job_id}"),
        events_url: format!("/api/v1/render/jobs/{job_id}/events"),
    }))
}

async fn get_job(
    State(state): State<AppState>,
    AxumPath(id): AxumPath<Uuid>,
) -> Result<Json<JobState>, (StatusCode, Json<ApiError>)> {
    let jobs = state.jobs.read().await;
    let job = jobs.get(&id).ok_or_else(not_found)?;
    Ok(Json(job.state.clone()))
}

async fn job_events(
    State(state): State<AppState>,
    AxumPath(id): AxumPath<Uuid>,
) -> Result<Sse<impl Stream<Item = Result<Event, axum::Error>>>, (StatusCode, Json<ApiError>)> {
    let (rx, current_state) = {
        let jobs = state.jobs.read().await;
        let job = jobs.get(&id).ok_or_else(not_found)?;
        (job.tx.subscribe(), job.state.clone())
    };

    let initial = JobEvent {
        job_id: id,
        kind: "connected".to_string(),
        message: "sse connected".to_string(),
        timestamp_ms: now_ms(),
    };
    let snapshot = JobEvent {
        job_id: id,
        kind: "snapshot".to_string(),
        message: format!("current_status={}", status_to_str(&current_state.status)),
        timestamp_ms: now_ms(),
    };

    let stream = BroadcastStream::new(rx).filter_map(|message| async move {
        match message {
            Ok(event) => {
                let data = serde_json::to_string(&event).ok()?;
                Some(Ok(Event::default().event(event.kind).data(data)))
            }
            Err(_) => None,
        }
    });

    let stream = futures::stream::once(async move {
        let data = serde_json::to_string(&initial).unwrap_or_else(|_| "{}".to_string());
        Ok(Event::default().event("connected").data(data))
    })
    .chain(futures::stream::once(async move {
        let data = serde_json::to_string(&snapshot).unwrap_or_else(|_| "{}".to_string());
        Ok(Event::default().event("snapshot").data(data))
    }))
    .chain(stream);

    Ok(Sse::new(stream).keep_alive(KeepAlive::new().interval(Duration::from_secs(10))))
}

async fn run_render(
    state: &AppState,
    job_id: Uuid,
    req: RenderRequest,
    tx: Option<broadcast::Sender<JobEvent>>,
) -> Result<PathBuf, String> {
    let output_path = resolve_output_path(state, &req, job_id)?;
    if let Some(parent) = output_path.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("create output directory failed: {e}"))?;
    }

    let (input_path, temp_file_to_cleanup) = resolve_markdown_input(state, &req, job_id).await?;
    let css_path = req
        .css_path
        .as_ref()
        .map(|v| resolve_path(&state.workspace_root, v));

    if let Some(sender) = &tx {
        let _ = sender.send(JobEvent {
            job_id,
            kind: "rendering".to_string(),
            message: "calling node mdpdf renderer".to_string(),
            timestamp_ms: now_ms(),
        });
    }

    let mut cmd = Command::new("node");
    cmd.arg(&state.script_path)
        .arg(&input_path)
        .arg(&output_path)
        .current_dir(&state.service_root);

    if let Some(css) = css_path {
        cmd.arg("--css").arg(css);
    }
    if let Some(header) = req.header.as_ref() {
        cmd.arg("--header").arg(header);
    }
    if let Some(footer) = req.footer.as_ref() {
        cmd.arg("--footer").arg(footer);
    }

    let result = cmd
        .output()
        .await
        .map_err(|e| format!("spawn node failed: {e}"))?;

    if let Some(temp) = temp_file_to_cleanup {
        let _ = tokio::fs::remove_file(temp).await;
    }

    if !result.status.success() {
        let stderr = String::from_utf8_lossy(&result.stderr).to_string();
        let stdout = String::from_utf8_lossy(&result.stdout).to_string();
        return Err(format!(
            "mdpdf conversion failed: status={}; stdout={}; stderr={}",
            result.status, stdout, stderr
        ));
    }

    Ok(output_path)
}

async fn resolve_markdown_input(
    state: &AppState,
    req: &RenderRequest,
    job_id: Uuid,
) -> Result<(PathBuf, Option<PathBuf>), String> {
    if let Some(path) = req.markdown_path.as_ref() {
        let full = resolve_path(&state.workspace_root, path);
        if !full.exists() {
            return Err(format!(
                "markdown_path not found: {}",
                full.to_string_lossy()
            ));
        }
        return Ok((full, None));
    }

    if let Some(markdown) = req.markdown.as_ref() {
        let temp_dir = state.service_root.join("tmp");
        tokio::fs::create_dir_all(&temp_dir)
            .await
            .map_err(|e| format!("create tmp directory failed: {e}"))?;
        let tmp_path = temp_dir.join(format!("{job_id}.md"));
        tokio::fs::write(&tmp_path, markdown)
            .await
            .map_err(|e| format!("write temp markdown failed: {e}"))?;
        return Ok((tmp_path.clone(), Some(tmp_path)));
    }

    Err("must provide markdown or markdown_path".to_string())
}

fn resolve_output_path(
    state: &AppState,
    req: &RenderRequest,
    job_id: Uuid,
) -> Result<PathBuf, String> {
    if let Some(path) = req.output_path.as_ref() {
        return Ok(resolve_path(&state.workspace_root, path));
    }
    let output_dir = state.service_root.join("output");
    Ok(output_dir.join(format!("{job_id}.pdf")))
}

fn resolve_path(root: &Path, path: &str) -> PathBuf {
    let candidate = PathBuf::from(path);
    if candidate.is_absolute() {
        candidate
    } else {
        root.join(candidate)
    }
}

async fn update_job_status(
    state: &AppState,
    id: Uuid,
    status: JobStatus,
    output_path: Option<String>,
    error: Option<String>,
    duration_ms: Option<u128>,
) {
    let mut jobs = state.jobs.write().await;
    if let Some(job) = jobs.get_mut(&id) {
        job.state.status = status;
        job.state.updated_at_ms = now_ms();
        if output_path.is_some() {
            job.state.output_path = output_path;
        }
        if error.is_some() {
            job.state.error = error;
        }
        if duration_ms.is_some() {
            job.state.duration_ms = duration_ms;
        }
    }
}

fn now_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}

fn internal_err(err: String) -> (StatusCode, Json<ApiError>) {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(ApiError { error: err }),
    )
}

fn not_found() -> (StatusCode, Json<ApiError>) {
    (
        StatusCode::NOT_FOUND,
        Json(ApiError {
            error: "job not found".to_string(),
        }),
    )
}

fn status_to_str(status: &JobStatus) -> &'static str {
    match status {
        JobStatus::Queued => "queued",
        JobStatus::Running => "running",
        JobStatus::Succeeded => "succeeded",
        JobStatus::Failed => "failed",
    }
}
