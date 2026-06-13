#!/usr/bin/env python3
"""Safely remove BidIt resources from a test AWS account."""
from __future__ import annotations

import sys

import boto3
from botocore.exceptions import ClientError

from common import env, lambda_manifest, load_dotenv, project_name, read_outputs, region, table_names


def confirm() -> bool:
    print("WARNING: This cleanup deletes BidIt test resources in the configured AWS account.")
    print("It deletes Lambda functions, Step Functions state machine, API Gateway REST API, and IAM roles created by the scripts.")
    print("DynamoDB tables and the S3 bucket are deleted only if DELETE_DATA=true is set.")
    answer = input("Type DELETE BidIt to continue: ").strip()
    return answer == "DELETE BidIt"


def delete_lambdas(lambda_client) -> None:
    for meta in lambda_manifest().values():
        name = meta["function_name"]
        try:
            lambda_client.delete_function(FunctionName=name)
            print(f"Deleted Lambda: {name}")
        except ClientError as exc:
            if exc.response["Error"]["Code"] != "ResourceNotFoundException":
                raise
            print(f"Lambda not found: {name}")


def delete_state_machine(sfn_client) -> None:
    arn = read_outputs().get("step_function_arn") or env("STEP_FUNCTION_ARN", "")
    name = env("STEP_FUNCTION_NAME", "WinnerMachine")
    if not arn:
        for page in sfn_client.get_paginator("list_state_machines").paginate():
            for machine in page.get("stateMachines", []):
                if machine["name"] == name:
                    arn = machine["stateMachineArn"]
                    break
    if not arn:
        print("Step Functions state machine not found.")
        return
    try:
        sfn_client.delete_state_machine(stateMachineArn=arn)
        print(f"Deleted Step Functions state machine: {arn}")
    except ClientError as exc:
        if exc.response["Error"]["Code"] != "StateMachineDoesNotExist":
            raise
        print(f"Step Functions state machine not found: {arn}")


def delete_api(apigw_client) -> None:
    api_id = read_outputs().get("api_gateway_id")
    name = env("API_GATEWAY_NAME", f"{project_name()}Api")
    if not api_id:
        for page in apigw_client.get_paginator("get_rest_apis").paginate():
            for item in page.get("items", []):
                if item.get("name") == name:
                    api_id = item["id"]
                    break
    if not api_id:
        print("API Gateway REST API not found.")
        return
    try:
        apigw_client.delete_rest_api(restApiId=api_id)
        print(f"Deleted API Gateway REST API: {api_id}")
    except ClientError as exc:
        if exc.response["Error"]["Code"] != "NotFoundException":
            raise
        print(f"API Gateway REST API not found: {api_id}")


def empty_and_delete_bucket(s3_resource, s3_client) -> None:
    bucket_name = env("S3_BUCKET_NAME", "")
    if not bucket_name:
        print("S3_BUCKET_NAME is not set; skipping bucket deletion.")
        return
    bucket = s3_resource.Bucket(bucket_name)
    try:
        bucket.objects.all().delete()
        bucket.object_versions.all().delete()
        s3_client.delete_bucket(Bucket=bucket_name)
        print(f"Emptied and deleted S3 bucket: {bucket_name}")
    except ClientError as exc:
        code = exc.response["Error"]["Code"]
        if code in {"NoSuchBucket", "404"}:
            print(f"S3 bucket not found: {bucket_name}")
            return
        raise


def delete_tables(dynamodb_client) -> None:
    for table_name in table_names().values():
        try:
            dynamodb_client.delete_table(TableName=table_name)
            print(f"Deleted DynamoDB table: {table_name}")
        except ClientError as exc:
            if exc.response["Error"]["Code"] != "ResourceNotFoundException":
                raise
            print(f"DynamoDB table not found: {table_name}")


def delete_roles(iam_client) -> None:
    for role_name in [env("LAMBDA_ROLE_NAME", f"{project_name()}LambdaExecutionRole"), env("STEP_FUNCTION_ROLE_NAME", f"{project_name()}StepFunctionsRole")]:
        try:
            for policy in iam_client.list_role_policies(RoleName=role_name).get("PolicyNames", []):
                iam_client.delete_role_policy(RoleName=role_name, PolicyName=policy)
            iam_client.delete_role(RoleName=role_name)
            print(f"Deleted IAM role: {role_name}")
        except ClientError as exc:
            if exc.response["Error"]["Code"] != "NoSuchEntity":
                raise
            print(f"IAM role not found: {role_name}")


def main() -> None:
    load_dotenv()
    if not confirm():
        print("Cleanup cancelled.")
        return
    session = boto3.Session(region_name=region())
    delete_api(session.client("apigateway"))
    delete_state_machine(session.client("stepfunctions"))
    delete_lambdas(session.client("lambda"))
    delete_roles(session.client("iam"))

    if env("DELETE_DATA", "false").lower() == "true":
        print("DELETE_DATA=true set; deleting DynamoDB tables and S3 bucket data.")
        delete_tables(session.client("dynamodb"))
        empty_and_delete_bucket(session.resource("s3"), session.client("s3"))
    else:
        print("Skipped DynamoDB/S3 data deletion. Set DELETE_DATA=true to delete tables and the image bucket.")


if __name__ == "__main__":
    main()
