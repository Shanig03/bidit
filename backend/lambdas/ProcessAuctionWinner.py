import boto3
import logging
from datetime import datetime, timezone
from decimal import Decimal
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")

auctions_table = dynamodb.Table("Auctions")
users_table = dynamodb.Table("Users")
notifications_table = dynamodb.Table("Notifications")


def decimal_to_json_number(value):
    if isinstance(value, Decimal):
        if value % 1 == 0:
            return int(value)
        return float(value)

    return value


def format_iso_utc(dt):
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def create_winner_notification(auction, winner_id, final_price, now_iso):
    auction_id = auction.get("auctionId")
    auction_title = auction.get("title", "Auction item")

    notification_id = f"AUCTION_WON#{auction_id}"

    notification_item = {
        "userId": winner_id,
        "notificationId": notification_id,
        "type": "AUCTION_WON",
        "title": "You won an auction!",
        "message": f"You won '{auction_title}' with a final bid of ${decimal_to_json_number(final_price)}.",
        "auctionId": auction_id,
        "auctionTitle": auction_title,
        "amount": final_price,
        "read": False,
        "createdAt": now_iso
    }

    try:
        notifications_table.put_item(
            Item=notification_item,
            ConditionExpression="attribute_not_exists(notificationId)"
        )

        logger.info(f"Notification created for winner {winner_id}")
        return True

    except ClientError as error:
        if error.response["Error"]["Code"] == "ConditionalCheckFailedException":
            logger.info(f"Notification already exists for auction {auction_id}")
            return False

        raise error


def add_won_auction_to_user(auction, winner_id, final_price, now_iso):
    auction_id = auction.get("auctionId")

    won_auction_item = {
        "auctionId": auction_id,
        "category": auction.get("category", ""),
        "imageKey": auction.get("imageKey", ""),
        "imageUrl": auction.get("imageUrl", ""),
        "title": auction.get("title", "Auction item"),
        "winningBid": final_price,
        "wonAt": now_iso
    }

    users_table.update_item(
        Key={"userId": winner_id},
        UpdateExpression="""
            SET wonAuctions = list_append(if_not_exists(wonAuctions, :emptyList), :wonAuction)
        """,
        ExpressionAttributeValues={
            ":emptyList": [],
            ":wonAuction": [won_auction_item]
        }
    )

    logger.info(f"Won auction {auction_id} added to user {winner_id}")


def lambda_handler(event, context):
    auction_id = event.get("auctionId")

    if not auction_id:
        logger.error("Execution failed: Missing auctionId in payload.")
        raise ValueError("Missing auctionId")

    try:
        logger.info(f"Processing winner for auction: {auction_id}")

        auction_response = auctions_table.get_item(
            Key={"auctionId": auction_id}
        )

        auction = auction_response.get("Item")

        if not auction:
            logger.error(f"Auction {auction_id} not found.")
            raise ValueError(f"Auction {auction_id} not found")

        if auction.get("winnerProcessedAt"):
            logger.info(f"Auction {auction_id} was already processed.")

            return {
                "statusCode": 200,
                "auctionId": auction_id,
                "winnerId": auction.get("winnerId", "NO_BIDS"),
                "finalPrice": decimal_to_json_number(auction.get("finalPrice", 0)),
                "message": "Auction winner already processed."
            }

        winner_id = auction.get("highestBidderId") or "NO_BIDS"
        winner_email = auction.get("highestBidderEmail", "")
        final_price = Decimal(str(auction.get("currentPrice", 0)))

        now_iso = format_iso_utc(datetime.now(timezone.utc))

        notification_created = False
        won_auction_added = False

        if winner_id != "NO_BIDS":
            notification_created = create_winner_notification(
                auction=auction,
                winner_id=winner_id,
                final_price=final_price,
                now_iso=now_iso
            )

            add_won_auction_to_user(
                auction=auction,
                winner_id=winner_id,
                final_price=final_price,
                now_iso=now_iso
            )

            won_auction_added = True

            logger.info(f"Winner identified: {winner_id} at ${final_price}")
        else:
            logger.info("Auction ended with no bids.")

        auctions_table.update_item(
            Key={"auctionId": auction_id},
            UpdateExpression="""
                SET #s = :endedStatus,
                    winnerId = :winnerId,
                    winnerEmail = :winnerEmail,
                    finalPrice = :finalPrice,
                    endedAt = :endedAt,
                    winnerProcessedAt = :winnerProcessedAt
            """,
            ExpressionAttributeNames={
                "#s": "status"
            },
            ExpressionAttributeValues={
                ":endedStatus": "ENDED",
                ":winnerId": winner_id,
                ":winnerEmail": winner_email,
                ":finalPrice": final_price,
                ":endedAt": now_iso,
                ":winnerProcessedAt": now_iso
            },
            ReturnValues="ALL_NEW"
        )

        logger.info(f"Auction {auction_id} processed successfully.")

        return {
            "statusCode": 200,
            "auctionId": auction_id,
            "winnerId": winner_id,
            "winnerEmail": winner_email,
            "finalPrice": decimal_to_json_number(final_price),
            "notificationCreated": notification_created,
            "wonAuctionAdded": won_auction_added,
            "message": "Winner processed, notification created, and won auction added to user."
        }

    except Exception as e:
        logger.error(f"Critical error processing winner for auction {auction_id}: {str(e)}")
        raise e