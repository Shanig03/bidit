import json
import boto3

dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table("Users")


def build_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        "body": json.dumps(body)
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
        auction_id = body.get("auctionId")

        if not auction_id:
            return build_response(400, {"error": "auctionId is required"})

        users_table.update_item(
            Key={"userId": user_id},
            UpdateExpression="ADD favoriteAuctions :auctionId",
            ExpressionAttributeValues={":auctionId": {auction_id}}
        )

        return build_response(200, {"message": "Auction added to favorites"})

    except Exception as e:
        print(f"add_to_favorites error: {str(e)}")
        return build_response(500, {"error": str(e)})