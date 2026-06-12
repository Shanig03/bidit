import json
import os
import time
from agora_token_builder import RtcTokenBuilder

ROLE_PUBLISHER = 1
ROLE_SUBSCRIBER = 2


def build_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "GET,OPTIONS"
        },
        "body": json.dumps(body)
    }


def lambda_handler(event, context):
    try:
        if event.get("httpMethod") == "OPTIONS":
            return build_response(200, {"message": "CORS OK"})

        app_id = os.environ.get("AGORA_APP_ID")
        app_certificate = os.environ.get("AGORA_APP_CERT")

        if not app_id or not app_certificate:
            return build_response(500, {
                "error": "Agora credentials not configured in environment variables."
            })

        query_params = event.get("queryStringParameters") or {}

        channel_name = query_params.get("channelName")
        uid = query_params.get("uid", "0")
        is_publisher = query_params.get("isPublisher", "false").lower() == "true"

        if not channel_name:
            return build_response(400, {
                "error": "Missing channelName parameter"
            })

        try:
            uid = int(uid)
        except ValueError:
            return build_response(400, {
                "error": "uid must be an integer"
            })

        role = ROLE_PUBLISHER if is_publisher else ROLE_SUBSCRIBER

        expiration_time_in_seconds = 7200
        current_timestamp = int(time.time())
        privilege_expired_ts = current_timestamp + expiration_time_in_seconds

        token = RtcTokenBuilder.buildTokenWithUid(
            app_id,
            app_certificate,
            channel_name,
            uid,
            role,
            privilege_expired_ts
        )

        return build_response(200, {
            "token": token,
            "appId": app_id,
            "channelName": channel_name,
            "uid": uid,
            "expiresIn": expiration_time_in_seconds
        })

    except Exception as e:
        print(f"generate_agora_token error: {str(e)}")
        return build_response(500, {
            "error": f"Failed to generate token: {str(e)}"
        })