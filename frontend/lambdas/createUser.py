import json
import boto3
import os
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    print(f"Received event: {event.get('body')}")
    
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
    }

    try:
        body_str = event.get('body', '{}')
        body = json.loads(body_str) if body_str else {}
        
        uid = body.get('uid')
        email = body.get('email')
        
        if not uid or not email:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Missing required fields: uid or email'})
            }
            
        table_name = os.environ.get('USERS_TABLE_NAME')
        if not table_name:
            print("Configuration Error: USERS_TABLE_NAME environment variable is missing.")
            raise ValueError("Internal configuration error")
            
        table = dynamodb.Table(table_name)
        
        response = table.get_item(Key={'userId': uid})
        
        if 'Item' in response:
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(response['Item'])
            }
            
        current_time = datetime.now(timezone.utc).isoformat()
        
        # Safely grab displayName, fallback to email prefix if it arrives null
        display_name = body.get('displayName')
        fallback_name = email.split('@')[0] if email else f"user_{uid[:5]}"
        final_display_name = display_name if display_name else fallback_name

        new_user = {
            'userId': uid,
            'email': email,
            'displayName': final_display_name, # <-- COMPLETELY REPLACED USERNAME
            'profilePic': body.get('profilePic', ""),
            'createdAt': body.get('createdAt', current_time),
            'role': 'user',      
            'status': 'active'   
        }
        
        table.put_item(Item=new_user)
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps(new_user)
        }
        
    except Exception as e:
        print(f"Error creating user profile: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Internal Server Error'})
        }