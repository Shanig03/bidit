import json
import boto3

dynamodb = boto3.resource("dynamodb")
auctions_table = dynamodb.Table("Auctions")


def build_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "DELETE,OPTIONS"
        },
        "body": json.dumps(body)
    }


def lambda_handler(event, context):
    try:
        if event.get("httpMethod") == "OPTIONS":
            return build_response(200, {"message": "CORS OK"})

        path_params = event.get("pathParameters") or {}
        auction_id = path_params.get("auctionId")

        if not auction_id:
            return build_response(400, {"error": "auctionId is required"})

        result = auctions_table.delete_item(
            Key={
                "auctionId": auction_id
            },
            ReturnValues="ALL_OLD"
        )

        deleted_auction = result.get("Attributes")

        if not deleted_auction:
            return build_response(404, {"error": "Auction not found"})

        return build_response(200, {
            "message": "Auction deleted successfully",
            "auctionId": auction_id
        })

    except Exception as e:
        print("Error deleting auction:", str(e))
        return build_response(500, {"error": str(e)})