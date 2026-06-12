import json
import boto3
from datetime import datetime, timezone
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table("Users")


class DynamoDBEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, set):
            return list(obj)

        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            return float(obj)

        return super(DynamoDBEncoder, self).default(obj)


def build_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "PATCH,OPTIONS"
        },
        "body": json.dumps(body, cls=DynamoDBEncoder)
    }


def lambda_handler(event, context):
    try:
        if event.get("httpMethod") == "OPTIONS":
            return build_response(200, {"message": "CORS OK"})

        path_params = event.get("pathParameters") or {}
        user_id = path_params.get("userId")

        if not user_id:
            return build_response(400, {"error": "userId is required"})

        body = json.loads(event.get("body") or "{}")
        status = body.get("status", "").strip().upper()

        allowed_statuses = {"ACTIVE", "BLOCKED"}

        if status not in allowed_statuses:
            return build_response(400, {
                "error": "status must be ACTIVE or BLOCKED"
            })

        now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        result = users_table.update_item(
            Key={
                "userId": user_id
            },
            UpdateExpression="""
                SET #status = :status,
                    updatedAt = :updatedAt
            """,
            ExpressionAttributeNames={
                "#status": "status"
            },
            ExpressionAttributeValues={
                ":status": status,
                ":updatedAt": now
            },
            ReturnValues="ALL_NEW"
        )

        return build_response(200, {
            "message": "User status updated successfully",
            "user": result.get("Attributes", {})
        })

    except Exception as e:
        print("Error updating user status:", str(e))
        return build_response(500, {"error": str(e)})