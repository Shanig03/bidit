#!/usr/bin/env python3
"""Import the BidIt Swagger/OpenAPI file into API Gateway and deploy a stage."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import boto3
from botocore.exceptions import ClientError

from common import ROOT_DIR, env, lambda_function_name, load_dotenv, read_outputs, region, replace_placeholders, write_outputs


def swagger_path() -> Path:
    candidates = [
        ROOT_DIR / "api" / "swagger_api_gateway.json",
        ROOT_DIR / "api" / "swagger.json",
        ROOT_DIR / "api" / "openapi.json",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise RuntimeError("No Swagger/OpenAPI file found in api/. Expected swagger_api_gateway.json or swagger.json.")


def load_swagger(lambda_client) -> dict[str, Any]:
    spec = json.loads(swagger_path().read_text())
    replacements = {}
    lambda_outputs = read_outputs().get("lambda_functions", {})
    stems = set()
    for path_item in spec.get("paths", {}).values():
        for operation in path_item.values():
            if isinstance(operation, dict) and operation.get("x-bidit-lambda"):
                stems.add(operation["x-bidit-lambda"])
    for stem in stems:
        arn = lambda_outputs.get(stem, {}).get("function_arn")
        if not arn:
            function_name = lambda_function_name(stem)
            arn = lambda_client.get_function_configuration(FunctionName=function_name)["FunctionArn"]
        replacements[f"{stem}InvokeUri"] = f"arn:aws:apigateway:{region()}:lambda:path/2015-03-31/functions/{arn}/invocations"
    return replace_placeholders(spec, replacements)


def find_rest_api(apigw_client, name: str) -> str | None:
    paginator = apigw_client.get_paginator("get_rest_apis")
    for page in paginator.paginate():
        for item in page.get("items", []):
            if item.get("name") == name:
                return item["id"]
    return None


def import_or_update_api(apigw_client, spec: dict[str, Any], name: str) -> str:
    body = json.dumps(spec).encode("utf-8")
    api_id = find_rest_api(apigw_client, name)
    if api_id:
        print(f"Updating REST API {name} ({api_id}) from Swagger")
        apigw_client.put_rest_api(restApiId=api_id, mode="overwrite", body=body)
    else:
        print(f"Creating REST API {name} from Swagger")
        response = apigw_client.import_rest_api(
            parameters={"endpointConfigurationTypes": "REGIONAL"},
            body=body,
        )
        api_id = response["id"]
        apigw_client.update_rest_api(
            restApiId=api_id,
            patchOperations=[{"op": "replace", "path": "/name", "value": name}],
        )
    return api_id


def source_arn(account_id: str, api_id: str, method: str, path: str) -> str:
    arn_path = re.sub(r"\{[^}]+\}", "*", path).lstrip("/")
    return f"arn:aws:execute-api:{region()}:{account_id}:{api_id}/*/{method.upper()}/{arn_path}"


def add_lambda_permissions(lambda_client, account_id: str, api_id: str, spec: dict[str, Any]) -> None:
    for path, path_item in spec.get("paths", {}).items():
        for method, operation in path_item.items():
            if method.lower() == "options" or not isinstance(operation, dict):
                continue
            stem = operation.get("x-bidit-lambda")
            if not stem:
                continue
            function_name = lambda_function_name(stem)
            statement_id = f"apigw-{api_id}-{method}-{re.sub('[^A-Za-z0-9]', '-', path).strip('-')}"[:100]
            try:
                lambda_client.add_permission(
                    FunctionName=function_name,
                    StatementId=statement_id,
                    Action="lambda:InvokeFunction",
                    Principal="apigateway.amazonaws.com",
                    SourceArn=source_arn(account_id, api_id, method, path),
                )
                print(f"Added API Gateway invoke permission for {function_name} {method.upper()} {path}")
            except ClientError as exc:
                if exc.response["Error"]["Code"] == "ResourceConflictException":
                    print(f"Lambda permission already exists for {function_name} {method.upper()} {path}")
                    continue
                raise


def main() -> None:
    load_dotenv()
    session = boto3.Session(region_name=region())
    apigw_client = session.client("apigateway")
    lambda_client = session.client("lambda")
    sts_client = session.client("sts")
    account_id = sts_client.get_caller_identity()["Account"]

    name = env("API_GATEWAY_NAME", f"{env('PROJECT_NAME', 'BidIt')}Api")
    stage = env("API_STAGE_NAME", "dev")
    spec = load_swagger(lambda_client)
    api_id = import_or_update_api(apigw_client, spec, name)
    add_lambda_permissions(lambda_client, account_id, api_id, spec)

    print(f"Deploying REST API {api_id} to stage {stage}")
    apigw_client.create_deployment(restApiId=api_id, stageName=stage, description="BidIt scripted deployment")
    invoke_url = f"https://{api_id}.execute-api.{region()}.amazonaws.com/{stage}"
    write_outputs({"api_gateway_id": api_id, "api_gateway_name": name, "api_stage_name": stage, "api_invoke_url": invoke_url})
    print(f"API Gateway invoke URL: {invoke_url}")
    print("Use this value for VITE_API_BASE_URL in frontend/.env or the repository .env file.")


if __name__ == "__main__":
    main()
