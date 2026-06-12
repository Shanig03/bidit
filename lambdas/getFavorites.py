import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table("Users")
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
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "GET,OPTIONS"
        },
        "body": json.dumps(body, default=decimal_default)
    }


def lambda_handler(event, context):
    try:
        if event.get("httpMethod") == "OPTIONS":
            return build_response(200, {"message": "CORS OK"})

        path_params = event.get("pathParameters") or {}
        user_id = path_params.get("userId")

        if not user_id:
            return build_response(400, {"error": "userId is required"})

        user_response = users_table.get_item(Key={"userId": user_id})
        user_item = user_response.get("Item", {})
        favorite_auctions = user_item.get("favoriteAuctions", set())

        if not favorite_auctions:
            return build_response(200, [])

        keys = [{"auctionId": a_id} for a_id in favorite_auctions]
        favorite_list = []

        for i in range(0, len(keys), 100):
            batch_keys = keys[i:i+100]
            response = dynamodb.batch_get_item(
                RequestItems={
                    "Auctions": {
                        "Keys": batch_keys
                    }
                }
            )
            fetched_auctions = response.get("Responses", {}).get("Auctions", [])
            favorite_list.extend(fetched_auctions)

        return build_response(200, favorite_list)

    except Exception as e:
        print(f"get_favorites error: {str(e)}")
        return build_response(500, {"error": str(e)})