#!/usr/bin/env python3
"""Create or update the BidIt auction-closing Step Functions workflow."""
from __future__ import annotations

import json

import boto3
from botocore.exceptions import ClientError

from common import boto_tags, env, load_dotenv, read_outputs, region, write_outputs


def lambda_arn(lambda_client, stem: str) -> str:
    outputs = read_outputs().get("lambda_functions", {})
    if stem in outputs and outputs[stem].get("function_arn"):
        return outputs[stem]["function_arn"]
    function_name = env(f"LAMBDA_NAME_{stem}", f"{env('PROJECT_NAME', 'BidIt')}-{stem}")
    return lambda_client.get_function_configuration(FunctionName=function_name)["FunctionArn"]


def build_definition(check_arn: str, process_arn: str) -> dict:
    return {
        "Comment": "BidIt auction closing workflow. Waits until endTime, checks status, processes winner, or waits again after anti-sniping extensions.",
        "StartAt": "WaitUntilAuctionEnd",
        "States": {
            "WaitUntilAuctionEnd": {
                "Type": "Wait",
                "TimestampPath": "$.endTime",
                "Next": "CheckAuctionStatus",
            },
            "CheckAuctionStatus": {
                "Type": "Task",
                "Resource": "arn:aws:states:::lambda:invoke",
                "Parameters": {
                    "FunctionName": check_arn,
                    "Payload": {
                        "auctionId.$": "$.auctionId",
                    },
                },
                "ResultPath": "$.checkResult",
                "Next": "AuctionOverChoice",
            },
            "AuctionOverChoice": {
                "Type": "Choice",
                "Choices": [
                    {
                        "Variable": "$.checkResult.Payload.isAuctionOver",
                        "BooleanEquals": True,
                        "Next": "ProcessAuctionWinner",
                    }
                ],
                "Default": "WaitUntilUpdatedEndTime",
            },
            "WaitUntilUpdatedEndTime": {
                "Type": "Wait",
                "TimestampPath": "$.checkResult.Payload.endTime",
                "Next": "CheckAuctionStatusAgain",
            },
            "CheckAuctionStatusAgain": {
                "Type": "Pass",
                "Parameters": {
                    "auctionId.$": "$.auctionId",
                    "endTime.$": "$.checkResult.Payload.endTime",
                },
                "Next": "CheckAuctionStatus",
            },
            "ProcessAuctionWinner": {
                "Type": "Task",
                "Resource": "arn:aws:states:::lambda:invoke",
                "Parameters": {
                    "FunctionName": process_arn,
                    "Payload": {
                        "auctionId.$": "$.auctionId",
                    },
                },
                "End": True,
            },
        },
    }


def find_state_machine(sfn_client, name: str) -> str | None:
    paginator = sfn_client.get_paginator("list_state_machines")
    for page in paginator.paginate():
        for machine in page.get("stateMachines", []):
            if machine["name"] == name:
                return machine["stateMachineArn"]
    return None


def main() -> None:
    load_dotenv()
    session = boto3.Session(region_name=region())
    sfn_client = session.client("stepfunctions")
    lambda_client = session.client("lambda")
    role_arn = env("STEP_FUNCTION_ROLE_ARN", read_outputs().get("step_function_role_arn", ""), required=True)
    name = env("STEP_FUNCTION_NAME", "WinnerMachine")

    definition = json.dumps(
        build_definition(
            check_arn=lambda_arn(lambda_client, "CheckAuctionStatus"),
            process_arn=lambda_arn(lambda_client, "ProcessAuctionWinner"),
        ),
        indent=2,
    )

    state_machine_arn = find_state_machine(sfn_client, name)
    if state_machine_arn:
        print(f"Updating Step Functions state machine: {name}")
        sfn_client.update_state_machine(
            stateMachineArn=state_machine_arn,
            definition=definition,
            roleArn=role_arn,
        )
    else:
        print(f"Creating Step Functions state machine: {name}")
        state_machine_arn = sfn_client.create_state_machine(
            name=name,
            definition=definition,
            roleArn=role_arn,
            type="STANDARD",
            tags=boto_tags(),
        )["stateMachineArn"]

    write_outputs({"step_function_name": name, "step_function_arn": state_machine_arn})
    print(f"Step Functions state machine ready: {state_machine_arn}")
    print("Note: set STEP_FUNCTION_ARN to this value before redeploying createAuction if it changed.")


if __name__ == "__main__":
    main()
