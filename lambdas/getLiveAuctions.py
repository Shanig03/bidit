import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
auctions_table = dynamodb.Table("Auctions")


def decimal_default(obj):
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    raise TypeError


def build_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,OPTIONS"
        },
        "body": json.dumps(body, default=decimal_default)
    }


def lambda_handler(event, context):
    try:
        if event.get("httpMethod") == "OPTIONS":
            return build_response(200, {"message": "CORS OK"})

        result = auctions_table.scan()
        auctions = result.get("Items", [])

        live_auctions = [
            auction for auction in auctions
            if auction.get("status") == "LIVE"
        ]

        live_auctions.sort(
            key=lambda auction: auction.get("createdAt", ""),
            reverse=True
        )

        return build_response(200, {
            "auctions": live_auctions
        })

    except Exception as e:
        return build_response(500, {
            "error": str(e)
        })