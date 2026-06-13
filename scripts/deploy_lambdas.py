#!/usr/bin/env python3
"""Create or update BidIt Lambda functions."""
from __future__ import annotations

import json
import time
from pathlib import Path

import boto3
from botocore.exceptions import ClientError

from common import (
    LAMBDA_DIST_DIR,
    env,
    lambda_manifest,
    load_dotenv,
    read_outputs,
    region,
    table_names,
    write_outputs,
)

DEFAULT_TIMEOUT = 30
LONG_TIMEOUT_FUNCTIONS = {"generateAgoraToken": 10, "ProcessAuctionWinner": 60, "CheckAuctionStatus": 60}


def configured_step_function_arn() -> str:
    configured = env("STEP_FUNCTION_ARN", "")
    if configured and "123456789012" not in configured:
        return configured
    return read_outputs().get("step_function_arn", configured)


def lambda_environment() -> dict[str, str]:
    names = table_names()
    values = {
        "USERS_TABLE_NAME": names["users"],
        "AUCTIONS_TABLE_NAME": names["auctions"],
        "BIDS_TABLE_NAME": names["bids"],
        "FAVORITES_TABLE_NAME": names["favorites"],
        "NOTIFICATIONS_TABLE_NAME": names["notifications"],
        "S3_BUCKET_NAME": env("S3_BUCKET_NAME", ""),
        "STEP_FUNCTION_ARN": configured_step_function_arn(),
        "AGORA_APP_ID": env("AGORA_APP_ID", env("VITE_AGORA_APP_ID", "")),
        "AGORA_APP_CERT": env("AGORA_APP_CERT", ""),
    }
    return {k: v for k, v in values.items() if v}


def get_role_arn() -> str:
    outputs = read_outputs()
    return env("LAMBDA_ROLE_ARN", outputs.get("lambda_role_arn", ""), required=True)


def wait_for_update(lambda_client, function_name: str) -> None:
    while True:
        config = lambda_client.get_function_configuration(FunctionName=function_name)
        status = config.get("LastUpdateStatus")
        if status in (None, "Successful"):
            return
        if status == "Failed":
            raise RuntimeError(f"Lambda update failed for {function_name}: {config.get('LastUpdateStatusReason')}")
        time.sleep(2)


def create_or_update(lambda_client, stem: str, meta: dict[str, str], role_arn: str) -> dict[str, str]:
    function_name = meta["function_name"]
    zip_path = LAMBDA_DIST_DIR / f"{stem}.zip"
    if not zip_path.exists():
        raise RuntimeError(f"Missing package {zip_path}. Run scripts/package_lambdas.py first.")
    zip_bytes = zip_path.read_bytes()

    config = {
        "Runtime": env("LAMBDA_RUNTIME", "python3.12"),
        "Role": role_arn,
        "Handler": meta["handler"],
        "Timeout": int(env(f"LAMBDA_TIMEOUT_{stem}", str(LONG_TIMEOUT_FUNCTIONS.get(stem, DEFAULT_TIMEOUT)))),
        "MemorySize": int(env("LAMBDA_MEMORY_MB", "256")),
        "Environment": {"Variables": lambda_environment()},
    }

    try:
        lambda_client.get_function(FunctionName=function_name)
        print(f"Updating Lambda code: {function_name}")
        lambda_client.update_function_code(FunctionName=function_name, ZipFile=zip_bytes, Publish=True)
        wait_for_update(lambda_client, function_name)
        print(f"Updating Lambda configuration: {function_name}")
        lambda_client.update_function_configuration(FunctionName=function_name, **config)
        wait_for_update(lambda_client, function_name)
    except ClientError as exc:
        if exc.response["Error"]["Code"] != "ResourceNotFoundException":
            raise
        print(f"Creating Lambda function: {function_name}")
        lambda_client.create_function(
            FunctionName=function_name,
            Code={"ZipFile": zip_bytes},
            PackageType="Zip",
            Publish=True,
            Tags={"Project": env("PROJECT_NAME", "BidIt"), "Environment": env("ENVIRONMENT", env("API_STAGE_NAME", "dev")), "CreatedBy": "BidItDeploymentScripts"},
            **config,
        )
        wait_for_update(lambda_client, function_name)

    final_config = lambda_client.get_function_configuration(FunctionName=function_name)
    return {
        "function_name": function_name,
        "function_arn": final_config["FunctionArn"],
        "handler": final_config["Handler"],
        "runtime": final_config["Runtime"],
        "timeout": final_config["Timeout"],
        "memory": final_config["MemorySize"],
    }


def main() -> None:
    load_dotenv()
    session = boto3.Session(region_name=region())
    lambda_client = session.client("lambda")
    role_arn = get_role_arn()
    manifest = lambda_manifest()
    if not manifest:
        raise RuntimeError("No Lambda source files were found.")

    deployed = {}
    for stem, meta in manifest.items():
        deployed[stem] = create_or_update(lambda_client, stem, meta, role_arn)

    write_outputs({"lambda_functions": deployed})
    print("\nLambda deployment summary:")
    print(json.dumps(deployed, indent=2, default=str))


if __name__ == "__main__":
    main()
