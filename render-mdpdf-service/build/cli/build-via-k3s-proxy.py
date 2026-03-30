#!/usr/bin/env python3
"""
build-via-k3s-proxy.py - 通过 k3s-proxy HTTP API 构建 Docker 镜像
使用最新 k3s-proxy API (v1.2.0)

参考: http://192.168.3.105:8080/skill
"""

import os
import sys
import json
import time
import base64
import subprocess
import requests
from pathlib import Path
from datetime import datetime
from typing import Optional

# ==================== 配置 ====================
K3S_PROXY_URL = os.getenv("K3S_PROXY_URL", "http://192.168.3.105:8080")
PROJECT_DIR = Path(__file__).parent.parent.parent
IMAGE_NAME = os.getenv("IMAGE_NAME", "render-mdpdf-service")
IMAGE_TAG = os.getenv("IMAGE_TAG", "latest")
REGISTRY_URL = os.getenv("REGISTRY_URL", "registry.k3s.local")

# 颜色输出 (ANSI)
GREEN = "\033[0;32m"
BLUE = "\033[0;34m"
YELLOW = "\033[1;33m"
RED = "\033[0;31m"
CYAN = "\033[0;36m"
NC = "\033[0m"

def print_colored(color: str, text: str):
    print(f"{color}{text}{NC}")

# ==================== 检查 k3s-proxy 服务 ====================
print_colored(BLUE, "=== K3s Proxy Docker Build ===")
print_colored(BLUE, f"Project: {PROJECT_DIR}")
print_colored(BLUE, f"Image: {IMAGE_NAME}:{IMAGE_TAG}")
print_colored(BLUE, f"Registry: {REGISTRY_URL}")
print_colored(BLUE, f"Proxy: {K3S_PROXY_URL}")
print()

print_colored(BLUE, "步骤 1: 检查 k3s-proxy 服务")
try:
    health_resp = requests.get(f"{K3S_PROXY_URL}/health", timeout=10)
    health = health_resp.json()
    print(json.dumps(health, indent=2))

    if health.get("status") != "healthy":
        print_colored(RED, "k3s-proxy 服务不健康")
        sys.exit(1)

    print_colored(GREEN, "✓ k3s-proxy 服务正常")
except Exception as e:
    print_colored(RED, f"连接 k3s-proxy 失败: {e}")
    sys.exit(1)
print()

# ==================== 检查是否已存在镜像 ====================
print_colored(BLUE, "步骤 2: 检查是否已存在镜像")

def check_image_exists(image_name: str, image_tag: str) -> Optional[dict]:
    """检查镜像是否已存在"""
    try:
        resp = requests.get(
            f"{K3S_PROXY_URL}/images/query",
            params={"image_name": image_name, "image_tag": image_tag},
            timeout=10
        )
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return None

existing_image = check_image_exists(IMAGE_NAME, IMAGE_TAG)
if existing_image:
    print_colored(YELLOW, f"⚠ 镜像已存在: {existing_image.get('image_reference', 'N/A')}")
    print_colored(YELLOW, f"  大小: {existing_image.get('size_bytes', 0) / 1024 / 1024:.2f} MB")
    print_colored(YELLOW, f"  创建时间: {existing_image.get('created', 'N/A')}")

    # 询问是否重新构建
    response = input(f"\n{CYAN}是否重新构建? (y/N): {NC}").strip().lower()
    if response != 'y':
        print_colored(GREEN, "跳过构建，使用现有镜像")
        sys.exit(0)
else:
    print_colored(GREEN, "✓ 镜像不存在，将进行构建")
print()

# ==================== 准备构建数据 ====================
print_colored(BLUE, "步骤 3: 准备构建数据")

def read_file(path: str) -> str:
    """读取文件内容"""
    full_path = PROJECT_DIR / path
    if full_path.exists():
        return full_path.read_text()
    return ""

# 读取 Dockerfile
dockerfile = read_file("Dockerfile")
if not dockerfile:
    print_colored(RED, "未找到 Dockerfile")
    sys.exit(1)

print_colored(GREEN, "✓ Dockerfile 已读取")

# 创建源代码 tar 包 (包含所有必要文件)
print_colored(YELLOW, "正在创建源代码归档...")

tar_path = PROJECT_DIR / f".build_temp_{IMAGE_NAME}.tar.gz"
try:
    # 需要包含的文件和目录
    files_to_include = [
        "Cargo.toml",
        "Cargo.lock",
        "src/",
        "render-pdf-mdpdf/",
    ]

    # 创建 tar 包
    tar_cmd = [
        "tar", "-czf", str(tar_path),
        "-C", str(PROJECT_DIR)
    ] + [f for f in files_to_include if (PROJECT_DIR / f).exists()]

    result = subprocess.run(tar_cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print_colored(RED, f"创建 tar 包失败: {result.stderr}")
        sys.exit(1)

    tar_size = tar_path.stat().st_size
    print_colored(GREEN, f"✓ 源代码归档创建完成 ({tar_size / 1024:.1f} KB)")

except Exception as e:
    print_colored(RED, f"创建归档失败: {e}")
    sys.exit(1)

# 读取并编码 tar 包
try:
    with open(tar_path, "rb") as f:
        tar_base64 = base64.b64encode(f.read()).decode("utf-8")
    print_colored(GREEN, f"✓ 归档已编码为 Base64 ({len(tar_base64)} 字符)")
except Exception as e:
    print_colored(RED, f"编码归档失败: {e}")
    tar_path.unlink(missing_ok=True)
    sys.exit(1)

print()

# ==================== 构建请求 ====================
print_colored(BLUE, "步骤 4: 构建构建请求")

build_request = {
    "dockerfile": dockerfile,
    "image_name": IMAGE_NAME,
    "image_tag": IMAGE_TAG,
    "registry_url": REGISTRY_URL,
    "source_tar": {
        "content": tar_base64,
        "subdirectory": ""  # 使用根目录作为构建上下文
    }
}

print_colored(GREEN, "✓ 构建请求准备完成")
print()

# ==================== 提交构建请求 ====================
print_colored(BLUE, "步骤 5: 提交构建请求")

try:
    build_resp = requests.post(
        f"{K3S_PROXY_URL}/build",
        json=build_request,
        headers={"Content-Type": "application/json"},
        timeout=60
    )
    build_resp.raise_for_status()
    result = build_resp.json()

    print(json.dumps(result, indent=2))
    print()

    build_id = result.get("build_id")
    if not build_id:
        print_colored(RED, "无法获取 build_id")
        sys.exit(1)

    image_reference = result.get("image_reference", "")
    print_colored(GREEN, f"✓ 构建已提交，ID: {build_id}")
    if image_reference:
        print_colored(GREEN, f"  镜像引用: {image_reference}")

except Exception as e:
    print_colored(RED, f"提交构建失败: {e}")
    if hasattr(e, "response") and e.response is not None:
        print_colored(RED, f"响应: {e.response.text}")
    tar_path.unlink(missing_ok=True)
    sys.exit(1)
print()

# ==================== 清理临时文件 ====================
tar_path.unlink(missing_ok=True)

# ==================== 监控构建状态 ====================
print_colored(BLUE, "步骤 6: 监控构建状态")
print_colored(YELLOW, "使用以下命令查看构建状态:")
print(f'  curl -s {K3S_PROXY_URL}/build/{build_id} | jq .')
print()
print_colored(YELLOW, "使用以下命令流式查看构建日志:")
print(f'  curl -N {K3S_PROXY_URL}/events/{build_id}')
print()

# 等待构建开始
time.sleep(2)

# 检查构建状态
max_attempts = 180  # 最多等待 15 分钟 (5秒 * 180)
last_status = None

for i in range(max_attempts):
    try:
        status_resp = requests.get(f"{K3S_PROXY_URL}/build/{build_id}", timeout=10)
        status_resp.raise_for_status()
        status_data = status_resp.json()
        status = status_data.get("status", "Unknown")

        # 只在状态变化时打印
        if status != last_status:
            timestamp = datetime.now().strftime("%H:%M:%S")
            print_colored(BLUE, f"{timestamp} - 状态: {status}")
            last_status = status

        if status == "Completed":
            print_colored(GREEN, "✓ 构建成功完成")
            print(json.dumps(status_data, indent=2))
            print()

            image_ref = status_data.get("image_reference", "")
            if image_ref:
                print_colored(GREEN, f"镜像: {image_ref}")
                print()
                print_colored(CYAN, "后续步骤:")
                print_colored(YELLOW, f"  在 k3s 中创建部署:")
                print_colored(YELLOW, f"    kubectl create deployment {IMAGE_NAME} --image={image_ref}")
                print_colored(YELLOW, f"    kubectl expose deployment {IMAGE_NAME} --port=39090 --type=NodePort")
            sys.exit(0)

        if status == "Failed":
            print_colored(RED, "✗ 构建失败")
            print(json.dumps(status_data, indent=2))
            error = status_data.get("error", "未知错误")
            print_colored(RED, f"错误: {error}")
            sys.exit(1)

    except Exception as e:
        print_colored(RED, f"获取状态失败: {e}")

    time.sleep(5)

print_colored(YELLOW, "构建仍在进行中，请使用上面的命令手动查看状态")
