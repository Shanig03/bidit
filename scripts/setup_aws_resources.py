#!/usr/bin/env python3
"""Create or verify core AWS resources for BidIt."""
from __future__ import annotations

import json
import time
from typing import Any

import boto3
from botocore.exceptions import ClientError

from common import (
    boto_tags,
    default_tags,
    env,
    ensure_aws_identity,
    lambda_function_name,
    load_dotenv,
    project_name,
    region,
    table_names,
    write_outputs,
)

# DynamoDB key assumptions are derived from current Lambda code:
# - Users: get_item/update_item use userId.
# - Auctions: get_item/update_item use auctionId.
# - Bids: getAuctionBids queries auctionId and getUserBids queries GSI bidderId-placedAt-index.
# - Notifications: getNotifications queries userId; ProcessAuctionWinner writes notificationId.
# - Favorites is included for delivery completeness, although current favorite Lambdas store favorites on Users.


def wait_for_table(dynamodb_client, table_name: str) -> None:
    waiter = dynamodb_client.get_waiter("table_exists")
    waiter.wait(TableName=table_name)


def create_table_if_missing(dynamodb_client, spec: dict[str, Any]) -> None:
    table_name = spec["TableName"]
    try:
        dynamodb_client.describe_table(TableName=table_name)
        print(f"DynamoDB table exists: {table_name}")
        return
    except ClientError as exc:
        if exc.response["Error"]["Code"] != "ResourceNotFoundException":
            raise

    print(f"Creating DynamoDB table: {table_name}")
    dynamodb_client.create_table(**spec, Tags=boto_tags())
    wait_for_table(dynamodb_client, table_name)
    print(f"Created DynamoDB table: {table_name}")


def ensure_dynamodb_tables(dynamodb_client) -> None:
    names = table_names()
    billing = {"BillingMode": "PAY_PER_REQUEST"}
    table_specs = [
        {
            "TableName": names["users"],
            "AttributeDefinitions": [{"AttributeName": "userId", "AttributeType": "S"}],
            "KeySchema": [{"AttributeName": "userId", "KeyType": "HASH"}],
            **billing,
        },
        {
            "TableName": names["auctions"],
            "AttributeDefinitions": [{"AttributeName": "auctionId", "AttributeType": "S"}],
            "KeySchema": [{"AttributeName": "auctionId", "KeyType": "HASH"}],
            **billing,
        },
        {
            "TableName": names["bids"],
            "AttributeDefinitions": [
                {"AttributeName": "auctionId", "AttributeType": "S"},
                {"AttributeName": "placedAt", "AttributeType": "S"},
                {"AttributeName": "bidderId", "AttributeType": "S"},
            ],
            "KeySchema": [
                {"AttributeName": "auctionId", "KeyType": "HASH"},
                {"AttributeName": "placedAt", "KeyType": "RANGE"},
            ],
            "GlobalSecondaryIndexes": [
                {
                    "IndexName": "bidderId-placedAt-index",
                    "KeySchema": [
                        {"AttributeName": "bidderId", "KeyType": "HASH"},
                        {"AttributeName": "placedAt", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                }
            ],
            **billing,
        },
        {
            "TableName": names["notifications"],
            "AttributeDefinitions": [
                {"AttributeName": "userId", "AttributeType": "S"},
                {"AttributeName": "notificationId", "AttributeType": "S"},
            ],
            "KeySchema": [
                {"AttributeName": "userId", "KeyType": "HASH"},
                {"AttributeName": "notificationId", "KeyType": "RANGE"},
            ],
            **billing,
        },
        {
            "TableName": names["favorites"],
            "AttributeDefinitions": [
                {"AttributeName": "userId", "AttributeType": "S"},
                {"AttributeName": "auctionId", "AttributeType": "S"},
            ],
            "KeySchema": [
                {"AttributeName": "userId", "KeyType": "HASH"},
                {"AttributeName": "auctionId", "KeyType": "RANGE"},
            ],
            **billing,
        },
    ]

    for spec in table_specs:
        create_table_if_missing(dynamodb_client, spec)


def ensure_s3_bucket(s3_client) -> None:
    bucket = env("S3_BUCKET_NAME", required=True)
    aws_region = region()

    try:
        s3_client.head_bucket(Bucket=bucket)
        print(f"S3 bucket exists: {bucket}")
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code")
        if code not in {"404", "NoSuchBucket", "NotFound"}:
            raise
        print(f"Creating S3 bucket: {bucket}")
        kwargs: dict[str, Any] = {"Bucket": bucket}
        if aws_region != "us-east-1":
            kwargs["CreateBucketConfiguration"] = {"LocationConstraint": aws_region}
        s3_client.create_bucket(**kwargs)

    s3_client.put_public_access_block(
        Bucket=bucket,
        PublicAccessBlockConfiguration={
            "BlockPublicAcls": True,
            "IgnorePublicAcls": True,
            "BlockPublicPolicy": True,
            "RestrictPublicBuckets": True,
        },
    )
    s3_client.put_bucket_cors(
        Bucket=bucket,
        CORSConfiguration={
            "CORSRules": [
                {
                    "AllowedHeaders": ["*"],
                    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
                    "AllowedOrigins": ["*"],
                    "ExposeHeaders": ["ETag"],
                    "MaxAgeSeconds": 3000,
                }
            ]
        },
    )
    s3_client.put_bucket_tagging(Bucket=bucket, Tagging={"TagSet": boto_tags()})
    print(f"Configured private S3 bucket CORS/public access block: {bucket}")


def assume_role_policy(service: str) -> str:
    return json.dumps(
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": service},
                    "Action": "sts:AssumeRole",
                }
            ],
        }
    )


def ensure_role(iam_client, name: str, service: str, description: str) -> str:
    try:
        role = iam_client.get_role(RoleName=name)["Role"]
        print(f"IAM role exists: {name}")
        return role["Arn"]
    except ClientError as exc:
        if exc.response["Error"]["Code"] != "NoSuchEntity":
            raise

    print(f"Creating IAM role: {name}")
    role = iam_client.create_role(
        RoleName=name,
        AssumeRolePolicyDocument=assume_role_policy(service),
        Description=description,
        Tags=boto_tags(),
    )["Role"]
    time.sleep(5)
    return role["Arn"]


def put_inline_policy(iam_client, role_name: str, policy_name: str, document: dict[str, Any]) -> None:
    iam_client.put_role_policy(
        RoleName=role_name,
        PolicyName=policy_name,
        PolicyDocument=json.dumps(document),
    )
    print(f"Attached/updated inline policy {policy_name} on {role_name}")


def ensure_iam(iam_client, sts_client) -> dict[str, str]:
    account_id = ensure_aws_identity(sts_client)["Account"]
    aws_region = region()
    names = table_names()
    bucket = env("S3_BUCKET_NAME", required=True)
    lambda_role_name = env("LAMBDA_ROLE_NAME", f"{project_name()}LambdaExecutionRole")
    sfn_role_name = env("STEP_FUNCTION_ROLE_NAME", f"{project_name()}StepFunctionsRole")

    lambda_role_arn = ensure_role(
        iam_client,
        lambda_role_name,
        "lambda.amazonaws.com",
        "Execution role for BidIt Lambda functions.",
    )
    step_role_arn = ensure_role(
        iam_client,
        sfn_role_name,
        "states.amazonaws.com",
        "Execution role for BidIt Step Functions workflows.",
    )

    table_arns = [f"arn:aws:dynamodb:{aws_region}:{account_id}:table/{name}" for name in names.values()]
    table_index_arns = [f"{arn}/index/*" for arn in table_arns]
    lambda_arns = [f"arn:aws:lambda:{aws_region}:{account_id}:function:{lambda_function_name('*')}"]

    put_inline_policy(
        iam_client,
        lambda_role_name,
        "BidItLambdaAccessPolicy",
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
                    "Resource": "arn:aws:logs:*:*:*",
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:BatchGetItem", "dynamodb:BatchWriteItem", "dynamodb:DeleteItem",
                        "dynamodb:DescribeTable", "dynamodb:GetItem", "dynamodb:PutItem",
                        "dynamodb:Query", "dynamodb:Scan", "dynamodb:UpdateItem",
                    ],
                    "Resource": table_arns + table_index_arns,
                },
                {
                    "Effect": "Allow",
                    "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
                    "Resource": f"arn:aws:s3:::{bucket}/*",
                },
                {
                    "Effect": "Allow",
                    "Action": ["states:StartExecution"],
                    "Resource": f"arn:aws:states:{aws_region}:{account_id}:stateMachine:{env('STEP_FUNCTION_NAME', 'WinnerMachine')}",
                },
            ],
        },
    )

    put_inline_policy(
        iam_client,
        sfn_role_name,
        "BidItStepFunctionsInvokePolicy",
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["lambda:InvokeFunction"],
                    "Resource": lambda_arns,
                }
            ],
        },
    )

    return {"lambda_role_arn": lambda_role_arn, "step_function_role_arn": step_role_arn}


def main() -> None:
    load_dotenv()
    session = boto3.Session(region_name=region())
    dynamodb_client = session.client("dynamodb")
    s3_client = session.client("s3")
    iam_client = session.client("iam")
    sts_client = session.client("sts")

    ensure_aws_identity(sts_client)
    ensure_dynamodb_tables(dynamodb_client)
    ensure_s3_bucket(s3_client)
    role_outputs = ensure_iam(iam_client, sts_client)

    outputs = {
        **role_outputs,
        "aws_region": region(),
        "project_name": project_name(),
        "s3_bucket_name": env("S3_BUCKET_NAME"),
        "dynamodb_tables": table_names(),
        "tags": default_tags(),
    }
    write_outputs(outputs)
    print("\nAWS resource setup complete. Outputs written to dist/deployment_outputs.json")


if __name__ == "__main__":
    main()
