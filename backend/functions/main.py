import os
import boto3
from firebase_functions import db_fn
from firebase_admin import initialize_app

# Initialize the Firebase Admin SDK
initialize_app()

# Initialize the AWS DynamoDB resource using your .env keys
dynamodb = boto3.resource(
    'dynamodb',
    region_name='us-east-1', # UPDATE THIS if your region is different
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
)

table = dynamodb.Table('Auctions')

# Trigger fires ONLY on the specific user node, keeping bandwidth microscopic
@db_fn.on_value_written(reference="/auctions/{auctionId}/viewers/{userId}")
def sync_viewers_to_dynamo(event: db_fn.Event[db_fn.Change[db_fn.DataSnapshot]]) -> None:
    auction_id = event.params["auctionId"]
    
    # Get the data state before and after the trigger
    before_val = event.data.before.value if event.data.before else None
    after_val = event.data.after.value if event.data.after else None

    # Determine if this was a join or a leave
    if before_val is None and after_val is not None:
        increment_val = 1  # User Joined
        action_text = "joined"
    elif before_val is not None and after_val is None:
        increment_val = -1 # User Left
        action_text = "left"
    else:
        # Data was just updated, count didn't change
        return 

    # Tell DynamoDB to add or subtract 1 directly
    try:
        table.update_item(
            Key={'auctionId': auction_id},
            UpdateExpression="ADD viewers :inc",
            ExpressionAttributeValues={':inc': increment_val}
        )
        print(f"Success: User {action_text}. DynamoDB counter adjusted by {increment_val}.")
    except Exception as e:
        print(f"Failed to update DynamoDB: {e}")