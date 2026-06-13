#!/usr/bin/env python3
"""Shared helpers for BidIt deployment scripts."""
from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any, Dict, Iterable

ROOT_DIR = Path(__file__).resolve().parents[1]
DIST_DIR = ROOT_DIR / "dist"
LAMBDA_DIST_DIR = DIST_DIR / "lambdas"
BACKEND_LAMBDAS_DIR = ROOT_DIR / "backend" / "lambdas"
LEGACY_LAMBDAS_DIR = ROOT_DIR / "lambdas"
OUTPUTS_FILE = DIST_DIR / "deployment_outputs.json"


def load_dotenv(path: Path | None = None) -> None:
    """Load simple KEY=VALUE pairs from .env without requiring python-dotenv."""
    env_path = path or ROOT_DIR / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def env(name: str, default: str | None = None, required: bool = False) -> str:
    value = os.environ.get(name, default)
    if required and not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value or ""


def project_name() -> str:
    return env("PROJECT_NAME", "BidIt")


def environment() -> str:
    return env("ENVIRONMENT", env("API_STAGE_NAME", "dev"))


def region() -> str:
    return env("AWS_REGION", "us-east-1")


def default_tags() -> Dict[str, str]:
    return {
        "Project": project_name(),
        "Environment": environment(),
        "CreatedBy": "BidItDeploymentScripts",
    }


def boto_tags() -> list[dict[str, str]]:
    return [{"Key": key, "Value": value} for key, value in default_tags().items()]


def lambda_source_dir() -> Path:
    if BACKEND_LAMBDAS_DIR.exists():
        return BACKEND_LAMBDAS_DIR
    return LEGACY_LAMBDAS_DIR


def lambda_function_name(stem: str) -> str:
    return f"{project_name()}-{stem}"


def lambda_files() -> list[Path]:
    source_dir = lambda_source_dir()
    return sorted(path for path in source_dir.glob("*.py") if path.name != "__init__.py")


def lambda_manifest() -> dict[str, dict[str, str]]:
    return {
        path.stem: {
            "source": str(path.relative_to(ROOT_DIR)),
            "zip": str((LAMBDA_DIST_DIR / f"{path.stem}.zip").relative_to(ROOT_DIR)),
            "function_name": lambda_function_name(path.stem),
            "handler": f"{path.stem}.lambda_handler",
        }
        for path in lambda_files()
    }


def read_outputs() -> dict[str, Any]:
    if not OUTPUTS_FILE.exists():
        return {}
    return json.loads(OUTPUTS_FILE.read_text())


def write_outputs(updates: dict[str, Any]) -> dict[str, Any]:
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    existing = read_outputs()
    existing.update(updates)
    OUTPUTS_FILE.write_text(json.dumps(existing, indent=2, sort_keys=True))
    return existing


def table_names() -> dict[str, str]:
    return {
        "users": env("DYNAMODB_USERS_TABLE", "Users"),
        "auctions": env("DYNAMODB_AUCTIONS_TABLE", "Auctions"),
        "bids": env("DYNAMODB_BIDS_TABLE", "Bids"),
        "favorites": env("DYNAMODB_FAVORITES_TABLE", "Favorites"),
        "notifications": env("DYNAMODB_NOTIFICATIONS_TABLE", "Notifications"),
    }


def replace_placeholders(value: Any, replacements: dict[str, str]) -> Any:
    if isinstance(value, dict):
        return {k: replace_placeholders(v, replacements) for k, v in value.items()}
    if isinstance(value, list):
        return [replace_placeholders(v, replacements) for v in value]
    if isinstance(value, str):
        for key, repl in replacements.items():
            value = value.replace("${" + key + "}", repl)
        return value
    return value


def sanitize_name(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9-_]", "-", value)


def print_json(title: str, data: Any) -> None:
    print(f"\n{title}\n" + json.dumps(data, indent=2, default=str))


def ensure_aws_identity(sts_client) -> dict[str, str]:
    try:
        identity = sts_client.get_caller_identity()
    except Exception as exc:
        raise RuntimeError("Unable to call AWS STS. Check AWS credentials and region.") from exc
    print(f"Using AWS account {identity.get('Account')} in region {region()}")
    return identity
