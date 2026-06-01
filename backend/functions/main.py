import os
import boto3
from firebase_functions import db_fn
from firebase_admin import initialize_app, db

# Initialize the Admin SDK
initialize_app()

# Initialize the AWS DynamoDB resource
dynamodb = boto3.resource(
    'dynamodb',
    region_name='us-east-1',
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
)
table = dynamodb.Table('Auctions')

@db_fn.on_value_written(reference="/auctions/{auctionId}/viewers/{userId}")
def sync_viewers_to_dynamo(event: db_fn.Event[db_fn.Change]) -> None:
    auction_id = event.params["auctionId"]
    
    # Extract the previous and current values cleanly from the change object
    before_val = event.data.before.value if event.data.before else None
    after_val = event.data.after.value if event.data.after else None

    # Identify if the operation was a registration or an exit
    if before_val is None and after_val is not None:
        increment_val = 1  
    elif before_val is not None and after_val is None:
        increment_val = -1 
    else:
        return 

    # 1. Update AWS DynamoDB using atomic operations
    try:
        table.update_item(
            Key={'auctionId': auction_id},
            UpdateExpression="ADD viewers :inc",
            ExpressionAttributeValues={':inc': increment_val}
        )
    except Exception as e:
        print(f"DynamoDB Sync Error: {e}")

    # 2. Update Firebase Realtime DB Integer Counter with a safe transaction block
    try:
        firebase_count_ref = db.reference(f"/auctions/{auction_id}/viewerCount")
        
        def update_total_count(current_value):
            if current_value is None:
                return max(0, increment_val)
            return max(0, current_value + increment_val)

        firebase_count_ref.transaction(update_total_count)
        print(f"Successfully adjusted viewer counts by {increment_val} across both clouds.")
    except Exception as e:
        print(f"Firebase Realtime Database Transaction Error: {e}")