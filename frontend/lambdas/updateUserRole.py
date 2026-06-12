import json
import boto3
from datetime import datetime, timezone
from decimal import Decimal
from botocore.exceptions import ClientError

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

        if not user_id or user_id == "undefined":
            return build_response(400, {"error": "Valid userId is required"})

        body = json.loads(event.get("body") or "{}")
        role = body.get("role", "").strip().upper()

        allowed_roles = {"USER", "ADMIN"}

        if role not in allowed_roles:
            return build_response(400, {
                "error": "role must be USER or ADMIN"
            })

        now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        result = users_table.update_item(
            Key={
                "userId": user_id
            },
            UpdateExpression="""
                SET #role = :role,
                    updatedAt = :updatedAt
            """,
            ConditionExpression="attribute_exists(userId)",
            ExpressionAttributeNames={
                "#role": "role"
            },
            ExpressionAttributeValues={
                ":role": role,
                ":updatedAt": now
            },
            ReturnValues="ALL_NEW"
        )

        return build_response(200, {
            "message": "User role updated successfully",
            "user": result.get("Attributes", {})
        })

    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return build_response(404, {
                "error": "User not found. Role was not updated."
            })

        print("DynamoDB error updating user role:", str(e))
        return build_response(500, {"error": str(e)})

    except Exception as e:
        print("Error updating user role:", str(e))
        return build_response(500, {"error": str(e)})