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

        path_params = event.get("pathParameters") or {}
        auction_id = path_params.get("auctionId")

        if not auction_id:
            return build_response(400, {"error": "auctionId is required"})

        result = auctions_table.get_item(
            Key={
                "auctionId": auction_id
            }
        )

        auction = result.get("Item")

        if not auction:
            return build_response(404, {"error": "Auction not found"})

        return build_response(200, {
            "auction": auction
        })

    except Exception as e:
        return build_response(500, {"error": str(e)})