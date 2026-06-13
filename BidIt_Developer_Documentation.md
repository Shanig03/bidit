# BidIt Developer-Oriented System and AWS Integration Documentation

## 1. Purpose of This Document

This document is intended for developers who need to understand, maintain, or extend the BidIt live auction marketplace after receiving the source code. It explains the system architecture, the main AWS services, the public API routes, the Lambda implementations, the DynamoDB data model, and the main integration flows between the frontend, backend, and external services.

The documentation is based on the current repository structure, the Lambda source code under `lambdas/`, the frontend API helpers under `frontend/src/api/`, and the exported API Gateway configuration used by the project. Concrete deployment values such as API IDs, AWS account IDs, Lambda ARNs, and secret values should be configured through environment variables or deployment settings and should not be hard-coded in reusable documentation or source code.

---

## 2. High-Level System Architecture

BidIt is implemented as a React/Vite single-page application with a serverless backend on AWS. The application supports user registration and login, auction creation, live auction browsing, bidding, favorites, image upload, live video, chat, viewer presence, notifications, and admin management.

```text
React/Vite frontend
  -> API Gateway base URL from VITE_API_BASE_URL
    -> AWS Lambda functions
      -> DynamoDB tables: Users, Auctions, Bids, Notifications
      -> S3 bucket for auction and profile images
      -> Step Functions workflow for auction closing and winner processing
  -> Firebase Auth for user identity
  -> Firebase Realtime Database for chat, viewer presence, and blocked-user status updates
  -> Agora RTC for live video broadcasting
```

The frontend does not connect directly to DynamoDB or Step Functions. All business operations that require AWS data access are handled through API Gateway and Lambda. Image upload is the exception: the frontend first asks Lambda for an S3 presigned URL, and then uploads the image file directly to S3 using that temporary URL.

---

## 3. Main Technologies and Services

| Area | Technology / Service | Purpose |
| --- | --- | --- |
| Frontend | React + Vite | Single-page application and UI routing. |
| Authentication | Firebase Auth | Email/password login, Google login, and Firebase user IDs. |
| API layer | API Gateway | Public HTTP interface used by the frontend. |
| Compute | AWS Lambda | Backend business logic. |
| Database | DynamoDB | Users, auctions, bids, and notifications. |
| Object storage | S3 | Product images and profile images. |
| Workflow | Step Functions | Auction closing and winner processing flow. |
| Live video | Agora RTC | Seller video broadcast and viewer subscription. |
| Realtime features | Firebase Realtime Database | Auction chat, viewer presence, and block-status push updates. |
| AWS SDK | Boto3 / Botocore | Python access to DynamoDB, S3, and Step Functions. |

---

## 4. Repository Structure Relevant to Developers

```text
/frontend
  /src
    /api             Frontend API helper modules
    /components      Reusable UI and feature components
    /context         AuthContext and shared React context
    /firebase        Firebase Auth and Realtime Database setup
    /hooks           Feature hooks for auctions, bidding, profile, admin, video, favorites
    /pages           Route-level page components
    /utils           Shared utility functions

/lambdas             AWS Lambda source files
/backend
  /step-functions    Step Functions ASL definitions, including WinnerMachine
```

The most important backend source of truth is the `lambdas/` directory. Each Lambda contains a `lambda_handler(event, context)` function and is invoked either by API Gateway or by Step Functions.

---

## 5. Runtime Request Flow

A typical frontend-to-backend request follows this pattern:

1. A React component or hook calls an API helper from `frontend/src/api/`.
2. The API helper builds a URL using `import.meta.env.VITE_API_BASE_URL`.
3. The browser sends the request to API Gateway.
4. API Gateway forwards the request to the matching Lambda using proxy integration.
5. The Lambda reads path parameters, query parameters, or request body fields from the `event` object.
6. The Lambda performs validation and uses Boto3 to access DynamoDB, S3, or Step Functions.
7. The Lambda returns a JSON response with CORS headers.
8. The frontend maps the response into component or hook state.

---

## 6. API Gateway Routes

The following table documents the public client-facing routes used by the current project. API Gateway invokes Lambda internally, but the table shows the public HTTP method and path that the frontend uses.

| Public method/path | Lambda | Purpose |
| --- | --- | --- |
| `POST /users` | `createUser` | Create or return a user profile after Firebase signup/login. |
| `GET /users/{userId}` | `updateUserProfile` | Retrieve a user profile. |
| `PATCH /users/{userId}` | `updateUserProfile` | Update a user profile. |
| `GET /users/{userId}/bids` | `getUserBids` | Retrieve dashboard bid data for a user. |
| `GET /users/{userId}/favorites` | `getFavorites` | Retrieve favorite auctions. |
| `POST /users/{userId}/favorites` | `addToFavorites` | Add an auction to favorites. |
| `DELETE /users/{userId}/favorites/{auctionId}` | `removeAuctionFromFavorites` | Remove an auction from favorites. |
| `GET /users/{userId}/notifications` | `getNotifications` | Retrieve user notifications. |
| `GET /auctions` | `getAllAuctions` | Retrieve auction list. |
| `POST /auctions` | `createAuction` | Create a new auction. |
| `GET /auctions/{auctionId}` | `getAuction` | Retrieve a single auction. |
| `PATCH /auctions/{auctionId}` | `updateAuction` | Update auction details or image keys. |
| `POST /auctions/{auctionId}/bid` | `placeBid` | Place a bid on an auction. |
| `GET /auctions/{auctionId}/bids` | `getAuctionBids` | Retrieve bid history for an auction. |
| `POST /upload-url` | `generateS3ImageUrls` | Generate S3 presigned upload/view URLs. |
| `GET /agora/token` | `generateAgoraToken` | Generate an Agora token for live video. |
| `GET /admin/users` | `getAllUsers` | Admin user list. |
| `PATCH /admin/users/{userId}/status` | `updateUserStatus` | Block or unblock a user. |
| `PATCH /admin/users/{userId}/role` | `updateUserRole` | Promote or update user role. |
| `DELETE /admin/auctions/{auctionId}` | `deleteAuction` | Delete an auction as admin. |

CORS `OPTIONS` routes may also exist in API Gateway. These are used for browser preflight requests and should not be documented as business endpoints.

---

## 7. Authentication and Authorization Notes

Firebase Auth is used by the frontend to authenticate users. After login or signup, the frontend syncs the Firebase user to DynamoDB through `POST /users`. The Firebase UID is stored as `userId` in DynamoDB.

Some frontend API helpers attach `Authorization: Bearer <Firebase ID token>`, especially for profile, admin, and some auction calls. However, API Gateway is currently configured without gateway-level authorization. Therefore, any production-ready authorization must be enforced either by an API Gateway authorizer or by explicit Firebase token verification inside the relevant Lambdas.

Admin protection currently exists mainly on the frontend by checking the user's `role`. This is useful for UI routing, but it is not sufficient as a backend security boundary. Admin Lambdas should verify that the caller is really an admin before allowing destructive actions such as deleting auctions, blocking users, or promoting users.

---

## 8. Lambda Implementation Documentation

Each subsection below describes one Lambda implementation using a consistent developer format: purpose, caller, endpoint or trigger, input, main logic, AWS/Boto3 calls, response, and important edge cases.

### 8.1 `createUser.py`

**Purpose:** Create a new DynamoDB user profile after Firebase signup/login, or return the existing profile if the user already exists.

**Caller:** Frontend authentication flow after Firebase signup or Google/email login.

**Endpoint / trigger:** `POST /users` through API Gateway.

**Input:** JSON body with `uid`, `email`, optional `displayName`, optional `profilePic`, and optional `createdAt`.

**Main logic:** The Lambda validates that `uid` and `email` exist, checks whether a user item already exists, and returns the existing item if found. If no item exists, it creates a new user with default role and status.

**Boto3 / AWS calls:**

```text
dynamodb.Table(USERS_TABLE_NAME).get_item(Key={"userId": uid})
dynamodb.Table(USERS_TABLE_NAME).put_item(Item=user_item)
```

**Response:** A JSON user object containing fields such as `userId`, `email`, `displayName`, `role`, `status`, and `createdAt`.

**Important notes:** `role` and `status` may be created in lowercase by this Lambda, while admin-related code expects uppercase values. The frontend currently normalizes these values.

---

### 8.2 `updateUserProfile.py`

**Purpose:** Retrieve or update a user profile.

**Caller:** Profile page, authentication context, and profile update form.

**Endpoint / trigger:** `GET /users/{userId}` and `PATCH /users/{userId}` through API Gateway. The same Lambda handles both methods by inspecting the HTTP method.

**Input:**

For `GET`, the required input is the path parameter `userId`.

For `PATCH`, the body may include `displayName`, `email`, `bio`, `photoURL`, `profileImageKey`, and optionally `wonAuction`.

**Main logic:** For `GET`, the Lambda reads the user from DynamoDB. For `PATCH`, it validates the profile data, updates editable fields, sets `updatedAt`, and can append a won auction to the user's profile.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Users").get_item(Key={"userId": user_id})
dynamodb.Table("Users").update_item(...)
```

**Response:** A profile object for `GET`, or a message plus the updated user object for `PATCH`.

**Important notes:** The Lambda does not currently verify that the authenticated caller owns the profile being modified.

---

### 8.3 `getAllUsers.py`

**Purpose:** Return all users for the admin management page.

**Caller:** Admin users page.

**Endpoint / trigger:** `GET /admin/users` through API Gateway.

**Input:** No request body is required.

**Main logic:** The Lambda scans the `Users` table, paginates through all results, and normalizes missing `role` or `status` fields in the response.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Users").scan(...)
```

**Response:** JSON object containing a `users` array.

**Important notes:** This is an admin endpoint, but backend admin authorization should be added before production use.

---

### 8.4 `updateUserStatus.py`

**Purpose:** Block or unblock a user.

**Caller:** Admin users page.

**Endpoint / trigger:** `PATCH /admin/users/{userId}/status` through API Gateway.

**Input:** Path parameter `userId` and body field `status`, usually `ACTIVE` or `BLOCKED`.

**Main logic:** The Lambda validates the status value, updates the user's `status` field, and sets `updatedAt`. The frontend also writes to Firebase Realtime Database so blocked users can be logged out immediately.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Users").update_item(Key={"userId": user_id}, ...)
```

**Response:** Message and updated user object.

**Important notes:** The Lambda should use a condition expression if it must fail when the user does not exist. Backend admin authorization is also recommended.

---

### 8.5 `updateUserRole.py`

**Purpose:** Promote or update a user's role.

**Caller:** Admin users page.

**Endpoint / trigger:** `PATCH /admin/users/{userId}/role` through API Gateway.

**Input:** Path parameter `userId` and body field `role`, usually `USER` or `ADMIN`.

**Main logic:** The Lambda validates the user ID and role, then updates the role in DynamoDB.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Users").update_item(
  Key={"userId": user_id},
  ConditionExpression="attribute_exists(userId)",
  ...
)
```

**Response:** Message and updated user object.

**Important notes:** This Lambda already checks that the user exists. It should also verify that the caller is an authorized admin.

---

### 8.6 `getAllAuctions.py`

**Purpose:** Return all auctions for home, live auctions, dashboard, and admin auction views.

**Caller:** Auction list pages, dashboard, and admin auction page.

**Endpoint / trigger:** `GET /auctions` through API Gateway.

**Input:** No request body is required.

**Main logic:** The Lambda scans the `Auctions` table and computes a display status such as `UPCOMING`, `LIVE`, or `ENDED` based on `startsAt`, `endsAt`, and the current time.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Auctions").scan(...)
```

**Response:** JSON object containing an `auctions` array.

**Important notes:** The computed status is returned in the response but is not necessarily persisted back to DynamoDB. If the application needs stored status consistency, this should be handled explicitly.

---

### 8.7 `getAuction.py`

**Purpose:** Retrieve one auction by ID.

**Caller:** Auction details page and auction-related hooks.

**Endpoint / trigger:** `GET /auctions/{auctionId}` through API Gateway.

**Input:** Path parameter `auctionId`.

**Main logic:** The Lambda reads the auction from the `Auctions` table by primary key.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Auctions").get_item(Key={"auctionId": auction_id})
```

**Response:** JSON object containing the auction.

**Important notes:** Returns `404` when the auction does not exist.

---

### 8.8 `createAuction.py`

**Purpose:** Create a new auction and start the auction-closing workflow.

**Caller:** Go Live / create auction flow.

**Endpoint / trigger:** `POST /auctions` through API Gateway.

**Input:** JSON body with seller fields, title, description, category, starting price, `startsAt`, `endsAt`, optional image fields, optional Agora channel, and initial status.

**Main logic:** The Lambda validates required fields, creates an `auctionId`, stores the auction in DynamoDB, initializes bid-related fields, and starts a Step Functions execution for future winner processing.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Auctions").put_item(Item=auction_item)
stepfunctions.start_execution(
  stateMachineArn="arn:aws:states:<region>:<account-id>:stateMachine:WinnerMachine",
  input=json.dumps({"auctionId": auction_id, "endTime": ends_at})
)
```

**Response:** Message and created auction object.

**Important notes:** The Step Functions ARN should be configured through an environment variable or deployment template instead of being hard-coded with a specific AWS account ID. If starting Step Functions fails, the Lambda may still return auction creation success, so this behavior should be reviewed depending on the required reliability.

---

### 8.9 `updateAuction.py`

**Purpose:** Update editable auction fields, especially image keys after S3 upload.

**Caller:** Go Live flow after images are uploaded; possible future edit-auction flows.

**Endpoint / trigger:** `PATCH /auctions/{auctionId}` through API Gateway.

**Input:** Path parameter `auctionId` and optional body fields such as `title`, `description`, `category`, `startsAt`, `endsAt`, `status`, `imageKey`, `imageKeys`, `startingPrice`, `currentPrice`, `agoraChannelName`, and `videoProfile`.

**Main logic:** The Lambda builds a DynamoDB update expression only from allowed fields that appear in the request body. It cleans image key arrays, converts numeric values where needed, and updates `updatedAt`.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Auctions").update_item(Key={"auctionId": auction_id}, ...)
```

**Response:** Message and updated auction object.

**Important notes:** If `endsAt` is changed after creation, the Step Functions workflow should still rely on the latest value from DynamoDB before closing the auction. This should be regression-tested when modifying auction timing logic.

---

### 8.10 `deleteAuction.py`

**Purpose:** Delete an auction as an admin action.

**Caller:** Admin auction management page.

**Endpoint / trigger:** `DELETE /admin/auctions/{auctionId}` through API Gateway.

**Input:** Path parameter `auctionId`.

**Main logic:** The Lambda deletes the auction item from DynamoDB and returns `404` if no item existed.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Auctions").delete_item(
  Key={"auctionId": auction_id},
  ReturnValues="ALL_OLD"
)
```

**Response:** Message and deleted auction ID.

**Important notes:** This Lambda deletes only the auction item. It does not currently clean related bids, favorites, notifications, S3 images, or Step Functions executions.

---

### 8.11 `placeBid.py`

**Purpose:** Validate and place a bid on a live auction.

**Caller:** Auction details page and bid panel.

**Endpoint / trigger:** `POST /auctions/{auctionId}/bid` through API Gateway.

**Input:** Path parameter `auctionId` and body fields `amount`, `bidderId`, optional `bidderEmail`, optional `displayName`, and optional `bidderName`.

**Main logic:** The Lambda validates the auction, validates the bidder, prevents admins from bidding, prevents sellers from bidding on their own auction, checks that the auction is currently live, verifies that the bid is higher than the current price, updates the auction price and highest bidder, writes a bid record, and adds the auction ID to the user's bid history.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Users").get_item(Key={"userId": bidder_id})
dynamodb.Table("Auctions").get_item(Key={"auctionId": auction_id})
dynamodb.Table("Auctions").update_item(
  Key={"auctionId": auction_id},
  ConditionExpression=Attr("currentPrice").lt(bid_amount),
  ...
)
dynamodb.Table("Bids").put_item(Item=bid_item)
dynamodb.Table("Users").update_item(
  Key={"userId": bidder_id},
  UpdateExpression="ADD biddedAuctions :auction_id"
)
```

**Response:** Message, updated auction, created bid, and optional auction extension information.

**Important notes:** The anti-sniping rule extends `endsAt` when a bid arrives near the end of the auction. The Step Functions execution is started once when the auction is created, but the workflow should re-check DynamoDB and use the latest `endsAt` before processing the winner. This behavior should be tested end-to-end.

---

### 8.12 `getAuctionBids.py`

**Purpose:** Return bid history for a specific auction.

**Caller:** Auction details page and recent bids component.

**Endpoint / trigger:** `GET /auctions/{auctionId}/bids` through API Gateway.

**Input:** Path parameter `auctionId`.

**Main logic:** The Lambda queries the `Bids` table by auction ID and returns bids ordered by the sort key.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Bids").query(
  KeyConditionExpression=Key("auctionId").eq(auction_id),
  ScanIndexForward=False
)
```

**Response:** JSON object containing a `bids` array.

**Important notes:** This route is for retrieving bids. Bid placement uses singular `POST /auctions/{auctionId}/bid`.

---

### 8.13 `getUserBids.py`

**Purpose:** Return a user's active/relevant bid dashboard data.

**Caller:** Dashboard “My Bids” tab.

**Endpoint / trigger:** `GET /users/{userId}/bids` through API Gateway.

**Input:** Path parameter `userId`.

**Main logic:** The Lambda queries the `Bids` table through the `bidderId-placedAt-index` GSI, groups bids by auction, fetches the related auctions, and returns dashboard-ready bid status values such as `winning` or `outbid`.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Bids").query(
  IndexName="bidderId-placedAt-index",
  KeyConditionExpression=Key("bidderId").eq(user_id)
)
dynamodb.batch_get_item(RequestItems={"Auctions": {"Keys": [...]}})
```

**Response:** JSON array of bid dashboard items.

**Important notes:** Preserve the `bidderId-placedAt-index` GSI when recreating the `Bids` table. Review equal-amount comparison logic carefully if maintaining this Lambda.

---

### 8.14 `addToFavorites.py`

**Purpose:** Add an auction ID to a user's favorites.

**Caller:** Favorite button and favorites hook.

**Endpoint / trigger:** `POST /users/{userId}/favorites` through API Gateway.

**Input:** Path parameter `userId` and body field `auctionId`.

**Main logic:** The Lambda adds the auction ID to the user's `favoriteAuctions` DynamoDB string set.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Users").update_item(
  Key={"userId": user_id},
  UpdateExpression="ADD favoriteAuctions :auction_id"
)
```

**Response:** Success message.

**Important notes:** The Lambda does not currently verify that the auction exists or that the caller owns the user ID.

---

### 8.15 `getFavorites.py`

**Purpose:** Return a user's favorite auctions.

**Caller:** Favorites hook and dashboard favorites tab.

**Endpoint / trigger:** `GET /users/{userId}/favorites` through API Gateway.

**Input:** Path parameter `userId`.

**Main logic:** The Lambda reads the user's favorite auction IDs from the `Users` table, then batch-gets the matching auction records from `Auctions`.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Users").get_item(Key={"userId": user_id})
dynamodb.batch_get_item(RequestItems={"Auctions": {"Keys": [...]}})
```

**Response:** JSON array of favorite auction objects.

**Important notes:** If the user has no favorites, the Lambda returns an empty array.

---

### 8.16 `removeAuctionFromFavorites.py`

**Purpose:** Remove an auction ID from a user's favorites.

**Caller:** Favorite button and favorites hook.

**Endpoint / trigger:** `DELETE /users/{userId}/favorites/{auctionId}` through API Gateway.

**Input:** Path parameters `userId` and `auctionId`.

**Main logic:** The Lambda removes the auction ID from the user's `favoriteAuctions` DynamoDB string set.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Users").update_item(
  Key={"userId": user_id},
  UpdateExpression="DELETE favoriteAuctions :auction_id"
)
```

**Response:** Success message and removed auction ID.

**Important notes:** The route, frontend call, and Lambda path-parameter expectation should remain aligned.

---

### 8.17 `getNotifications.py`

**Purpose:** Return notifications for a user profile.

**Caller:** Profile page and notifications section.

**Endpoint / trigger:** `GET /users/{userId}/notifications` through API Gateway.

**Input:** Path parameter `userId`.

**Main logic:** The Lambda queries notifications by user ID and sorts them by creation time.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Notifications").query(
  KeyConditionExpression=Key("userId").eq(user_id)
)
```

**Response:** JSON object containing a `notifications` array.

**Important notes:** There is currently no mark-as-read API documented for notifications.

---

### 8.18 `generateS3ImageUrls.py`

**Purpose:** Generate temporary S3 presigned URLs for uploading or viewing images.

**Caller:** Product image uploader, profile image uploader, and image display helpers.

**Endpoint / trigger:** `POST /upload-url` through API Gateway.

**Input for upload:** Body fields `uploadType`, `contentType`, `fileName`, `userId`, and for auction uploads also `auctionId`.

**Input for viewing:** Body fields `action: "get"` and `imageKey`.

**Main logic:** For upload, the Lambda validates the upload type and MIME type, generates an S3 object key, and returns a temporary `put_object` URL. For viewing, it returns a temporary `get_object` URL for an existing object key.

**Boto3 / AWS calls:**

```text
s3.generate_presigned_url(
  ClientMethod="put_object",
  Params={"Bucket": bucket_name, "Key": image_key, "ContentType": content_type},
  ExpiresIn=300
)

s3.generate_presigned_url(
  ClientMethod="get_object",
  Params={"Bucket": bucket_name, "Key": image_key},
  ExpiresIn=3600
)
```

**Response:** For upload, `uploadUrl` and `imageKey`. For view, `viewUrl`.

**Important notes:** The bucket name should be configurable where possible. The accepted content types are `image/jpeg`, `image/png`, and `image/webp`. The frontend must upload the file using the same `Content-Type` that was used to sign the URL.

---

### 8.19 `generateAgoraToken.py`

**Purpose:** Generate a time-limited Agora RTC token for live auction video.

**Caller:** Auction video hook before joining an Agora channel.

**Endpoint / trigger:** `GET /agora/token?channelName=...&uid=...&isPublisher=...` through API Gateway.

**Input:** Query parameters `channelName`, optional numeric `uid`, and optional `isPublisher`.

**Main logic:** The Lambda reads Agora credentials from environment variables, validates the channel and UID, chooses publisher or subscriber role, and generates a token.

**Boto3 / AWS calls:** None. This Lambda uses environment variables and the Agora token builder library, not AWS data services.

**Response:** Token, app ID, channel name, UID, and expiration duration.

**Important notes:** `AGORA_APP_CERT` is a secret and must remain backend-only. It must never be placed in frontend environment variables.

---

### 8.20 `CheckAuctionStatus.py`

**Purpose:** Determine whether an auction is over as part of the Step Functions workflow.

**Caller:** Step Functions, not the frontend.

**Endpoint / trigger:** Invoked internally by the `WinnerMachine` state machine.

**Input:** Event object containing `auctionId`.

**Main logic:** The Lambda reads the auction from DynamoDB, checks `endsAt` and status, and returns whether the auction is over plus the latest end time.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Auctions").get_item(Key={"auctionId": auction_id})
```

**Response:** Object containing `auctionId`, `isAuctionOver`, `endTime`, and `status`.

**Important notes:** This Lambda is important for supporting auction extensions because it reads the latest `endsAt` value from DynamoDB before the workflow proceeds.

---

### 8.21 `ProcessAuctionWinner.py`

**Purpose:** Close an auction, determine the winner, create a winner notification, and append the won auction to the winner's profile.

**Caller:** Step Functions, not the frontend.

**Endpoint / trigger:** Invoked internally by the `WinnerMachine` state machine after the auction is over.

**Input:** Event object containing `auctionId`.

**Main logic:** The Lambda reads the auction, checks whether the winner has already been processed, determines the winner from `highestBidderId`, updates the auction to `ENDED`, creates a notification for the winner, and appends a won auction entry to the winner's `wonAuctions` list.

**Boto3 / AWS calls:**

```text
dynamodb.Table("Auctions").get_item(Key={"auctionId": auction_id})
dynamodb.Table("Notifications").put_item(Item=notification_item, ConditionExpression="attribute_not_exists(notificationId)")
dynamodb.Table("Users").update_item(Key={"userId": winner_id}, ...)
dynamodb.Table("Auctions").update_item(Key={"auctionId": auction_id}, ...)
```

**Response:** Object containing auction ID, winner ID, final price, notification status, and processing message.

**Important notes:** The Lambda is designed to be mostly idempotent by checking `winnerProcessedAt`, but duplicate won-auction entries should still be considered when changing this flow.

---

## 9. DynamoDB Data Model

### 9.1 `Users` table

**Primary key:** `userId` string.

**Purpose:** Stores user profiles, roles, blocked status, favorites, bid participation, and won auctions.

| Field | Meaning |
| --- | --- |
| `userId` | Firebase UID and DynamoDB partition key. |
| `email` | User email. |
| `displayName` | Display name shown in the UI. |
| `profilePic` / `photoURL` / `profileImageKey` | Profile image fields. |
| `bio` | User profile bio. |
| `role` | Usually `USER` or `ADMIN`. |
| `status` | Usually `ACTIVE` or `BLOCKED`. |
| `favoriteAuctions` | Set of favorite auction IDs. |
| `biddedAuctions` | Set of auction IDs the user bid on. |
| `wonAuctions` | List of auctions the user won. |
| `createdAt`, `updatedAt` | Audit timestamps. |

### 9.2 `Auctions` table

**Primary key:** `auctionId` string.

**Purpose:** Stores auction details, seller data, timing, status, pricing, image references, Agora channel data, and winner results.

| Field | Meaning |
| --- | --- |
| `auctionId` | Auction ID, usually `auc_` plus UUID. |
| `sellerId`, `sellerName`, `sellerEmail` | Auction owner information. |
| `title`, `description`, `category` | Product listing details. |
| `status` | `UPCOMING`, `LIVE`, or `ENDED`. |
| `startsAt`, `endsAt` | Auction lifecycle timestamps. |
| `expireAt` | End time plus retention period, useful for TTL if enabled. |
| `startingPrice`, `currentPrice` | Auction price fields. |
| `bidCount` | Number of accepted bids. |
| `highestBidderId`, `highestBidderEmail` | Current leading bidder. |
| `imageKey`, `imageKeys`, `imageUrl` | Product image references. |
| `agoraChannelName`, `videoProfile` | Live video fields. |
| `winnerId`, `winnerEmail`, `finalPrice`, `endedAt`, `winnerProcessedAt` | Winner processing fields. |

### 9.3 `Bids` table

**Primary key:** Partition key `auctionId`, sort key `placedAt`.

**Secondary index:** `bidderId-placedAt-index`, with `bidderId` as partition key and `placedAt` as sort key.

**Purpose:** Stores bid history per auction and supports dashboard queries per bidder.

| Field | Meaning |
| --- | --- |
| `auctionId` | Auction receiving the bid. |
| `placedAt` | Sort key and bid timestamp. |
| `createdAt` | Bid creation timestamp. |
| `bidId` | Bid ID, usually `bid_` plus UUID. |
| `bidderId`, `bidderEmail`, `displayName` | Bidder identity/display data. |
| `amount` | Bid amount. |
| `status` | Usually `ACCEPTED`. |

### 9.4 `Notifications` table

**Primary key:** Partition key `userId`, sort key `notificationId`.

**Purpose:** Stores user notifications, especially winner notifications after auction closing.

| Field | Meaning |
| --- | --- |
| `userId` | Notification recipient. |
| `notificationId` | Unique notification ID, for example `AUCTION_WON#{auctionId}`. |
| `type` | Notification type, such as `AUCTION_WON`. |
| `title`, `message` | UI display text. |
| `auctionId`, `auctionTitle`, `amount` | Related auction data. |
| `read` | Whether the notification was read. |
| `createdAt` | Creation timestamp. |

---

## 10. S3 Image Upload and Display Flow

BidIt stores image files in S3 and stores only the object keys in DynamoDB.

Upload flow:

1. The frontend sends `POST /upload-url` with `uploadType`, `contentType`, `userId`, and optionally `auctionId`.
2. `generateS3ImageUrls.py` validates the request and generates a presigned `put_object` URL.
3. The frontend uploads the binary image directly to S3 using `PUT`.
4. The frontend saves the returned `imageKey` or `imageKeys` through `PATCH /auctions/{auctionId}` or `PATCH /users/{userId}`.

Display flow:

1. The frontend sends `POST /upload-url` with `action: "get"` and `imageKey`.
2. The Lambda returns a temporary presigned `get_object` URL.
3. The frontend uses that URL as the image source.

This design keeps the S3 bucket private while still allowing temporary browser access to specific images.

---

## 11. Step Functions Auction Closing Flow

The project uses a Step Functions workflow named `WinnerMachine` to close auctions and process winners.

The execution is started once by `createAuction.py` after the auction item is written to DynamoDB. The workflow should not rely only on the original end time. Instead, it reads the latest auction data from DynamoDB before deciding whether the auction is over.

Expected flow:

```text
Auction created
  -> createAuction starts WinnerMachine execution
    -> CheckAuctionStatus reads auction from DynamoDB
      -> IsAuctionOver checks whether now >= latest endsAt
        -> false: wait until latest endTime, then check again
        -> true: ProcessAuctionWinner closes auction and creates winner outputs
```

This design is important because `placeBid.py` can extend `endsAt` during the anti-sniping window. Since `CheckAuctionStatus.py` reads the latest `endsAt` from DynamoDB, the workflow can support extensions without starting a new Step Functions execution. This behavior should still be tested end-to-end after changes to bidding, timing, or winner processing.

Deployment note: Lambda ARNs inside the ASL definition should use placeholders or deployment-time substitution, for example:

```text
arn:aws:lambda:<region>:<account-id>:function:<lambda-name>
```

Avoid committing reusable infrastructure files with a specific AWS account ID unless that is explicitly required for the target environment.

---

## 12. Firebase Realtime Database Interfaces

Firebase Realtime Database is used for realtime features that are not handled through API Gateway.

### 12.1 Live chat

**Path:** `auctionChats/{auctionId}/messages`

**Writer:** `LiveChat.jsx`

**Reader:** `LiveChat.jsx`

**Purpose:** Stores live chat messages for each auction. Messages include fields such as `auctionId`, `userId`, `userName`, `text`, and `createdAt`.

### 12.2 Viewer presence

**Path:** `auctions/{auctionId}/viewers/{userId}`

**Writer:** Auction details page hook.

**Reader:** Viewer count hook/component.

**Purpose:** Tracks which users are currently viewing an auction page. The frontend uses Firebase `onDisconnect` to remove viewer presence automatically when the user disconnects.

### 12.3 Blocked-user status push

**Path:** `userStatuses/{userId}`

**Writer:** Admin block/unblock flow.

**Reader:** `AuthContext`.

**Purpose:** Allows the frontend to immediately log out users whose status changes to `BLOCKED`.

---

## 13. Agora Live Video Flow

Agora is used for live auction video streaming.

1. The auction stores an `agoraChannelName`.
2. The frontend asks `GET /agora/token` for a token before joining the channel.
3. The Lambda generates a publisher token for the seller or a subscriber token for viewers.
4. The frontend uses `VITE_AGORA_APP_ID` and the generated token to join the Agora channel.
5. The seller publishes camera/microphone tracks.
6. Viewers subscribe to the seller's remote stream.

Important security note: `VITE_AGORA_APP_ID` can be exposed in the frontend, but `AGORA_APP_CERT` must remain secret and backend-only.

---

## 14. Environment Variables and Configuration

| Variable / config | Used by | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Frontend API helpers | API Gateway base URL, for example `https://<api-id>.execute-api.<region>.amazonaws.com/<stage>`. |
| `VITE_AGORA_APP_ID` | Frontend video code | Public Agora App ID used by the browser. |
| Firebase web config | Frontend Firebase setup | Firebase Auth and Realtime Database initialization. |
| `USERS_TABLE_NAME` | `createUser.py` | DynamoDB users table name. |
| `AGORA_APP_ID` | `generateAgoraToken.py` | Agora App ID for backend token generation. |
| `AGORA_APP_CERT` | `generateAgoraToken.py` | Agora App Certificate. This is secret. |
| S3 bucket name | `generateS3ImageUrls.py` | Bucket for image storage. Prefer environment configuration. |
| `STATE_MACHINE_ARN` | `createAuction.py` | Step Functions state machine ARN. Prefer environment configuration. |
| DynamoDB table names | Most Lambdas | Table names such as `Users`, `Auctions`, `Bids`, and `Notifications`. Prefer environment configuration for portability. |
| `BIDDER_INDEX_NAME` | `getUserBids.py` | GSI name for querying bids by bidder. |

No secret values should be committed to the repository. Frontend `VITE_` variables are visible to users in the browser and must not contain secrets.

---

## 15. Known Limitations and Recommended Improvements

These notes are documented to help future developers maintain the project safely. They should be treated as improvement points rather than blockers for understanding the current implementation.

1. **Backend authorization should be strengthened.** API Gateway currently does not enforce Firebase JWT validation. Admin Lambdas should verify the caller's identity and role.

2. **AWS account-specific values should be parameterized.** Step Functions ARNs, Lambda ARNs, API IDs, and bucket names should be configured through environment variables, deployment scripts, or infrastructure-as-code templates.

3. **Auction deletion does not clean related data.** `deleteAuction.py` removes the auction item only. Related bids, favorites, notifications, images, and workflow executions are not currently cleaned up.

4. **Status consistency should be reviewed.** `getAllAuctions.py` can compute status dynamically for the response, while stored DynamoDB status may remain unchanged until another Lambda updates it.

5. **Bid extension flow should be regression-tested.** `placeBid.py` can extend the auction end time. The Step Functions workflow should always re-read the latest `endsAt` before processing the winner.

6. **Notifications do not currently have a mark-as-read flow.** Notifications can be displayed, but a dedicated read/unread update API is not documented.

7. **Dashboard won auctions and profile won auctions should be aligned.** Profile data can come from backend `wonAuctions`, while dashboard mock data should be replaced with backend data if this feature is required.

8. **Preserve the `Bids` GSI.** The `getUserBids.py` Lambda depends on `bidderId-placedAt-index`. Recreating the table without this index will break the dashboard bid query.

9. **Use environment variables for table and bucket names.** Some Lambdas use hard-coded names. Moving these to environment variables will make the project easier to deploy in another AWS account or region.

10. **Add monitoring and logs retention policy.** CloudWatch logs are useful for debugging. For a more production-ready deployment, define log retention, alarms, and basic operational monitoring.

---

## 16. Developer Checklist for Adding a New Feature

When adding a new backend feature, use the following process:

1. Add or update the relevant Lambda in `lambdas/`.
2. Define the public route in API Gateway if the feature is called by the frontend.
3. Add CORS support for the required method.
4. Add any required IAM permissions for DynamoDB, S3, Step Functions, or other AWS services.
5. Add or update a frontend API helper in `frontend/src/api/`.
6. Call the helper from the relevant hook or component.
7. Document the input, output, errors, and AWS calls in this document.
8. If authentication or admin permissions are required, enforce them in the backend and not only in the frontend.
9. Test the full flow from the browser, API Gateway, Lambda logs, and DynamoDB/S3 results.

---

## 17. Summary

BidIt uses a serverless architecture where the React frontend communicates with API Gateway, and API Gateway invokes Python Lambdas. The Lambdas use Boto3 to access DynamoDB, S3, and Step Functions. Firebase handles identity and realtime features, while Agora handles live video.

The most important implementation areas for future developers are the Lambda interfaces, the API routes, the DynamoDB schema, the S3 presigned URL image flow, and the Step Functions winner-processing workflow. Keeping these interfaces documented and consistent will make it easier to maintain the project and safely extend it.
