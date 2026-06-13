#!/usr/bin/env python3
"""Package BidIt Lambda source files into deployment zip archives."""
from __future__ import annotations

import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

from common import DIST_DIR, LAMBDA_DIST_DIR, ROOT_DIR, lambda_files, lambda_manifest, lambda_source_dir, load_dotenv, write_outputs

EXCLUDE_DIRS = {"__pycache__", ".git", "node_modules", ".venv", "venv", "dist", "build"}
EXCLUDE_SUFFIXES = {".pyc", ".pyo"}
EXCLUDE_NAMES = {".env", ".env.local"}


def should_include(path: Path) -> bool:
    parts = set(path.parts)
    if parts & EXCLUDE_DIRS:
        return False
    if path.name in EXCLUDE_NAMES:
        return False
    if path.suffix in EXCLUDE_SUFFIXES:
        return False
    return True


def dependency_target(function_stem: str) -> Path:
    return DIST_DIR / "build" / function_stem


def install_dependencies(target: Path, source_file: Path) -> None:
    requirements = ROOT_DIR / "backend" / "requirements.txt"
    if not requirements.exists():
        return
    # boto3/botocore are available in Lambda and are listed primarily for scripts/local validation.
    # agora-token-builder is packaged because generateAgoraToken imports it and Lambda does not include it.
    source_text = source_file.read_text()
    install_requirements = target / "lambda_package_requirements.txt"
    lines = []
    for line in requirements.read_text().splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        lower = stripped.lower()
        if lower.startswith(("boto3", "botocore")):
            continue
        if lower.startswith("agora-token-builder") and "agora_token_builder" not in source_text:
            continue
        lines.append(stripped)
    if not lines:
        return
    install_requirements.write_text("\n".join(lines) + "\n")
    print(f"Installing Lambda package dependencies into {target}")
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "--upgrade", "-r", str(install_requirements), "-t", str(target)],
            check=True,
        )
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(
            f"Failed to install Lambda dependencies from {install_requirements}. "
            "Check network access and package names, then rerun package_lambdas.py."
        ) from exc
    install_requirements.unlink(missing_ok=True)


def zip_directory(source_dir: Path, zip_path: Path) -> None:
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in source_dir.rglob("*"):
            if path.is_file() and should_include(path.relative_to(source_dir)):
                archive.write(path, path.relative_to(source_dir))


def package_lambda(source_file: Path) -> Path:
    function_stem = source_file.stem
    build_dir = dependency_target(function_stem)
    if build_dir.exists():
        shutil.rmtree(build_dir)
    build_dir.mkdir(parents=True, exist_ok=True)

    install_dependencies(build_dir, source_file)
    shutil.copy2(source_file, build_dir / source_file.name)

    zip_path = LAMBDA_DIST_DIR / f"{function_stem}.zip"
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    if zip_path.exists():
        zip_path.unlink()
    zip_directory(build_dir, zip_path)
    print(f"Packaged {source_file.relative_to(ROOT_DIR)} -> {zip_path.relative_to(ROOT_DIR)}")
    return zip_path


def main() -> None:
    load_dotenv()
    source_dir = lambda_source_dir()
    files = lambda_files()
    if not files:
        raise RuntimeError(f"No Lambda .py files found in {source_dir}")

    if LAMBDA_DIST_DIR.exists():
        shutil.rmtree(LAMBDA_DIST_DIR)
    LAMBDA_DIST_DIR.mkdir(parents=True, exist_ok=True)

    packaged = [str(package_lambda(path).relative_to(ROOT_DIR)) for path in files]
    write_outputs({"lambda_packages": packaged, "lambda_manifest": lambda_manifest()})
    print(f"\nPackaged {len(packaged)} Lambda function(s).")


if __name__ == "__main__":
    main()
