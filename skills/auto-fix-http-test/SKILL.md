# auto-fix-http-test

Fix and make `.http` request collections runnable with minimal user input.

## When to use

Use this skill when the user asks to **test / run / validate** a `.http` file (JetBrains HTTP Client style) under `src/test/http/`, or shows failing request outputs and wants it fixed.

## Goal

- Make the target `.http` file runnable end-to-end in IntelliJ HTTP Client.
- Only ask the user for **missing runtime facts** (baseUrl/auth/paths). Everything else should be inferred from repo files.
- If fixes are needed, prefer **editing the `.http` file** (variables, headers, ordering, extraction), plus updating `.claude/CLAUDE.md` with newly learned conventions.

## Execution checklist

### 1) Locate the target

- If user names a file path like `@src/test/http/media_process_test.http`, open it directly.
- Otherwise, search `src/test/http/*.http` and pick the closest match by name and endpoint.

### 2) Identify dependencies and blockers

From the `.http` file, extract:

- `@baseUrl` default and all referenced variables
- Required headers (e.g. `Authorization`, cookies)
- Any file paths used in request bodies (e.g. `filePath`)
- Any `# @extract ... -> varName` dependencies that require request ordering

Also check:

- `src/main/resources/application-*.yml` for server port/context path
- Security configuration if endpoints are under `/api/adm/**` (likely auth)
- Any companion `.http` files (e.g. upload endpoints) that must run first

### 3) Ask minimal questions (only if not derivable)

Ask only what blocks execution:

- baseUrl (host/port), if not `localhost:8080`
- auth: whether token/cookie is required, and one working example
- file path provenance: where the service can read files from (local path? mounted volume? upload service response field?)

### 4) Auto-fix (safe edits)

Apply fixes that do not require runtime secrets:

- Normalize variables: `@baseUrl`, `@contentType`, add `@token` placeholders
- Add optional auth header blocks guarded by variables
- Ensure extraction syntax is correct and variables are used consistently
- Reorder requests so extracted vars are defined before use
- Add a small “Prerequisites” block at top (how to start service, DB tables, required files)

Do NOT:

- Hardcode real tokens/secrets
- Change business logic or backend code unless the user asked to fix the API itself

### 5) Prove runnability

If you can run the app locally in this workspace, do so; otherwise:

- Provide a minimal run sequence: which requests to run first and what to fill in (baseUrl/token/filePath)

### 6) Update project guidance

If you learn new conventions (auth header name, upload endpoint, canonical storage path), update `.claude/CLAUDE.md` under “HTTP Client (`.http`) Test Playbook”.
