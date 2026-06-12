import boto3
import datetime
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
auctions_table = dynamodb.Table("Auctions")


def parse_iso_datetime(value):
    if not value:
        return None

    normalized = value.replace("Z", "+00:00")
    parsed = datetime.datetime.fromisoformat(normalized)

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=datetime.timezone.utc)

    return parsed.astimezone(datetime.timezone.utc)


def format_iso_utc(dt):
    return dt.astimezone(datetime.timezone.utc).isoformat().replace("+00:00", "Z")


def lambda_handler(event, context):
    auction_id = event.get("auctionId")

    if not auction_id:
        raise ValueError("Missing auctionId in event payload")

    try:
        response = auctions_table.get_item(
            Key={"auctionId": auction_id}
        )

        auction = response.get("Item")

        if not auction:
            raise ValueError(f"Auction {auction_id} not found")

        ends_at = auction.get("endsAt")

        if not ends_at:
            raise ValueError(f"Auction {auction_id} is missing endsAt")

        ends_at_dt = parse_iso_datetime(ends_at)
        now = datetime.datetime.now(datetime.timezone.utc)

        status = str(auction.get("status", "")).upper()

        is_auction_over = now >= ends_at_dt or status in ["ENDED", "CLOSED"]

        logger.info(
            f"Checked auction {auction_id}: now={format_iso_utc(now)}, "
            f"endsAt={ends_at}, status={status}, isAuctionOver={is_auction_over}"
        )

        return {
            "auctionId": auction_id,
            "isAuctionOver": is_auction_over,
            "endTime": ends_at,
            "status": status
        }

    except Exception as e:
        logger.error(f"Error checking auction {auction_id}: {str(e)}")
        raise e