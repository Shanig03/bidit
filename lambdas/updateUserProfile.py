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
            "Access-Control-Allow-Methods": "GET,PATCH,OPTIONS"
        },
        "body": json.dumps(body, cls=DynamoDBEncoder)
    }


def get_http_method(event):
    return (
        event.get("httpMethod")
        or event.get("requestContext", {}).get("http", {}).get("method")
        or ""
    ).upper()


def lambda_handler(event, context):
    try:
        method = get_http_method(event)

        if method == "OPTIONS":
            return build_response(200, {"message": "CORS OK"})

        path_params = event.get("pathParameters") or {}
        user_id = path_params.get("userId")

        if not user_id:
            return build_response(400, {"error": "userId is required"})

        if method == "GET":
            response = users_table.get_item(
                Key={
                    "userId": user_id
                }
            )

            user = response.get("Item")

            if not user:
                return build_response(404, {"error": "User not found"})

            return build_response(200, {
                "user": user
            })

        if method == "PATCH":
            body = json.loads(event.get("body") or "{}")

            display_name = body.get("displayName", "").strip()
            email = body.get("email", "").strip()
            bio = body.get("bio", "").strip()
            photo_url = body.get("photoURL", "").strip()
            profile_image_key = body.get("profileImageKey", "").strip()
            won_auction = body.get("wonAuction")

            if not display_name:
                return build_response(400, {"error": "displayName is required"})

            now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

            update_expression = """
                SET displayName = :displayName,
                    email = :email,
                    bio = :bio,
                    photoURL = :photoURL,
                    profileImageKey = :profileImageKey,
                    updatedAt = :updatedAt,
                    createdAt = if_not_exists(createdAt, :createdAt)
            """

            expression_attribute_values = {
                ":displayName": display_name,
                ":email": email,
                ":bio": bio,
                ":photoURL": photo_url,
                ":profileImageKey": profile_image_key,
                ":updatedAt": now,
                ":createdAt": now
            }

            if won_auction:
                update_expression += """,
                    wonAuctions = list_append(if_not_exists(wonAuctions, :emptyList), :newWonAuction)
                """

                expression_attribute_values[":emptyList"] = []
                expression_attribute_values[":newWonAuction"] = [won_auction]

            result = users_table.update_item(
                Key={
                    "userId": user_id
                },
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values,
                ReturnValues="ALL_NEW"
            )

            return build_response(200, {
                "message": "Profile updated successfully",
                "user": result.get("Attributes", {})
            })

        return build_response(405, {
            "error": f"Method {method} not allowed"
        })

    except Exception as e:
        print("Error handling user profile:", str(e))
        return build_response(500, {"error": str(e)})