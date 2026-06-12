import json
import uuid
import boto3
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource("dynamodb")

auctions_table = dynamodb.Table("Auctions")
bids_table = dynamodb.Table("Bids")
users_table = dynamodb.Table("Users")

ANTI_SNIPING_WINDOW_SECONDS = 30
EXTENSION_SECONDS = 60


def decimal_default(obj):
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    raise TypeError


def build_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        "body": json.dumps(body, default=decimal_default)
    }


def parse_iso_datetime(value):
    if not value:
        return None

    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def format_iso_utc(dt):
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def get_user_role(user_id):
    if not user_id:
        return "USER"

    user_result = users_table.get_item(
        Key={"userId": user_id}
    )

    user_item = user_result.get("Item")

    if not user_item:
        return "USER"

    return str(user_item.get("role", "USER")).upper()


def lambda_handler(event, context):
    try:
        if event.get("httpMethod") == "OPTIONS":
            return build_response(200, {"message": "CORS OK"})

        path_params = event.get("pathParameters") or {}
        auction_id = path_params.get("auctionId")

        if not auction_id:
            return build_response(400, {"error": "auctionId is required"})

        body = json.loads(event.get("body") or "{}", parse_float=Decimal)

        amount = body.get("amount")
        bidder_id = body.get("bidderId")
        bidder_email = body.get("bidderEmail", "")
        display_name = body.get("displayName") or body.get("bidderName", "")

        if amount is None:
            return build_response(400, {"error": "amount is required"})

        if not bidder_id:
            return build_response(400, {"error": "bidderId is required"})

        bidder_role = get_user_role(bidder_id)

        if bidder_role == "ADMIN":
            return build_response(403, {
                "error": "Admins cannot place bids."
            })

        bid_amount = Decimal(str(amount))

        if bid_amount <= 0:
            return build_response(400, {"error": "Bid amount must be greater than 0"})

        auction_result = auctions_table.get_item(
            Key={"auctionId": auction_id}
        )

        auction = auction_result.get("Item")

        if not auction:
            return build_response(404, {"error": "Auction not found"})

        seller_id = auction.get("sellerId")

        if seller_id and seller_id == bidder_id:
            return build_response(403, {
                "error": "You cannot bid on your own auction."
            })

        now = datetime.now(timezone.utc)

        starts_at = parse_iso_datetime(auction.get("startsAt"))
        ends_at = parse_iso_datetime(auction.get("endsAt"))

        if starts_at and now < starts_at:
            return build_response(403, {"error": "Auction has not started yet"})

        if ends_at and now > ends_at:
            auctions_table.update_item(
                Key={"auctionId": auction_id},
                UpdateExpression="SET #status = :status",
                ExpressionAttributeNames={
                    "#status": "status"
                },
                ExpressionAttributeValues={
                    ":status": "ENDED"
                }
            )

            return build_response(403, {"error": "Auction has ended"})

        if auction.get("status") != "LIVE":
            return build_response(403, {
                "error": f"Auction is not open for bidding. Current status: {auction.get('status')}"
            })

        current_price = Decimal(str(auction.get("currentPrice", 0)))

        if bid_amount <= current_price:
            return build_response(400, {
                "error": f"Bid must be higher than current price: {current_price}"
            })

        extended_ends_at = None
        new_ends_at_iso = None

        if ends_at:
            seconds_left = (ends_at - now).total_seconds()

            if 0 <= seconds_left <= ANTI_SNIPING_WINDOW_SECONDS:
                extended_ends_at = now + timedelta(seconds=EXTENSION_SECONDS)
                new_ends_at_iso = format_iso_utc(extended_ends_at)

        now_iso = format_iso_utc(now)
        bid_id = "bid_" + str(uuid.uuid4())

        update_expression = """
            SET currentPrice = :amount,
                highestBidderId = :bidderId,
                highestBidderEmail = :bidderEmail,
                bidCount = if_not_exists(bidCount, :zero) + :one,
                updatedAt = :updatedAt
        """

        expression_attribute_values = {
            ":amount": bid_amount,
            ":bidderId": bidder_id,
            ":bidderEmail": bidder_email,
            ":zero": Decimal("0"),
            ":one": Decimal("1"),
            ":updatedAt": now_iso
        }

        if new_ends_at_iso:
            update_expression += ", endsAt = :newEndsAt"
            expression_attribute_values[":newEndsAt"] = new_ends_at_iso

        updated_auction_result = auctions_table.update_item(
            Key={"auctionId": auction_id},
            UpdateExpression=update_expression,
            ConditionExpression=Attr("currentPrice").lt(bid_amount),
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues="ALL_NEW"
        )

        bid_item = {
            "auctionId": auction_id,
            "placedAt": now_iso,
            "createdAt": now_iso,
            "bidId": bid_id,
            "bidderId": bidder_id,
            "bidderEmail": bidder_email,
            "displayName": display_name,
            "amount": bid_amount,
            "status": "ACCEPTED"
        }

        bids_table.put_item(Item=bid_item)

        users_table.update_item(
            Key={"userId": bidder_id},
            UpdateExpression="ADD biddedAuctions :auctionId",
            ExpressionAttributeValues={
                ":auctionId": {auction_id}
            }
        )

        return build_response(200, {
            "message": "Bid accepted",
            "auction": updated_auction_result.get("Attributes"),
            "bid": bid_item,
            "auctionExtended": bool(new_ends_at_iso),
            "newEndsAt": new_ends_at_iso
        })

    except auctions_table.meta.client.exceptions.ConditionalCheckFailedException:
        return build_response(400, {
            "error": "Bid rejected. Another higher bid may have already been placed."
        })

    except Exception as e:
        print(f"place_bid error: {str(e)}")
        return build_response(500, {"error": str(e)})