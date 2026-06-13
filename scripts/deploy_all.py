#!/usr/bin/env python3
"""Run the complete BidIt AWS deployment workflow."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
STEPS = [
    "setup_aws_resources.py",
    "package_lambdas.py",
    "deploy_lambdas.py",
    "deploy_step_functions.py",
    "deploy_lambdas.py",  # redeploys createAuction with the generated STEP_FUNCTION_ARN from outputs
    "configure_api_gateway.py",
]


def run_step(script: str) -> None:
    print(f"\n=== Running {script} ===")
    try:
        subprocess.run([sys.executable, str(SCRIPT_DIR / script)], check=True)
    except subprocess.CalledProcessError as exc:
        raise SystemExit(f"Deployment stopped because {script} failed with exit code {exc.returncode}.") from exc


def main() -> None:
    for step in STEPS:
        run_step(step)
    print("\nBidIt deployment complete. Review dist/deployment_outputs.json for generated resource identifiers.")


if __name__ == "__main__":
    main()
