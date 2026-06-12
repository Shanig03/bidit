import json
import boto3
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
            "Access-Control-Allow-Methods": "GET,OPTIONS"
        },
        "body": json.dumps(body, cls=DynamoDBEncoder)
    }


def lambda_handler(event, context):
    try:
        if event.get("httpMethod") == "OPTIONS":
            return build_response(200, {"message": "CORS OK"})

        users = []
        scan_kwargs = {}

        while True:
            response = users_table.scan(**scan_kwargs)
            users.extend(response.get("Items", []))

            last_key = response.get("LastEvaluatedKey")
            if not last_key:
                break

            scan_kwargs["ExclusiveStartKey"] = last_key

        normalized_users = []

        for user in users:
            normalized_users.append({
                **user,
                "status": user.get("status", "ACTIVE"),
                "role": user.get("role", "USER")
            })

        return build_response(200, {
            "users": normalized_users
        })

    except Exception as e:
        print("Error getting users:", str(e))
        return build_response(500, {"error": str(e)})