import json
import boto3
from datetime import datetime, timezone
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
auctions_table = dynamodb.Table("Auctions")


def build_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "PATCH,OPTIONS"
        },
        "body": json.dumps(body, default=str)
    }


def to_decimal_if_number(value):
    if value is None or value == "":
        return None

    try:
        return Decimal(str(value))
    except Exception:
        return value


def clean_image_keys(value):
    if not isinstance(value, list):
        return []

    cleaned_keys = []

    for image_key in value:
        if isinstance(image_key, str) and image_key.strip():
            cleaned_keys.append(image_key.strip())

    return cleaned_keys[:6]


def lambda_handler(event, context):
    try:
        if event.get("httpMethod") == "OPTIONS":
            return build_response(200, {"message": "CORS OK"})

        path_params = event.get("pathParameters") or {}
        auction_id = path_params.get("auctionId")

        if not auction_id:
            return build_response(400, {"error": "auctionId is required"})

        body = json.loads(event.get("body") or "{}")

        allowed_fields = {
            "title",
            "description",
            "category",
            "startsAt",
            "endsAt",
            "status",
            "imageUrl",
            "imageKey",
            "imageKeys",
            "startingPrice",
            "currentPrice",
            "agoraChannelName",
            "videoProfile"
        }

        update_parts = []
        expression_values = {}
        expression_names = {}

        for field in allowed_fields:
            if field in body:
                placeholder_name = f"#{field}"
                placeholder_value = f":{field}"

                expression_names[placeholder_name] = field

                if field in ["startingPrice", "currentPrice"]:
                    expression_values[placeholder_value] = to_decimal_if_number(body[field])

                elif field == "imageKeys":
                    expression_values[placeholder_value] = clean_image_keys(body[field])

                else:
                    value = body[field]

                    if isinstance(value, str):
                        value = value.strip()

                    expression_values[placeholder_value] = value

                update_parts.append(f"{placeholder_name} = {placeholder_value}")

        if not update_parts:
            return build_response(400, {"error": "No valid fields provided to update"})

        now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        update_parts.append("#updatedAt = :updatedAt")
        expression_names["#updatedAt"] = "updatedAt"
        expression_values[":updatedAt"] = now

        result = auctions_table.update_item(
            Key={
                "auctionId": auction_id
            },
            UpdateExpression="SET " + ", ".join(update_parts),
            ExpressionAttributeNames=expression_names,
            ExpressionAttributeValues=expression_values,
            ReturnValues="ALL_NEW"
        )

        return build_response(200, {
            "message": "Auction updated successfully",
            "auction": result.get("Attributes")
        })

    except Exception as e:
        print("Error updating auction:", str(e))
        return build_response(500, {"error": str(e)})