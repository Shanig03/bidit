import json
import boto3
from decimal import Decimal
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
bids_table = dynamodb.Table("Bids")
auctions_table = dynamodb.Table("Auctions")

BIDDER_INDEX_NAME = "bidderId-placedAt-index"


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
            "Access-Control-Allow-Methods": "GET,OPTIONS"
        },
        "body": json.dumps(body, default=decimal_default)
    }


def parse_datetime(value):
    if not value:
        return None

    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))

        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)

        return parsed.astimezone(timezone.utc)
    except Exception:
        return None


def is_auction_active_or_relevant(auction):
    if auction.get("status") == "ENDED":
        return False

    ends_at = auction.get("endsAt")
    ends_at_dt = parse_datetime(ends_at)

    if not ends_at_dt:
        return True

    return ends_at_dt > datetime.now(timezone.utc)


def query_all_user_bids(user_id):
    all_bids = []
    last_evaluated_key = None

    while True:
        query_kwargs = {
            "IndexName": BIDDER_INDEX_NAME,
            "KeyConditionExpression": Key("bidderId").eq(user_id),
            "ScanIndexForward": False
        }

        if last_evaluated_key:
            query_kwargs["ExclusiveStartKey"] = last_evaluated_key

        response = bids_table.query(**query_kwargs)

        all_bids.extend(response.get("Items", []))

        last_evaluated_key = response.get("LastEvaluatedKey")

        if not last_evaluated_key:
            break

    return all_bids


def get_latest_or_highest_bid_per_auction(user_bids):
    bid_by_auction = {}

    for bid in user_bids:
        auction_id = bid.get("auctionId")

        if not auction_id:
            continue

        amount = Decimal(str(bid.get("amount", 0)))
        placed_at = bid.get("placedAt") or bid.get("createdAt", "")

        existing_bid = bid_by_auction.get(auction_id)

        if not existing_bid:
            bid_by_auction[auction_id] = bid
            continue

        existing_amount = Decimal(str(existing_bid.get("amount", 0)))
        existing_created_at = existing_bid.get("createdAt", "")

        if amount > existing_amount:
            bid_by_auction[auction_id] = bid
        elif amount == existing_amount and created_at > existing_created_at:
            bid_by_auction[auction_id] = bid

    return bid_by_auction


def batch_get_auctions(auction_ids):
    if not auction_ids:
        return {}

    auction_map = {}

    keys = [{"auctionId": auction_id} for auction_id in auction_ids]

    for i in range(0, len(keys), 100):
        batch_keys = keys[i:i + 100]

        response = dynamodb.batch_get_item(
            RequestItems={
                "Auctions": {
                    "Keys": batch_keys
                }
            }
        )

        fetched_auctions = response.get("Responses", {}).get("Auctions", [])

        for auction in fetched_auctions:
            auction_id = auction.get("auctionId")

            if auction_id:
                auction_map[auction_id] = auction

    return auction_map


def lambda_handler(event, context):
    try:
        if event.get("httpMethod") == "OPTIONS":
            return build_response(200, {"message": "CORS OK"})

        path_params = event.get("pathParameters") or {}
        user_id = path_params.get("userId")

        if not user_id:
            return build_response(400, {"error": "userId is required"})

        user_bids = query_all_user_bids(user_id)

        if not user_bids:
            return build_response(200, [])

        bid_by_auction = get_latest_or_highest_bid_per_auction(user_bids)
        auction_ids = list(bid_by_auction.keys())

        auctions_by_id = batch_get_auctions(auction_ids)

        dashboard_bids = []

        for auction_id, bid in bid_by_auction.items():
            auction = auctions_by_id.get(auction_id)

            if not auction:
                continue

            if not is_auction_active_or_relevant(auction):
                continue

            my_bid = bid.get("amount", 0)
            current_price = auction.get("currentPrice", 0)
            highest_bidder_id = auction.get("highestBidderId", "")

            is_winning = highest_bidder_id == user_id

            dashboard_bids.append({
                "id": bid.get("bidId") or f"{auction_id}-{bid.get('createdAt', '')}",
                "bidId": bid.get("bidId", ""),
                "auctionId": auction_id,
                "title": auction.get("title", "Auction item"),
                "description": auction.get("description", ""),
                "category": auction.get("category", ""),
                "myBid": my_bid,
                "bidAmount": my_bid,
                "currentBid": current_price,
                "currentPrice": current_price,
                "startingPrice": auction.get("startingPrice", 0),
                "bidCount": auction.get("bidCount", 0),
                "watchers": auction.get("watchers", 0),
                "endsAt": auction.get("endsAt", ""),
                "startsAt": auction.get("startsAt", ""),
                "auctionStatus": auction.get("status", ""),
                "status": "winning" if is_winning else "outbid",
                "isWinning": is_winning,
                "placedAt": bid.get("placedAt") or bid.get("createdAt", ""),
                "bidderEmail": bid.get("bidderEmail", ""),
                "imageUrl": auction.get("imageUrl", ""),
                "imageKey": auction.get("imageKey", ""),
                "sellerId": auction.get("sellerId", ""),
                "sellerName": auction.get("sellerName", "")
            })

        dashboard_bids.sort(
            key=lambda item: item.get("placedAt", ""),
            reverse=True
        )

        return build_response(200, dashboard_bids)

    except Exception as e:
        print(f"get_user_bids error: {str(e)}")
        return build_response(500, {"error": str(e)})