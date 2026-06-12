import json
import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
notifications_table = dynamodb.Table("Notifications")


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def cors_headers():
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,OPTIONS"
    }


def build_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": cors_headers(),
        "body": json.dumps(body, cls=DecimalEncoder)
    }


def lambda_handler(event, context):
    try:
        print("Event:", json.dumps(event))

        if event.get("httpMethod") == "OPTIONS":
            return build_response(200, {"message": "CORS OK"})

        path_params = event.get("pathParameters") or {}
        user_id = path_params.get("userId")

        if not user_id:
            return build_response(400, {"message": "Missing userId"})

        response = notifications_table.query(
            KeyConditionExpression=Key("userId").eq(user_id)
        )

        notifications = response.get("Items", [])

        notifications.sort(
            key=lambda item: item.get("createdAt", ""),
            reverse=True
        )

        return build_response(200, {
            "notifications": notifications
        })

    except Exception as e:
        print("Error getting notifications:", str(e))

        return build_response(500, {
            "message": "Failed to get notifications",
            "error": str(e)
        })