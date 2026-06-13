# BidIt Developer Documentation

## 1. Project Overview

BidIt is a live auction marketplace implemented as a React/Vite single-page application with a serverless backend. The application supports the following user-facing and administrator-facing workflows[...]

- Users browse auctions from the home page, live auctions page, dashboard, and auction detail routes.
- Users sign up and log in with Firebase Auth email/password or Google sign-in.
- Users create scheduled or immediately live auctions through the Go Live flow.
- Users upload product images and profile images through S3 presigned URLs.
- Users place bids on live auctions.
- Users save and remove favorite auctions.
- Users manage profile information, profile images, notifications, and dashboard tabs.
- Sellers can host an Agora video broadcast for an auction they own.
- Viewers can connect to the seller's Agora channel, participate in Firebase Realtime Database chat, and appear in Firebase viewer presence.
- Admins can view users, block/unblock users, promote users to admin, view auctions, search/filter in the UI, and delete auctions.

The Lambda source in `lambdas/` remains the backend behavior source of truth, while the latest verified API Gateway Swagger export supplied for `BiditAPI` is the source of truth for public API paths, [...].

## 2. High-Level Architecture

### Main architecture

```text
React/Vite frontend
  -> API Gateway REST/HTTP endpoint using VITE_API_BASE_URL
    -> AWS Lambda functions in lambdas/
      -> DynamoDB tables: Users, Auctions, Bids, Notifications
      -> S3 bucket: bidit-auction-images-2026
      -> Step Functions state machine: WinnerMachine
  -> Firebase Auth for identity
  -> Firebase Realtime Database for chat, viewer presence, and blocked-user status push updates
  -> Agora RTC for live video
```

### Request flow

1. The frontend reads `import.meta.env.VITE_API_BASE_URL` in `frontend/src/api/*.js`.
2. API helpers call paths such as `/auctions`, `/users/{userId}`, `/upload-url`, and `/agora/token`.
3. API Gateway invokes the corresponding Lambda.
4. Lambda validates request path/query/body fields.
5. Lambda reads or writes DynamoDB, creates S3 presigned URLs, starts Step Functions, or generates Agora tokens.
6. Lambda returns a JSON response with CORS headers.
7. The frontend maps response data into component state.

### Image upload and view flow

1. The frontend calls `POST /upload-url` with `uploadType`, `contentType`, `fileName`, `userId`, and optionally `auctionId`.
2. `generateS3ImageUrls.py` validates the content type and creates an S3 presigned `put_object` URL.
3. The frontend uploads the binary file directly to S3 using `PUT` and the file content type.
4. The frontend stores only the returned S3 object key in DynamoDB through auction/profile update APIs.
5. To display an image, the frontend calls `POST /upload-url` with `action: "get"` and `imageKey`.
6. The Lambda creates a presigned `get_object` URL valid for one hour.

### Auction closing workflow

The Step Functions workflow has been manually verified from AWS and its ASL definition is stored in this repository at `backend/step-functions/WinnerMachine.asl.json`.

Implemented workflow:

- `createAuction.py` starts a Step Functions execution on the hard-coded state machine ARN `arn:aws:states:us-east-1:069765036595:stateMachine:WinnerMachine` with input `{ "auctionId", "endTime" }`.
- The state machine starts at `CheckDynamoDB`, not with an initial Wait state.
- `CheckDynamoDB` invokes the `CheckAuctionStatus` Lambda, which reads the auction from DynamoDB and returns `isAuctionOver`, `endTime`, and `status`.
- `IsAuctionOver` is a Choice state that checks `$.isAuctionOver`.
- If `isAuctionOver` is `true`, `ProcessWinner` invokes `ProcessAuctionWinner` to end the auction, set winner/final-price fields, create the winner notification, and append the won auction to the winn[...]
- If `isAuctionOver` is `false`, `SleepUntilEnd` waits until `TimestampPath: $.endTime`, then loops back to `CheckDynamoDB`.
- Because the workflow re-checks DynamoDB before processing the winner and waits using the latest `endTime` returned by `CheckAuctionStatus`, this design supports auction end-time extensions.

```text
Auction created
  -> createAuction starts WinnerMachine with auctionId and endTime
    -> CheckDynamoDB invokes CheckAuctionStatus
      -> IsAuctionOver checks $.isAuctionOver
        -> true: ProcessWinner invokes ProcessAuctionWinner and ends
        -> false: SleepUntilEnd waits until $.endTime, then checks DynamoDB again
```

The ASL file currently contains real Lambda ARNs with a specific AWS account ID. Reusable deployment scripts or IaC should parameterize or generate those ARNs for the target AWS account.

[... Full ARCHITECTURE.md content continues with sections 3-15 ...]

For complete architecture details, see the full documentation file.
