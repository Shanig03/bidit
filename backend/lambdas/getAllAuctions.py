import json
import boto3
from datetime import datetime, timezone
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
auctions_table = dynamodb.Table("Auctions")


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

        auctions = []
        scan_kwargs = {}

        while True:
            response = auctions_table.scan(**scan_kwargs)
            auctions.extend(response.get("Items", []))

            last_key = response.get("LastEvaluatedKey")
            if not last_key:
                break

            scan_kwargs["ExclusiveStartKey"] = last_key

        now = datetime.now(timezone.utc)

        for auction in auctions:
            starts_at = auction.get("startsAt")
            ends_at = auction.get("endsAt")

            if not starts_at or not ends_at:
                continue

            try:
                start = datetime.fromisoformat(starts_at.replace("Z", "+00:00"))
                end = datetime.fromisoformat(ends_at.replace("Z", "+00:00"))

                if now < start:
                    auction["status"] = "UPCOMING"
                elif now > end:
                    auction["status"] = "ENDED"
                else:
                    auction["status"] = "LIVE"

            except Exception as date_error:
                print(f"Could not parse dates for auction {auction.get('auctionId')}: {date_error}")

        return build_response(200, {
            "auctions": auctions
        })

    except Exception as e:
        print("Error getting auctions:", str(e))
        return build_response(500, {
            "error": str(e)
        })