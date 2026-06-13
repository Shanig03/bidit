import json
import os
import boto3
import uuid

s3 = boto3.client("s3")

BUCKET_NAME = os.environ.get("IMAGES_BUCKET_NAME", "")

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
}


def build_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "OPTIONS,POST"
        },
        "body": json.dumps(body)
    }


def lambda_handler(event, context):
    try:
        if event.get("httpMethod") == "OPTIONS":
            return build_response(200, {"message": "OK"})

        body = json.loads(event.get("body") or "{}")

        action = body.get("action", "upload")

        if action == "get":
            image_key = body.get("imageKey")

            if not image_key:
                return build_response(400, {"message": "imageKey is required"})

            view_url = s3.generate_presigned_url(
                ClientMethod="get_object",
                Params={
                    "Bucket": BUCKET_NAME,
                    "Key": image_key
                },
                ExpiresIn=3600
            )

            return build_response(200, {
                "viewUrl": view_url
            })

        upload_type = body.get("uploadType")
        content_type = body.get("contentType")
        user_id = body.get("userId")
        auction_id = body.get("auctionId")

        if not upload_type:
            return build_response(400, {"message": "uploadType is required"})

        if not content_type:
            return build_response(400, {"message": "contentType is required"})

        if content_type not in ALLOWED_CONTENT_TYPES:
            return build_response(400, {
                "message": "Only jpeg, png and webp images are allowed"
            })

        if not user_id:
            return build_response(400, {"message": "userId is required"})

        extension = ALLOWED_CONTENT_TYPES[content_type]
        image_id = str(uuid.uuid4())

        if upload_type == "profile":
            image_key = f"profile-images/{user_id}/{image_id}.{extension}"

        elif upload_type == "auction":
            if not auction_id:
                return build_response(400, {
                    "message": "auctionId is required for auction images"
                })

            image_key = f"auction-images/{auction_id}/{image_id}.{extension}"

        else:
            return build_response(400, {"message": "Invalid uploadType"})

        upload_url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": image_key,
                "ContentType": content_type
            },
            ExpiresIn=300
        )

        return build_response(200, {
            "uploadUrl": upload_url,
            "imageKey": image_key
        })

    except Exception as e:
        print("Error:", str(e))
        return build_response(500, {
            "message": "Failed to process image URL request",
            "error": str(e)
        })