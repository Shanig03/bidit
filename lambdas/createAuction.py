import json
import uuid
import boto3
from datetime import datetime, timedelta, timezone
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
auctions_table = dynamodb.Table("Auctions")

sfn_client = boto3.client("stepfunctions")

STATE_MACHINE_ARN = "arn:aws:states:us-east-1:069765036595:stateMachine:WinnerMachine"


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        "body": json.dumps(body, default=str)
    }


def lambda_handler(event, context):
    try:
        if event.get("httpMethod") == "OPTIONS":
            return response(200, {"message": "CORS OK"})

        body = json.loads(event.get("body") or "{}")

        seller_id = body.get("sellerId")
        seller_name = body.get("sellerName", "").strip()
        seller_email = body.get("sellerEmail", "").strip()

        title = body.get("title", "").strip()
        description = body.get("description", "").strip()
        category = body.get("category", "").strip()

        starts_at = body.get("startsAt")
        ends_at = body.get("endsAt")

        starting_price = body.get("startingPrice")

        image_url = body.get("imageUrl", "")
        image_key = body.get("imageKey", "")

        agora_channel_name = body.get("agoraChannelName", "")
        video_profile = body.get("videoProfile", "")

        requested_status = body.get("status", "UPCOMING")

        if not seller_id:
            return response(400, {"error": "sellerId is required"})

        if not title:
            return response(400, {"error": "title is required"})

        if starting_price is None:
            return response(400, {"error": "startingPrice is required"})

        if not starts_at:
            return response(400, {"error": "startsAt is required"})

        if not ends_at:
            return response(400, {"error": "endsAt is required"})

        if not seller_name:
            seller_name = seller_email.split("@")[0] if seller_email else "Unknown Seller"

        ends_at_dt = datetime.fromisoformat(ends_at.replace("Z", "+00:00"))
        expire_timestamp = int((ends_at_dt + timedelta(hours=24)).timestamp())

        now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        auction_id = "auc_" + str(uuid.uuid4())

        auction_item = {
            "auctionId": auction_id,

            "sellerId": seller_id,
            "sellerName": seller_name,
            "sellerEmail": seller_email,

            "title": title,
            "description": description,
            "category": category,

            "status": requested_status,
            "startsAt": starts_at,
            "endsAt": ends_at,
            "expireAt": expire_timestamp,

            "startingPrice": Decimal(str(starting_price)),
            "currentPrice": Decimal(str(starting_price)),
            "bidCount": 0,

            "highestBidderId": "",
            "highestBidderEmail": "",

            "imageUrl": image_url,
            "imageKey": image_key,

            "agoraChannelName": agora_channel_name,
            "videoProfile": video_profile,

            "createdAt": now,
            "updatedAt": now
        }

        auctions_table.put_item(Item=auction_item)

        try:
            input_payload = {
                "auctionId": auction_id,
                "endTime": ends_at
            }

            sfn_client.start_execution(
                stateMachineArn=STATE_MACHINE_ARN,
                name=f"close-{auction_id}",
                input=json.dumps(input_payload)
            )

            print(f"Successfully started WinnerMachine for auction {auction_id}")

        except Exception as sfn_error:
            print(f"CRITICAL: Failed to start Step Function timer for {auction_id}: {str(sfn_error)}")

        return response(201, {
            "message": "Auction created",
            "auction": auction_item
        })

    except Exception as e:
        print("Error creating auction:", str(e))
        return response(500, {"error": str(e)})