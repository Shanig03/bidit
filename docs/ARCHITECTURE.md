# BidIt Developer Documentation

## 1. Project Overview

BidIt is a live auction marketplace implemented as a React/Vite single-page application with a serverless backend. The application supports the following user-facing and administrator-facing workflows verified from the repository:

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

The Lambda source in `lambdas/` remains the backend behavior source of truth, while the latest verified API Gateway Swagger export supplied for `BiditAPI` is the source of truth for public API paths, HTTP methods, stage, and Lambda integrations. The API Gateway export confirms the `/dev` stage in `us-east-1`; configure the actual deployed API URL through `VITE_API_BASE_URL` using the format `https://<api-id>.execute-api.us-east-1.amazonaws.com/dev`.

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
- If `isAuctionOver` is `true`, `ProcessWinner` invokes `ProcessAuctionWinner` to end the auction, set winner/final-price fields, create the winner notification, and append the won auction to the winner's profile.
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

## 3. Technology Stack

| Area | Verified technology/library |
| --- | --- |
| Frontend framework | React `^19.2.6`, Vite `^8.0.12` |
| Routing | `react-router-dom` `^7.15.0` |
| Authentication | Firebase Auth from `firebase` `^12.13.0` |
| Realtime data | Firebase Realtime Database from `firebase/database` |
| Video streaming | `agora-rtc-sdk-ng` `^4.24.3`, `agora-rtc-react` `^2.5.1` |
| Icons | `react-icons` `^5.6.0` |
| AWS SDK in Lambda | `boto3`, `botocore` |
| Database | DynamoDB tables `Users`, `Auctions`, `Bids`, `Notifications` |
| Object storage | S3 bucket `bidit-auction-images-2026` |
| Workflow | AWS Step Functions client in `createAuction.py`; `CheckAuctionStatus.py` and `ProcessAuctionWinner.py` are workflow tasks |
| Agora token backend | Python Lambda using `agora_token_builder.RtcTokenBuilder` |

## 4. Repository Structure

```text
/README.md                         Project summary and local run notes
/requirements.txt                  Python backend dependency list; file appears encoded with null bytes
/lambdas/                          AWS Lambda source files
/backend/step-functions/            Manually verified Step Functions ASL definitions, including WinnerMachine.asl.json
/frontend/package.json             Frontend dependencies and npm scripts
/frontend/vite.config.js           Vite configuration
/frontend/constants/               Shared constants such as USER_ROLES
/frontend/src/api/                 Frontend API helper modules
/frontend/src/components/          Reusable UI and feature components
/frontend/src/context/             React context, mainly AuthContext
/frontend/src/data/                Mock/static fallback data used by some UI areas
/frontend/src/firebase/            Firebase Auth and Realtime Database setup
/frontend/src/hooks/               Feature hooks for auth, auctions, admin, bidding, profile, video, favorites
/frontend/src/pages/               Route-level page components
/frontend/src/utils/               Utility functions such as number formatting
```

## 5. Frontend Modules

| Module | Main files | Purpose | Main data/API usage |
| --- | --- | --- | --- |
| App routing | `frontend/src/App.jsx`, `ProtectedRoute.jsx` | Defines public routes, protected user routes, admin-only routes, and Agora provider layout. | Firebase user from `AuthContext`; admin role from `USER_ROLES`. |
| Authentication | `AuthContext.jsx`, `useSignup.js`, `useLogin.js`, `useLogOut.js`, `firebaseConfig.js`, `LoginComp.jsx`, `SignUpComp.jsx` | Firebase email/password signup, Google login, logout, profile sync, blocked-user handling. | Firebase Auth; `GET /users/{userId}`; `POST /users`; Firebase RTDB `userStatuses/{uid}/status`. |
| Auction lists | `useTrendingAuctions.js`, `useLiveAuctions.js`, `HomeComp.jsx`, `LiveAuctionsComp.jsx`, `AuctionCard.jsx` | Loads auctions, maps backend auction records, supports display/search/category filtering in components. | `GET /auctions`; image view URLs through `POST /upload-url`; viewer counts via Firebase. |
| Auction details | `useAuctionDetails.js`, `AuctionDetailsPage.jsx`, `AuctionDetailsComp.jsx`, `ProductImageGallery.jsx`, `ProductDescription.jsx` | Loads one auction, recent bids, product images, chat data, viewer presence, and bidding handler. | `GET /auctions/{auctionId}`; `GET /auctions/{auctionId}/bids`; `POST /auctions/{auctionId}/bid`; Firebase `auctions/{auctionId}/viewers/{userId}`. |
| Bidding | `useBidPanel.js`, `BidPanel.jsx`, `RecentBids.jsx` | Validates bid amount before invoking backend and shows current/recent bid state. | `POST /auctions/{auctionId}/bid`; re-fetches auction and bids after success. |
| Favorites | `useFavorites.js`, `favoritesService.js`, `FavoriteButton.jsx`, dashboard favorites tab | Adds/removes favorites and normalizes favorite auction records. | Verified Swagger routes: `GET /users/{userId}/favorites`, `POST /users/{userId}/favorites`, `DELETE /users/{userId}/favorites/{auctionId}`. The delete route now aligns with frontend and Lambda expectations. |
| Dashboard | `useDashboard.js`, `DashboardComp.jsx`, `DashboardTabs.jsx`, dashboard item components | Shows auctions, favorites/bids tabs, and static won-auction mock data. | `GET /auctions`; `GET /users/{userId}/bids`; mock `getDashboardItems('wonAuctions')`. |
| Go Live / create auction | `useGoLive.js`, `GoLiveComp.jsx`, `ProductImageUploader.jsx`, `UploadBox.jsx` | Validates auction form, creates auction, uploads up to six product images, updates auction image keys. | `POST /auctions`; `POST /upload-url`; S3 `PUT`; `PATCH /auctions/{auctionId}`. |
| Profile | `useProfile.js`, `ProfileComp.jsx` | Loads and edits profile, uploads profile images, displays notifications and won auctions. | `GET /users/{userId}`; `PATCH /users/{userId}`; `GET /users/{userId}/notifications`; `POST /upload-url`. |
| Admin | `useAdmin.js`, `adminApi.js`, `AdminUsersPage.jsx`, `AdminAuctionsPage.jsx`, admin components | User and auction administration. | `GET /admin/users`; `PATCH /admin/users/{userId}/status`; `PATCH /admin/users/{userId}/role`; `GET /auctions`; `DELETE /admin/auctions/{auctionId}`; Firebase `userStatuses/{userId}`. |
| Live chat | `LiveChat.jsx` | Realtime auction chat. | Firebase RTDB `auctionChats/{auctionId}/messages`. |
| Live video | `useAuctionVideo.js`, `AuctionVideoPanel.jsx`, `agoraApi.js` | Host publishes and viewers subscribe to Agora channels. | `GET /agora/token`; `VITE_AGORA_APP_ID`; Agora SDK. |

## 6. Backend and AWS Services

### API Gateway

Frontend requests are built from `VITE_API_BASE_URL`. The latest verified Swagger export identifies this API as `BiditAPI`, Swagger `2.0`, region `us-east-1`, and base path/stage `/dev`. The base URL should be configured in the frontend environment as `https://<api-id>.execute-api.us-east-1.amazonaws.com/dev`; do not hard-code a concrete deployed API ID in the documentation or source code.

The Swagger uses `x-amazon-apigateway-integration` with `type: aws_proxy`. API Gateway invokes Lambda internally with integration `httpMethod: POST` even for public `GET`, `PATCH`, and `DELETE` routes. This document therefore lists the public client-facing HTTP method and path, not the internal Lambda invocation method.

Verified business routes from the Swagger export:

| Public method/path | Lambda integration | Purpose |
| --- | --- | --- |
| `GET /admin/users` | `getAllUsers` | Admin user-management list. |
| `PATCH /admin/users/{userId}/status` | `updateUserStatus` | Update blocked/active status. |
| `PATCH /admin/users/{userId}/role` | `updateUserRole` | Promote/update user role. |
| `DELETE /admin/auctions/{auctionId}` | `deleteAuction` | Admin auction deletion. |
| `GET /agora/token` | `bidit-agora-token-generator` | Generate Agora live-video token. |
| `GET /auctions` | `getAllAuctions` | Retrieve auction list. |
| `POST /auctions` | `createAuction` | Create auction and start closing workflow. |
| `GET /auctions/{auctionId}` | `getAuction` | Retrieve a single auction. |
| `PATCH /auctions/{auctionId}` | `updateAuction` | Update auction information/status. |
| `POST /auctions/{auctionId}/bid` | `placeBid` | Place a bid. The verified route is singular `/bid`. |
| `GET /auctions/{auctionId}/bids` | `getAuctionBids` | Retrieve auction bids/recent bids. |
| `POST /upload-url` | `generateS3ImageUrls` | Generate S3 upload/view presigned URLs. |
| `POST /users` | `createUser` | Create/save user profile. |
| `GET /users/{userId}` | `updateUserProfile` | Retrieve user profile; the Lambda branches by HTTP method. |
| `PATCH /users/{userId}` | `updateUserProfile` | Update user profile. |
| `GET /users/{userId}/bids` | `getUserBids` | Retrieve user bid dashboard data. |
| `GET /users/{userId}/favorites` | `getFavorites` | Retrieve favorite auctions. |
| `POST /users/{userId}/favorites` | `addToFavorites` | Add a favorite auction. |
| `DELETE /users/{userId}/favorites/{auctionId}` | `removeAuctionFromFavorites` | Remove a specific auction from a user's favorites. |
| `GET /users/{userId}/notifications` | `getNotifications` | Retrieve profile notifications. |

The Swagger also includes several `OPTIONS` methods and parent paths such as `/admin`, `/admin/auctions`, `/admin/users/{userId}`, `/users/{userId}/favorites/{auctionId}`, and `/agora` that are CORS mock integrations only. They are not documented as business APIs. For `/users/{userId}/favorites/{auctionId}`, the CORS mock route allows `DELETE,OPTIONS`.

CORS headers in the Swagger include `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token`, and route-specific `Access-Control-Allow-Methods` values.

The exported and manually verified API Gateway Method Request configuration uses `Authorization: NONE`, `API key required: False`, and `Request validator: None`. API Gateway does not enforce Firebase JWT validation or admin authorization at the gateway level. Some frontend helpers send Firebase JWTs in `Authorization: Bearer <token>`, but gateway-level authorization is not configured; authorization and role checks must be handled by the frontend and/or Lambda code where implemented. For production, add an API Gateway authorizer or stronger backend Firebase token validation.

### Lambda

The repository contains these Lambda handlers:

- `createUser.py`
- `updateUserProfile.py`
- `getAllUsers.py`
- `updateUserStatus.py`
- `updateUserRole.py`
- `getAllAuctions.py`
- `getLiveAuctions.py`
- `getAuction.py`
- `createAuction.py`
- `updateAuction.py`
- `deleteAuction.py`
- `placeBid.py`
- `getAuctionBids.py`
- `getUserBids.py`
- `addToFavorites.py`
- `getFavorites.py`
- `removeAuctionFromFavorites.py`
- `getNotifications.py`
- `generateS3ImageUrls.py`
- `generateAgoraToken.py`
- `CheckAuctionStatus.py`
- `ProcessAuctionWinner.py`

### DynamoDB

The DynamoDB table schemas were manually verified from the AWS Console. All listed tables use on-demand capacity mode.

| Table | Key schema | Capacity mode | Purpose |
| --- | --- | --- | --- |
| `Auctions` | Partition key `auctionId` (String); no sort key | On-demand | Stores seller data, auction status, current price, highest bidder, bid count, start/end times, image references, and Agora channel information. |
| `Bids` | Partition key `auctionId` (String); sort key `placedAt` (String) | On-demand | Stores bid records per auction and supports querying bids by auction ordered by `placedAt`. |
| `Notifications` | Partition key `userId` (String); sort key `notificationId` (String) | On-demand | Stores user notifications, including winner notifications created after auction closing. |
| `Users` | Partition key `userId` (String); no sort key | On-demand | Stores user profiles, roles, blocked status, favorite auctions, bidded auctions, and won auctions. |

`getUserBids.py` uses the manually verified `Bids` table GSI `bidderId-placedAt-index` to retrieve a user's bids. The verified GSI is active, uses partition key `bidderId` (String), sort key `placedAt` (String), and on-demand capacity mode. Keep this index documented and preserve it in IaC/deployment changes. `createUser.py` reads the users table name from `USERS_TABLE_NAME`; most other Lambdas use hard-coded table names.

### S3

`generateS3ImageUrls.py` uses bucket `bidit-auction-images-2026` and supports private image upload/view through presigned URLs. Keys are generated as:

- Profile image: `profile-images/{userId}/{uuid}.{jpg|png|webp}`
- Auction image: `auction-images/{auctionId}/{uuid}.{jpg|png|webp}`

### Step Functions

`createAuction.py` starts `WinnerMachine` after writing an auction. The manually verified Standard Step Functions ASL definition is stored at `backend/step-functions/WinnerMachine.asl.json`. The workflow starts at `CheckDynamoDB`, invokes `CheckAuctionStatus`, branches on `$.isAuctionOver`, waits until `$.endTime` (`TimestampPath: $.endTime`) when the auction is not over, and invokes `ProcessAuctionWinner` when the auction is over. The ASL currently contains account-specific Lambda ARNs and should be parameterized in reusable deployment scripts or IaC.

### CloudWatch/logs

Lambdas use `print()` or Python `logging` calls. CloudWatch log group names and retention settings are not found in the current codebase.

## 7. API and Lambda Interface Documentation

### createUser / createUserProfile

Purpose: Create or return a DynamoDB user profile after Firebase signup or Google login.

Frontend caller: `frontend/src/api/usersApi.js` `createUserProfile`; `useSignup.js`; `useLogin.js` for Google profile sync.

Endpoint: `POST /users`

Authentication: Frontend includes Firebase JWT in `Authorization` when `auth.currentUser` exists. `createUser.py` does not verify the JWT in code.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Body | `uid` | string | Yes | Firebase UID; stored as DynamoDB `userId`. |
| Body | `email` | string | Yes | User email. |
| Body | `displayName` | string | Optional | User display name; falls back to email prefix. |
| Body | `profilePic` | string | Optional | Initial profile picture URL/key. |
| Body | `createdAt` | string | Optional | Client-provided creation timestamp; Lambda uses current UTC if missing. |

Example request:

```json
{
  "uid": "firebase_uid_123",
  "email": "buyer@example.com",
  "displayName": "Buyer One",
  "profilePic": ""
}
```

Main processing:

- Validates `uid` and `email`.
- Reads DynamoDB table name from `USERS_TABLE_NAME`.
- Gets existing item by `userId`; returns it with status `200` if found.
- Creates a new item with `role: "user"` and `status: "active"`.

Response format:

```json
{
  "userId": "string",
  "email": "string",
  "displayName": "string",
  "profilePic": "string",
  "createdAt": "string",
  "role": "user",
  "status": "active"
}
```

Example response:

```json
{
  "userId": "firebase_uid_123",
  "email": "buyer@example.com",
  "displayName": "Buyer One",
  "profilePic": "",
  "createdAt": "2026-06-12T10:00:00+00:00",
  "role": "user",
  "status": "active"
}
```

Errors / edge cases:

- `400` if `uid` or `email` is missing.
- `500` if `USERS_TABLE_NAME` is not configured or DynamoDB fails.
- Role/status casing differs from other admin Lambdas (`user`/`active` vs `USER`/`ACTIVE`); frontend normalizes to uppercase.

AWS/external services used: DynamoDB `Users` table through `USERS_TABLE_NAME`; Firebase UID supplied by frontend.

### updateUserProfile / getUserProfile

Purpose: Read or update a user profile.

Frontend caller: `getUserProfile`, `updateUserProfile` in `usersApi.js`; `AuthContext.jsx`; `useLogin.js`; `useProfile.js`.

Endpoint: `GET /users/{userId}` and `PATCH /users/{userId}`

Verified Swagger Lambda integration: both methods map to `updateUserProfile`. The Lambda branches on the public HTTP method, so `GET` retrieves the profile and `PATCH` updates it.

Authentication: Frontend includes Firebase JWT when logged in. `updateUserProfile.py` does not verify token ownership in code.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Path | `userId` | string | Yes | DynamoDB user primary key. |
| Body PATCH | `displayName` | string | Yes | Profile display name. |
| Body PATCH | `email` | string | Optional | Email to store. |
| Body PATCH | `bio` | string | Optional | Profile bio. |
| Body PATCH | `photoURL` | string | Optional | Stored photo URL; frontend sends empty string when using S3 key. |
| Body PATCH | `profileImageKey` | string | Optional | S3 object key for profile image. |
| Body PATCH | `wonAuction` | object | Optional | Appended to `wonAuctions` if provided. |

Example request:

```json
{
  "displayName": "Buyer One",
  "email": "buyer@example.com",
  "bio": "Collector of cameras",
  "photoURL": "",
  "profileImageKey": "profile-images/firebase_uid_123/image.webp"
}
```

Main processing:

- `GET`: retrieves user by `userId` from `Users`.
- `PATCH`: validates non-empty `displayName`, updates profile fields, sets `updatedAt`, and initializes `createdAt` if missing.
- If `wonAuction` is supplied, appends it to `wonAuctions`.

Response format:

```json
{
  "message": "Profile updated successfully",
  "user": { }
}
```

Example response:

```json
{
  "message": "Profile updated successfully",
  "user": {
    "userId": "firebase_uid_123",
    "displayName": "Buyer One",
    "email": "buyer@example.com",
    "bio": "Collector of cameras",
    "profileImageKey": "profile-images/firebase_uid_123/image.webp",
    "updatedAt": "2026-06-12T10:05:00Z"
  }
}
```

Errors / edge cases:

- `400` missing `userId`.
- `404` user not found on `GET`.
- `400` missing `displayName` on `PATCH`.
- `405` unsupported method.

AWS/external services used: DynamoDB `Users`.

### getAllUsers

Purpose: Return all users for admin management.

Frontend caller: `adminApi.fetchAllUsers`; `useAdmin.loadUsers`.

Endpoint: `GET /admin/users`

Authentication: Frontend sends `Authorization: Bearer <token>` from `user.token`; Lambda code does not verify admin claims.

Request parameters: None.

Example request: `GET /admin/users`

Main processing:

- Scans the `Users` table with pagination.
- Normalizes missing `status` to `ACTIVE` and missing `role` to `USER` in the response.

Response format:

```json
{
  "users": [ { "userId": "string", "role": "string", "status": "string" } ]
}
```

Errors / edge cases: `500` on scan errors.

AWS/external services used: DynamoDB `Users`.

### updateUserStatus

Purpose: Block or unblock a user in DynamoDB.

Frontend caller: `adminApi.updateUserStatus`; `useAdmin.handleToggleBlock` also writes Firebase RTDB after this call.

Endpoint: `PATCH /admin/users/{userId}/status`

Authentication: Frontend sends admin token. Lambda does not verify token/admin role in code.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Path | `userId` | string | Yes | User to update. |
| Body | `status` | string | Yes | Must be `ACTIVE` or `BLOCKED`; input is uppercased. |

Example request:

```json
{ "status": "BLOCKED" }
```

Main processing:

- Validates `userId` and status.
- Updates `Users.status` and `updatedAt`.
- Frontend then writes `userStatuses/{userId}` to Firebase RTDB so already-logged-in users are logged out.

Response format:

```json
{
  "message": "User status updated successfully",
  "user": { }
}
```

Errors / edge cases:

- `400` if `userId` missing.
- `400` if status is not `ACTIVE` or `BLOCKED`.
- No condition expression is used, so updating a non-existent user may create/update an item depending on DynamoDB behavior.

AWS/external services used: DynamoDB `Users`; Firebase RTDB written by frontend.

### updateUserRole

Purpose: Promote or demote a user role.

Frontend caller: `adminApi.updateUserRole`; `useAdmin.handleMakeAdmin`.

Endpoint: `PATCH /admin/users/{userId}/role`

Authentication: Frontend sends admin token. Lambda does not verify token/admin role in code.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Path | `userId` | string | Yes | User to update. |
| Body | `role` | string | Yes | Must be `USER` or `ADMIN`; input is uppercased. |

Example request:

```json
{ "role": "ADMIN" }
```

Main processing:

- Validates `userId` is present and not `undefined`.
- Validates role.
- Updates role and `updatedAt` with condition `attribute_exists(userId)`.

Response format:

```json
{
  "message": "User role updated successfully",
  "user": { }
}
```

Errors / edge cases:

- `400` invalid `userId`.
- `400` invalid role.
- `404` if user does not exist.
- `500` DynamoDB or unexpected errors.

AWS/external services used: DynamoDB `Users`.

### getAllAuctions

Purpose: Return all auctions and calculate display status from `startsAt`/`endsAt`.

Frontend caller: `getAuctions` in `auctionsApi.js` and `auctionsService.js`; `useDashboard`; `useLiveAuctions`; `useTrendingAuctions`; `adminApi.fetchAllAuctions`.

Endpoint: `GET /auctions`

Authentication: Some frontend callers include Firebase JWT, others do not. Lambda does not require or verify auth in code.

Request parameters: None.

Example request: `GET /auctions`

Main processing:

- Scans all items from `Auctions` with pagination.
- For each auction with valid `startsAt` and `endsAt`, sets response `status` to `UPCOMING`, `LIVE`, or `ENDED` based on current UTC time.
- Does not persist recalculated status back to DynamoDB.

Response format:

```json
{ "auctions": [ { "auctionId": "string" } ] }
```

Example response:

```json
{
  "auctions": [
    {
      "auctionId": "auc_123",
      "title": "Vintage Camera",
      "status": "LIVE",
      "currentPrice": 150,
      "bidCount": 3
    }
  ]
}
```

Errors / edge cases: Date parsing errors are logged and that auction is left unchanged; `500` for scan failures.

AWS/external services used: DynamoDB `Auctions`.

### getLiveAuctions

Purpose: Return auctions whose stored `status` is exactly `LIVE`.

Frontend caller: No direct frontend API helper calls this Lambda in the current codebase. Current frontend live-auction pages use `GET /auctions` and filter/map client-side.

Endpoint: Not found in the verified Swagger export and not called by current frontend API helpers. Treat this Lambda as Lambda-only, planned, or undeployed unless another deployment artifact verifies a public route.

Authentication: None in Lambda code.

Request parameters: None.

Example request: Not found in current codebase.

Main processing:

- Scans `Auctions` once.
- Filters items with `auction.get("status") == "LIVE"`.
- Sorts by `createdAt` descending.

Response format:

```json
{ "auctions": [ ] }
```

Errors / edge cases: Does not paginate beyond the first scan response; `500` on errors.

AWS/external services used: DynamoDB `Auctions`.

### getAuction

Purpose: Return one auction by ID.

Frontend caller: `getAuctionById` in `auctionsApi.js` and `auctionsService.js`; `useAuctionDetails`.

Endpoint: `GET /auctions/{auctionId}`

Authentication: `auctionsService.js` includes Firebase JWT; `auctionsApi.js` does not. Lambda does not verify auth.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Path | `auctionId` | string | Yes | Auction primary key. |

Example request: `GET /auctions/auc_123`

Main processing: Reads `Auctions` by `auctionId`.

Response format:

```json
{ "auction": { "auctionId": "string" } }
```

Errors / edge cases:

- `400` missing `auctionId`.
- `404` auction not found.
- `500` unexpected error.

AWS/external services used: DynamoDB `Auctions`.

### createAuction

Purpose: Create an auction record and start winner-processing workflow.

Frontend caller: `createAuction` in `auctionsApi.js` and `auctionsService.js`; `useGoLive.handleStartAuction`.

Endpoint: `POST /auctions`

Authentication: `auctionsService.js` includes Firebase JWT; Lambda does not verify token in code.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Body | `sellerId` | string | Yes | Seller Firebase UID. |
| Body | `sellerName` | string | Optional | Seller display name; fallback from email or `Unknown Seller`. |
| Body | `sellerEmail` | string | Optional | Seller email. |
| Body | `title` | string | Yes | Auction title. |
| Body | `description` | string | Optional | Auction description. |
| Body | `category` | string | Optional | Auction category. |
| Body | `startsAt` | ISO string | Yes | Start time. |
| Body | `endsAt` | ISO string | Yes | End time. |
| Body | `startingPrice` | number/string | Yes | Initial and current price. |
| Body | `imageUrl` | string | Optional | Legacy/direct image URL. |
| Body | `imageKey` | string | Optional | Primary S3 image key. |
| Body | `imageKeys` | array | Sent by frontend but ignored by create Lambda | Product image key list; later saved by `updateAuction`. |
| Body | `agoraChannelName` | string | Optional | Agora channel name. |
| Body | `videoProfile` | string | Optional | Agora video profile such as `720p_1`. |
| Body | `status` | string | Optional | Defaults to `UPCOMING`; frontend sends `LIVE` or `UPCOMING`. |

Example request:

```json
{
  "sellerId": "seller_uid",
  "sellerName": "Seller One",
  "sellerEmail": "seller@example.com",
  "title": "Vintage Camera",
  "description": "Working condition",
  "category": "Photography",
  "startingPrice": 100,
  "startsAt": "2026-06-12T12:00:00.000Z",
  "endsAt": "2026-06-13T12:00:00.000Z",
  "imageUrl": "",
  "imageKey": "",
  "agoraChannelName": "auction-1780000000000",
  "videoProfile": "720p_1",
  "status": "LIVE"
}
```

Main processing:

- Validates required seller/title/price/start/end fields.
- Creates `auctionId` as `auc_` plus UUID.
- Stores price fields as DynamoDB `Decimal`.
- Sets `currentPrice` equal to `startingPrice`, `bidCount` to `0`, highest bidder fields to empty strings, `createdAt`/`updatedAt`, and TTL-like `expireAt` equal to end time plus 24 hours.
- Writes item to `Auctions`.
- Starts Step Functions execution using `WinnerMachine`; logs but does not fail auction creation if start execution fails.

Response format:

```json
{
  "message": "Auction created",
  "auction": { "auctionId": "string" }
}
```

Errors / edge cases:

- `400` for missing required fields.
- `500` for invalid date parsing or DynamoDB errors.
- Step Functions start failure is logged as critical but the API still returns success.
- `imageKeys` sent by frontend is not included in the initial item by this Lambda.

AWS/external services used: DynamoDB `Auctions`; Step Functions `WinnerMachine`.

### updateAuction

Purpose: Patch selected auction fields, including product image keys after S3 upload.

Frontend caller: `updateAuction` in `auctionsService.js`; `useGoLive` after image upload. `auctionsApi.js` also has `updateAuctionImage` for `PATCH /auctions/{auctionId}/image`, but no matching Lambda source file or verified Swagger route was found.

Endpoint: `PATCH /auctions/{auctionId}`

Authentication: `auctionsService.js` includes Firebase JWT. Lambda does not verify seller/admin authorization.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Path | `auctionId` | string | Yes | Auction to update. |
| Body | `title` | string | Optional | New title. |
| Body | `description` | string | Optional | New description. |
| Body | `category` | string | Optional | New category. |
| Body | `startsAt` | string | Optional | Start time. |
| Body | `endsAt` | string | Optional | End time. |
| Body | `status` | string | Optional | Auction status. |
| Body | `imageUrl` | string | Optional | Direct image URL. |
| Body | `imageKey` | string | Optional | Primary image key. |
| Body | `imageKeys` | array | Optional | Cleaned to non-empty strings, max 6. |
| Body | `startingPrice` | number/string | Optional | Converted to Decimal if possible. |
| Body | `currentPrice` | number/string | Optional | Converted to Decimal if possible. |
| Body | `agoraChannelName` | string | Optional | Agora channel. |
| Body | `videoProfile` | string | Optional | Agora video profile. |

Example request:

```json
{
  "imageKey": "auction-images/auc_123/first.webp",
  "imageKeys": [
    "auction-images/auc_123/first.webp",
    "auction-images/auc_123/second.webp"
  ]
}
```

Main processing:

- Validates `auctionId`.
- Builds a DynamoDB update expression only for allowed fields present in the body.
- Trims string values.
- Converts `startingPrice`/`currentPrice` to Decimal when possible.
- Cleans `imageKeys` to at most six non-empty strings.
- Sets `updatedAt`.

Response format:

```json
{
  "message": "Auction updated successfully",
  "auction": { }
}
```

Errors / edge cases:

- `400` missing `auctionId`.
- `400` if no allowed fields are supplied.
- Does not check that the auction exists before updating.
- Does not restart/update the Step Functions timer if `endsAt` changes.

AWS/external services used: DynamoDB `Auctions`.

### deleteAuction

Purpose: Delete an auction from DynamoDB.

Frontend caller: `adminApi.deleteAuction`; `useAdmin.handleDeleteAuction`.

Endpoint: `DELETE /admin/auctions/{auctionId}`

Authentication: Frontend sends admin token. Lambda does not verify admin role in code.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Path | `auctionId` | string | Yes | Auction to delete. |

Example request: `DELETE /admin/auctions/auc_123`

Main processing:

- Validates `auctionId`.
- Deletes item from `Auctions` with `ReturnValues="ALL_OLD"`.
- Returns `404` if no item existed.

Response format:

```json
{
  "message": "Auction deleted successfully",
  "auctionId": "auc_123"
}
```

Errors / edge cases: `400` missing ID; `404` not found; `500` unexpected errors. Does not delete related bids, favorites, notifications, S3 images, or Step Functions executions.

AWS/external services used: DynamoDB `Auctions`.

### placeBid

Purpose: Place a bid on a live auction and update current price/highest bidder.

Frontend caller: `placeBid` in `auctionsApi.js` and `auctionsService.js`; `useAuctionDetails.handlePlaceBid`; `useBidPanel` triggers that handler.

Endpoint: `POST /auctions/{auctionId}/bid`

Authentication: `auctionsService.js` can include Firebase JWT; `auctionsApi.js` does not. Lambda trusts `bidderId` in the body and does not verify JWT.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Path | `auctionId` | string | Yes | Auction being bid on. |
| Body | `amount` | number/string | Yes | Bid amount; must be greater than current price and > 0. |
| Body | `bidderId` | string | Yes | Bidder user ID. |
| Body | `bidderEmail` | string | Optional | Bidder email. |
| Body | `displayName` | string | Optional | Bidder display name. |
| Body | `bidderName` | string | Optional | Fallback if `displayName` missing. |

Example request:

```json
{
  "bidderId": "buyer_uid",
  "bidderEmail": "buyer@example.com",
  "displayName": "Buyer One",
  "amount": 175
}
```

Main processing:

- Validates `auctionId`, `amount`, and `bidderId`.
- Reads bidder role from `Users`; rejects `ADMIN` bidders.
- Reads auction; rejects missing auction, seller bidding on own auction, auction not started, ended auction, or status not `LIVE`.
- Requires bid amount greater than `currentPrice`.
- Anti-sniping rule: if 0-30 seconds remain, sets `endsAt` to now + 60 seconds.
- Updates `Auctions` conditionally with `ConditionExpression=Attr("currentPrice").lt(bid_amount)`.
- Writes a `Bids` item with `auctionId`, `placedAt`, `createdAt`, `bidId`, bidder fields, `amount`, and `status: "ACCEPTED"`.
- Adds auction ID to `Users.biddedAuctions` set.

Response format:

```json
{
  "message": "Bid accepted",
  "auction": { },
  "bid": { },
  "auctionExtended": true,
  "newEndsAt": "string or null"
}
```

Example response:

```json
{
  "message": "Bid accepted",
  "auction": {
    "auctionId": "auc_123",
    "currentPrice": 175,
    "highestBidderId": "buyer_uid",
    "bidCount": 4
  },
  "bid": {
    "auctionId": "auc_123",
    "bidId": "bid_abc",
    "bidderId": "buyer_uid",
    "amount": 175,
    "status": "ACCEPTED"
  },
  "auctionExtended": false,
  "newEndsAt": null
}
```

Errors / edge cases:

- `400` missing amount, missing auction ID, non-positive bid, or bid not higher than current price.
- `403` admin bidder, seller bidding on own auction, not started, ended, or not `LIVE`.
- `404` auction not found.
- Conditional update failure returns rejected higher-bid race message.
- Anti-sniping extends DynamoDB `endsAt`. The verified Step Functions workflow re-checks DynamoDB and waits using the latest `endTime`, so it is designed to support auction extensions; regression-test this flow after changes to bidding or winner processing.

AWS/external services used: DynamoDB `Auctions`, `Bids`, `Users`.

### getAuctionBids

Purpose: Return bids for an auction.

Frontend caller: `getBidsByAuctionId` in `auctionsApi.js`; `useAuctionDetails`.

Endpoint: `GET /auctions/{auctionId}/bids`

Authentication: None in frontend helper; Lambda does not verify auth.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Path | `auctionId` | string | Yes | Auction whose bids should be queried. |

Example request: `GET /auctions/auc_123/bids`

Main processing: Queries `Bids` with partition key `auctionId`, `ScanIndexForward=False`.

Response format:

```json
{ "bids": [ { "bidId": "string", "amount": 0 } ] }
```

Errors / edge cases: `400` missing auction ID; `500` DynamoDB errors.

AWS/external services used: DynamoDB `Bids`.

### getUserBids

Purpose: Return active/relevant bid dashboard items for a user.

Frontend caller: `bidsService.getUserBids`; `useDashboard` when the My Bids tab is opened.

Endpoint: `GET /users/{userId}/bids`

Authentication: Frontend helper does not send token; Lambda does not verify auth.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Path | `userId` | string | Yes | Bidder/user ID. |

Example request: `GET /users/buyer_uid/bids`

Main processing:

- Queries `Bids` GSI `bidderId-placedAt-index` for the user.
- Selects the latest/highest bid per auction.
- Batch gets matching auctions from `Auctions`.
- Filters out auctions with stored status `ENDED` or elapsed `endsAt`.
- Returns dashboard-ready objects containing bid status `winning` or `outbid`.

Response format:

```json
[
  {
    "id": "string",
    "bidId": "string",
    "auctionId": "string",
    "title": "string",
    "myBid": 0,
    "currentBid": 0,
    "status": "winning"
  }
]
```

Errors / edge cases:

- `400` missing `userId`.
- `200 []` if no bids.
- Code has a likely bug in `get_latest_or_highest_bid_per_auction`: it compares `created_at` but only defines `placed_at`; this path can raise `NameError` when equal amounts are compared.

AWS/external services used: DynamoDB `Bids`, GSI `bidderId-placedAt-index`, DynamoDB `Auctions` batch get.

### addToFavorites

Purpose: Add an auction ID to a user's favorites set.

Frontend caller: `favoritesService.addFavoriteAuction`; `useFavorites`; `FavoriteButton`.

Endpoint: `POST /users/{userId}/favorites`

Authentication: Frontend helper does not send token; Lambda does not verify auth.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Path | `userId` | string | Yes | User receiving the favorite. |
| Body | `auctionId` | string | Yes | Auction to favorite. |
| Body | `auction` | object | Sent by frontend but ignored by Lambda | Full auction object for local caller convenience. |

Example request:

```json
{
  "auctionId": "auc_123",
  "auction": { "auctionId": "auc_123", "title": "Vintage Camera" }
}
```

Main processing: Updates `Users` with `ADD favoriteAuctions :auctionId`, where value is a DynamoDB string set.

Response format:

```json
{ "message": "Auction added to favorites" }
```

Errors / edge cases: `400` missing user/auction ID; no check that auction exists; no auth ownership check.

AWS/external services used: DynamoDB `Users`.

### getFavorites

Purpose: Return a user's favorite auctions.

Frontend caller: `favoritesService.getFavoriteAuctions`; `useFavorites`.

Endpoint: `GET /users/{userId}/favorites`

Authentication: Frontend helper does not send token; Lambda does not verify auth.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Path | `userId` | string | Yes | User whose favorites are loaded. |

Example request: `GET /users/buyer_uid/favorites`

Main processing:

- Reads user item from `Users`.
- Reads `favoriteAuctions` set.
- Batch gets matching auction items from `Auctions` in chunks of 100.
- Returns a JSON array, not an object with `favorites`.

Response format:

```json
[
  { "auctionId": "auc_123", "title": "Vintage Camera" }
]
```

Errors / edge cases: Missing/empty favorites returns `200 []`; no explicit 404 for missing user.

AWS/external services used: DynamoDB `Users`, `Auctions`.

### removeAuctionFromFavorites

Purpose: Remove an auction ID from a user's favorites set.

Frontend caller: `favoritesService.removeFavoriteAuction`; `useFavorites`.

Endpoint: `DELETE /users/{userId}/favorites/{auctionId}`

Authentication: Frontend helper does not send token; Lambda does not verify auth.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Path | `userId` | string | Yes | User whose favorite is removed. |
| Path | `auctionId` | string | Yes | Auction to remove from the user's favorites. |

Example request: `DELETE /users/buyer_uid/favorites/auc_123`

Main processing: DynamoDB `DELETE favoriteAuctions :auctionId` on `Users` after reading `userId` and `auctionId` from path parameters.

Response format:

```json
{
  "message": "Auction removed from favorites",
  "auctionId": "auc_123"
}
```

Errors / edge cases: `400` missing params; no check that user/auction exists.

AWS/external services used: DynamoDB `Users`.

### getNotifications

Purpose: Return notifications for a profile page.

Frontend caller: `usersApi.getUserNotifications`; `useProfile`.

Endpoint: `GET /users/{userId}/notifications`

Authentication: Frontend helper does not send token; Lambda does not verify auth.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Path | `userId` | string | Yes | Notification partition key. |

Example request: `GET /users/buyer_uid/notifications`

Main processing:

- Queries `Notifications` by `userId`.
- Sorts notifications by `createdAt` descending.
- Does not mark notifications as read.

Response format:

```json
{ "notifications": [ { "notificationId": "string", "read": false } ] }
```

Errors / edge cases: `400` missing user ID; `500` query failure.

AWS/external services used: DynamoDB `Notifications`.

### generateS3ImageUrls / uploadService

Purpose: Create presigned S3 URLs for image upload or image viewing.

Frontend caller: `uploadService.getPresignedUploadUrl`, `uploadFileToS3`, `uploadImage`, `getImageViewUrl`; `useGoLive`; `useProfile`; image display hooks/components.

Endpoint: `POST /upload-url`

Authentication: Frontend does not send token; Lambda does not verify auth.

Request parameters for upload:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Body | `uploadType` | string | Yes | `profile` or `auction`. |
| Body | `contentType` | string | Yes | Must be `image/jpeg`, `image/png`, or `image/webp`. |
| Body | `fileName` | string | Sent by frontend, ignored by Lambda | Original file name. |
| Body | `userId` | string | Yes | User folder/key component. |
| Body | `auctionId` | string | Required for auction uploads | Auction folder/key component. |

Request parameters for view:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Body | `action` | string | Yes | Must be `get` for view URL. |
| Body | `imageKey` | string | Yes | Existing S3 object key. |

Example upload request:

```json
{
  "uploadType": "auction",
  "contentType": "image/webp",
  "fileName": "camera.webp",
  "userId": "seller_uid",
  "auctionId": "auc_123"
}
```

Example view request:

```json
{
  "action": "get",
  "imageKey": "auction-images/auc_123/image.webp"
}
```

Main processing:

- For `action: "get"`, validates `imageKey` and creates a presigned S3 `get_object` URL for 3600 seconds.
- For upload, validates upload type, content type, user ID, and auction ID when needed.
- Generates a UUID-based object key.
- Creates a presigned S3 `put_object` URL for 300 seconds with the requested content type.

Response format:

```json
{
  "uploadUrl": "https://...",
  "imageKey": "auction-images/auc_123/uuid.webp"
}
```

or

```json
{ "viewUrl": "https://..." }
```

Errors / edge cases:

- `400` missing `imageKey`, `uploadType`, `contentType`, `userId`, or auction ID for auction uploads.
- `400` unsupported content type.
- `400` invalid upload type.
- `500` S3 signing failures.

AWS/external services used: S3 bucket `bidit-auction-images-2026`.

### generateAgoraToken / agoraApi

Purpose: Generate a time-limited Agora RTC token for a live auction channel.

Frontend caller: `agoraApi.getAgoraToken`; `useAuctionVideo`.

Endpoint: `GET /agora/token?channelName={channelName}&uid={uid}&isPublisher={true|false}`

Verified Swagger Lambda integration: `bidit-agora-token-generator`. Source file in this repository: `lambdas/generateAgoraToken.py`.

Authentication: Frontend does not send token; Lambda does not verify auth.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Query | `channelName` | string | Yes | Agora channel name, normally auction `agoraChannelName`. |
| Query | `uid` | integer string | Optional; default `0` | Agora numeric UID. |
| Query | `isPublisher` | boolean string | Optional; default `false` | Publisher role when `true`, subscriber role otherwise. |

Example request: `GET /agora/token?channelName=auction-1780000000000&uid=12345&isPublisher=true`

Main processing:

- Reads `AGORA_APP_ID` and `AGORA_APP_CERT` from Lambda environment.
- Validates channel name and integer UID.
- Uses `ROLE_PUBLISHER` for hosts and `ROLE_SUBSCRIBER` for viewers.
- Generates a token valid for 7200 seconds.

Response format:

```json
{
  "token": "string",
  "appId": "string",
  "channelName": "string",
  "uid": 12345,
  "expiresIn": 7200
}
```

Errors / edge cases: `500` missing Agora env vars; `400` missing channel; `400` invalid UID.

AWS/external services used: Agora token builder; Lambda environment variables.

### CheckAuctionStatus

Purpose: Step Functions task to determine whether an auction is over.

Frontend caller: None. Used by the manually verified `WinnerMachine` Standard Step Functions workflow stored at `backend/step-functions/WinnerMachine.asl.json`.

Endpoint: Not an API Gateway endpoint in current codebase. Lambda event payload interface.

Authentication: Not applicable; invoked by AWS service.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Event | `auctionId` | string | Yes | Auction to inspect. |

Example event:

```json
{ "auctionId": "auc_123" }
```

Main processing:

- Reads auction by ID from `Auctions`.
- Validates auction exists and has `endsAt`.
- Parses `endsAt` as UTC.
- Returns `isAuctionOver` if now >= `endsAt` or status is `ENDED`/`CLOSED`.

Response format:

```json
{
  "auctionId": "auc_123",
  "isAuctionOver": true,
  "endTime": "2026-06-12T12:00:00Z",
  "status": "LIVE"
}
```

Errors / edge cases: Raises exceptions for missing `auctionId`, missing auction, or missing `endsAt`; these are Step Functions failures unless caught in state machine.

AWS/external services used: DynamoDB `Auctions`; CloudWatch via logging.

### ProcessAuctionWinner

Purpose: Step Functions task to close an auction, determine the winner, create notification, and add won auction to user profile.

Frontend caller: None. Used by the manually verified `WinnerMachine` Standard Step Functions workflow stored at `backend/step-functions/WinnerMachine.asl.json`.

Endpoint: Not an API Gateway endpoint in current codebase. Lambda event payload interface.

Authentication: Not applicable; invoked by AWS service.

Request parameters:

| Location | Name | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Event | `auctionId` | string | Yes | Auction to process. |

Example event:

```json
{ "auctionId": "auc_123" }
```

Main processing:

- Reads the auction from `Auctions`.
- If `winnerProcessedAt` exists, returns idempotent success.
- Determines winner from `highestBidderId`; uses `NO_BIDS` if empty.
- Uses `currentPrice` as final price.
- If there is a winner:
  - Writes `Notifications` item with `notificationId: AUCTION_WON#{auctionId}` and condition that it does not already exist.
  - Appends a won auction item to `Users.wonAuctions`.
- Updates the auction to `status: ENDED`, `winnerId`, `winnerEmail`, `finalPrice`, `endedAt`, and `winnerProcessedAt`.

Response format:

```json
{
  "statusCode": 200,
  "auctionId": "auc_123",
  "winnerId": "buyer_uid",
  "winnerEmail": "buyer@example.com",
  "finalPrice": 175,
  "notificationCreated": true,
  "wonAuctionAdded": true,
  "message": "Winner processed, notification created, and won auction added to user."
}
```

Errors / edge cases:

- Raises `ValueError` missing auction ID or missing auction.
- Notification condition prevents duplicate notification IDs.
- Does not check for duplicate entries in `Users.wonAuctions` if re-run after notification created but before `winnerProcessedAt` update.

AWS/external services used: DynamoDB `Auctions`, `Users`, `Notifications`; CloudWatch via logging.

### Frontend-only Firebase Realtime Database interfaces

These are not API Gateway/Lambda endpoints, but they are important interfaces used by the system.

#### Live chat

- Caller: `LiveChat.jsx`.
- Path: `auctionChats/{auctionId}/messages`.
- Read: `onValue(query(messagesRef, orderByChild('createdAt'), limitToLast(100)))`.
- Write: `push(messagesRef, { auctionId, userId, userName, userAvatarUrl, text, createdAt: serverTimestamp() })`.
- Validation: frontend requires logged-in user, non-empty message, auction ID, and max 300 characters.

#### Viewer presence

- Caller: `useAuctionDetails.js`, `useLiveViewerCount.js`.
- Path: `auctions/{auctionId}/viewers/{userId}`.
- Write: sets the current user's viewer node to `true` after registering `onDisconnect(...).remove()`.
- Read: counts `snapshot.size` at `auctions/{auctionId}/viewers`.

#### Blocked-user push status

- Caller: `useAdmin.js`, `AuthContext.jsx`.
- Admin write path: `userStatuses/{userId}` with `{ status, updatedAt }`.
- Auth listener path: `userStatuses/{uid}/status`.
- Behavior: when value becomes `BLOCKED`, `AuthContext` stores a session message, calls Firebase logout, and clears local user.

## 8. Data Model / Storage Documentation

### DynamoDB: Users

Purpose: User profile, role/status, favorites, bid participation, and won auctions.

Verified table schema: partition key `userId` (String), no sort key, on-demand capacity mode. The schema was manually verified from the AWS Console.

Main fields:

| Field | Source/usage |
| --- | --- |
| `userId` | Firebase UID, primary key. |
| `email` | Signup/profile. |
| `displayName` | Signup/profile/UI. |
| `profilePic` | Created by `createUser.py`; separate from `photoURL`. |
| `photoURL` | Profile update/display. |
| `profileImageKey` | S3 key for profile image. |
| `bio` | Profile. |
| `createdAt`, `updatedAt` | Profile/admin updates. |
| `role` | Admin/user authorization in frontend; may be lower or upper case. |
| `status` | `ACTIVE`/`BLOCKED`; may be lower or upper case from create Lambda. |
| `favoriteAuctions` | DynamoDB string set of auction IDs. |
| `biddedAuctions` | DynamoDB string set of auction IDs bid on. |
| `wonAuctions` | List appended by winner processing/profile update. |

Example item:

```json
{
  "userId": "firebase_uid_123",
  "email": "buyer@example.com",
  "displayName": "Buyer One",
  "role": "USER",
  "status": "ACTIVE",
  "bio": "Collector",
  "profileImageKey": "profile-images/firebase_uid_123/image.webp",
  "favoriteAuctions": ["auc_123"],
  "biddedAuctions": ["auc_123"],
  "wonAuctions": [
    {
      "auctionId": "auc_123",
      "title": "Vintage Camera",
      "winningBid": 175,
      "wonAt": "2026-06-12T12:00:00Z"
    }
  ]
}
```

### DynamoDB: Auctions

Purpose: Auction listing, timing, status, pricing, image, seller, Agora, and winner data.

Verified table schema: partition key `auctionId` (String), no sort key, on-demand capacity mode. The schema was manually verified from the AWS Console.

Main fields:

| Field | Source/usage |
| --- | --- |
| `auctionId` | `auc_` + UUID. |
| `sellerId`, `sellerName`, `sellerEmail` | Auction owner. |
| `title`, `description`, `category` | Listing fields. |
| `status` | `UPCOMING`, `LIVE`, `ENDED`; frontend and Lambdas use uppercase. |
| `startsAt`, `endsAt` | ISO timestamps for lifecycle and bidding validation. |
| `expireAt` | End time plus 24 hours, likely DynamoDB TTL if enabled. |
| `startingPrice`, `currentPrice` | Decimal prices. |
| `bidCount` | Incremented on accepted bid. |
| `highestBidderId`, `highestBidderEmail` | Updated on accepted bid. |
| `imageUrl`, `imageKey`, `imageKeys` | Product image references. |
| `agoraChannelName`, `videoProfile` | Live video configuration. |
| `winnerId`, `winnerEmail`, `finalPrice`, `endedAt`, `winnerProcessedAt` | Winner processing outputs. |
| `createdAt`, `updatedAt` | Audit timestamps. |

Example item:

```json
{
  "auctionId": "auc_123",
  "sellerId": "seller_uid",
  "title": "Vintage Camera",
  "category": "Photography",
  "status": "LIVE",
  "startsAt": "2026-06-12T12:00:00Z",
  "endsAt": "2026-06-13T12:00:00Z",
  "startingPrice": 100,
  "currentPrice": 175,
  "bidCount": 4,
  "highestBidderId": "buyer_uid",
  "imageKey": "auction-images/auc_123/image.webp",
  "imageKeys": ["auction-images/auc_123/image.webp"],
  "agoraChannelName": "auction-1780000000000",
  "videoProfile": "720p_1"
}
```

### DynamoDB: Bids

Purpose: Individual bid history and dashboard bid aggregation.

Verified table schema: partition key `auctionId` (String), sort key `placedAt` (String), on-demand capacity mode. This supports querying bid records by auction ordered by `placedAt`.

Verified secondary index: `bidderId-placedAt-index` exists on the `Bids` table with status `Active`, partition key `bidderId` (String), sort key `placedAt` (String), and on-demand capacity mode. `getUserBids.py` uses this GSI to retrieve a user's bids.

Main fields:

| Field | Source/usage |
| --- | --- |
| `auctionId` | Auction ID. |
| `placedAt`, `createdAt` | Timestamp strings. |
| `bidId` | `bid_` + UUID. |
| `bidderId`, `bidderEmail`, `displayName` | Bidder identity/display data. |
| `amount` | Bid amount as Decimal. |
| `status` | `ACCEPTED`. |

Example item:

```json
{
  "auctionId": "auc_123",
  "placedAt": "2026-06-12T12:15:00Z",
  "createdAt": "2026-06-12T12:15:00Z",
  "bidId": "bid_abc",
  "bidderId": "buyer_uid",
  "bidderEmail": "buyer@example.com",
  "displayName": "Buyer One",
  "amount": 175,
  "status": "ACCEPTED"
}
```

### DynamoDB: Notifications

Purpose: User notifications, currently winner notifications.

Verified table schema: partition key `userId` (String), sort key `notificationId` (String), on-demand capacity mode. The schema was manually verified from the AWS Console.

Main fields:

| Field | Source/usage |
| --- | --- |
| `userId` | Recipient. |
| `notificationId` | `AUCTION_WON#{auctionId}`. |
| `type` | `AUCTION_WON`. |
| `title`, `message` | Display text. |
| `auctionId`, `auctionTitle`, `amount` | Related auction data. |
| `read` | Boolean; no mark-read API found. |
| `createdAt` | Timestamp. |

Example item:

```json
{
  "userId": "buyer_uid",
  "notificationId": "AUCTION_WON#auc_123",
  "type": "AUCTION_WON",
  "title": "You won an auction!",
  "message": "You won 'Vintage Camera' with a final bid of $175.",
  "auctionId": "auc_123",
  "auctionTitle": "Vintage Camera",
  "amount": 175,
  "read": false,
  "createdAt": "2026-06-13T12:00:00Z"
}
```

### S3

- Bucket: `bidit-auction-images-2026`.
- Upload URL expiration: 300 seconds.
- View URL expiration: 3600 seconds.
- Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`.
- Stored references: DynamoDB stores object keys, not image bytes.

### Firebase Realtime Database

Verified paths:

| Path | Purpose | Writer | Reader |
| --- | --- | --- | --- |
| `auctionChats/{auctionId}/messages` | Live auction chat messages. | `LiveChat.jsx` | `LiveChat.jsx` |
| `auctions/{auctionId}/viewers/{userId}` | Auction page presence. | `useAuctionDetails.js` | `useLiveViewerCount.js` |
| `userStatuses/{userId}` | Admin block/unblock status object. | `useAdmin.js` | `AuthContext.jsx` reads `userStatuses/{uid}/status` |

## 9. Authentication and Authorization

- Firebase Auth is initialized in `frontend/src/firebase/firebaseConfig.js` with project `bidit-963a8` and supports:
  - `createUserWithEmailAndPassword`
  - `updateProfile` for display name during signup
  - `signInWithEmailAndPassword`
  - `GoogleAuthProvider` with account selection prompt
  - `signInWithPopup`
  - `signOut`
  - `onAuthStateChanged`
- After signup/login, the frontend syncs the Firebase user to DynamoDB using `POST /users`.
- `AuthContext` subscribes to Firebase auth state, gets the Firebase ID token, loads DynamoDB profile, normalizes role/status to uppercase, and stores `user.token` locally in React state.
- Some API helpers attach `Authorization: Bearer <Firebase ID token>`:
  - `usersApi.js` profile APIs
  - `auctionsService.js`
  - `adminApi.js`
- API Gateway Method Request settings were manually verified as `Authorization: NONE`, `API key required: False`, and `Request validator: None`; API Gateway does not enforce Firebase JWT validation or admin authorization. Any production JWT/admin enforcement should be added through an API Gateway authorizer or stronger backend Firebase token validation.
- Protected user routes use `ProtectedRoute` and require any authenticated `user` in context.
- Admin routes are protected in `App.jsx` by checking `user.role?.toUpperCase() === USER_ROLES.ADMIN`.
- Blocked user behavior:
  - Login flow calls `GET /users/{uid}` and logs out immediately if DynamoDB status is `BLOCKED`.
  - `AuthContext` also checks profile status after auth state changes.
  - Admin block/unblock writes DynamoDB and Firebase RTDB `userStatuses/{userId}`.
  - Logged-in users listen to `userStatuses/{uid}/status`; if it becomes `BLOCKED`, they are logged out.
- Logout behavior uses Firebase `signOut` through `authService.logout`.

## 10. Auction Lifecycle

1. **Creation form:** `useGoLive.js` validates logged-in user, title, positive starting price, and selected start time.
2. **Status decision:** Frontend marks the auction `UPCOMING` if start time is in the future, otherwise `LIVE`.
3. **Auction write:** `POST /auctions` writes the initial auction to `Auctions` with empty image fields and starts the Step Functions timer.
4. **Image upload:** If product images were selected, frontend uploads each image through S3 presigned URLs and then calls `PATCH /auctions/{auctionId}` with `imageKey` and `imageKeys`.
5. **Browsing:** Auction lists load via `GET /auctions`; `getAllAuctions.py` recalculates response status from dates.
6. **Auction details:** `useAuctionDetails.js` loads auction details and bids, joins Firebase viewer presence, and shows mock chat data plus Firebase chat component in the UI.
7. **Live video:** Seller or viewer connects to Agora. Host identity is `auction.sellerId === currentUserId`. Host publishes camera/mic; viewers subscribe to remote host user.
8. **Bidding:** `placeBid.py` validates auction timing, status `LIVE`, not own auction, not admin, and bid amount. Accepted bids update auction price/highest bidder, write `Bids`, and add the auction to `Users.biddedAuctions`.
9. **Last-minute extension:** If a bid arrives with 0-30 seconds remaining, `placeBid.py` extends `endsAt` to now + 60 seconds. No Step Functions execution rescheduling was found.
10. **Recent bids:** After placing a bid, frontend re-fetches `GET /auctions/{auctionId}` and `GET /auctions/{auctionId}/bids`. No realtime bid listener was found.
11. **Closing:** Step Functions implementation is partial in the repo. The intended flow is `CheckAuctionStatus` then `ProcessAuctionWinner`.
12. **Winner processing:** `ProcessAuctionWinner.py` marks the auction `ENDED`, writes final winner fields, creates a notification, and appends a won auction to the winner's `Users.wonAuctions`.
13. **Profile won auctions:** Profile loads `Users.wonAuctions`. Dashboard's `wonAuctions` currently comes from mock dashboard data, not backend won auctions.

## 11. Admin Maintenance Guide

- Admin pages are frontend-protected by role in `App.jsx`; backend Lambda admin authorization is not implemented in code.
- `GET /admin/users` scans all users and returns normalized role/status fields.
- `AdminUsersComp` and `useAdmin` support searching/filtering in the frontend and actions to block/unblock or make admin.
- Blocking/unblocking:
  1. Calls `PATCH /admin/users/{userId}/status` to update DynamoDB.
  2. Writes Firebase RTDB `userStatuses/{userId}` for immediate enforcement.
  3. Auth listeners log out blocked users.
- Promoting admin calls `PATCH /admin/users/{userId}/role` with `ADMIN`.
- Admin auction management loads auctions with `GET /auctions` and deletes with `DELETE /admin/auctions/{auctionId}`.
- Delete only removes the auction item. Related bids, favorites, images, notifications, and workflow executions are not cleaned up by `deleteAuction.py`.

## 12. Environment Variables and Configuration

| Variable/config | Where used | Purpose | Example placeholder |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | All frontend API modules | Base URL for API Gateway. Set this in the frontend environment; the latest Swagger uses `/dev`. | `https://<api-id>.execute-api.us-east-1.amazonaws.com/dev` |
| `VITE_AGORA_APP_ID` | `useAuctionVideo.js` | Agora App ID used by frontend `client.join`. | `your-agora-app-id` |
| Firebase `apiKey` | `firebaseConfig.js` | Firebase project web config. | Move to `VITE_FIREBASE_API_KEY` before production if desired. |
| Firebase `authDomain` | `firebaseConfig.js` | Firebase Auth domain. | `your-project.firebaseapp.com` |
| Firebase `databaseURL` | `firebaseConfig.js` | Realtime Database URL. | `https://your-project-default-rtdb.firebaseio.com` |
| Firebase `projectId` | `firebaseConfig.js` | Firebase project ID. | `your-project-id` |
| Firebase `storageBucket` | `firebaseConfig.js` | Firebase Storage bucket config; application image uploads use S3 instead. | `your-project.appspot.com` |
| Firebase `messagingSenderId` | `firebaseConfig.js` | Firebase project web config. | `000000000000` |
| Firebase `appId` | `firebaseConfig.js` | Firebase app ID. | `1:000000000000:web:...` |
| `USERS_TABLE_NAME` | `createUser.py` | DynamoDB table for user creation. | `Users` |
| `AGORA_APP_ID` | `generateAgoraToken.py` | Agora backend token generation App ID. | `your-agora-app-id` |
| `AGORA_APP_CERT` | `generateAgoraToken.py` | Agora App Certificate; secret. | `your-agora-app-certificate` |
| `BUCKET_NAME` constant | `generateS3ImageUrls.py` | S3 image bucket; hard-coded, not env var. | `bidit-auction-images-2026` |
| `STATE_MACHINE_ARN` constant | `createAuction.py` | Step Functions state machine ARN; hard-coded, not env var. | `arn:aws:states:region:account:stateMachine:WinnerMachine` |
| DynamoDB table constants | Most Lambda files | Hard-coded table names. | `Users`, `Auctions`, `Bids`, `Notifications` |
| `BIDDER_INDEX_NAME` constant | `getUserBids.py` | Bids GSI name. | `bidderId-placedAt-index` |

Do not expose real secrets in documentation, commits, or frontend code. Agora App Certificate must remain backend-only.

## 13. Deployment and Maintenance Notes

### Run frontend locally

```bash
cd frontend
npm install
npm run dev
```

### Build frontend

```bash
cd frontend
npm run build
```

### Lint frontend

```bash
cd frontend
npm run lint
```

### Update API base URL

Set `VITE_API_BASE_URL` in `frontend/.env` or the deployment environment. All API helpers use this value. Use the placeholder format `https://<api-id>.execute-api.us-east-1.amazonaws.com/dev` and substitute the actual API ID only in environment configuration.

### Add a new API endpoint

1. Add or update a Lambda in `lambdas/`.
2. Configure API Gateway route and method to invoke it. The verified deployed API is `BiditAPI` under `/dev`, but deployment templates are not stored in this repository, so update the deployment system outside this repository if applicable.
3. Ensure CORS headers include the method and `Authorization` if needed.
4. Add a frontend helper in `frontend/src/api/`.
5. Call the helper from the appropriate hook/component.
6. Document request/response shape here.
7. If authentication matters, enforce it through API Gateway authorizer or Lambda verification; do not rely only on frontend checks.

### Add a new Lambda

- Follow existing `lambda_handler(event, context)` pattern.
- Return JSON with CORS headers.
- Use environment variables for account-specific values rather than hard-coded ARNs/bucket/table names where possible.
- Add IAM permissions for required DynamoDB/S3/Step Functions operations.
- Add CloudWatch logging for validation and external-service errors.

### Add a new DynamoDB field safely

- Prefer optional fields and frontend fallbacks because old items may not have the field.
- Update all mapping functions that normalize backend data.
- If field names collide with DynamoDB reserved words, use expression attribute names.
- For numbers, use `Decimal` in Python Lambda before writing to DynamoDB.
- The manually verified tables use on-demand capacity. For production data protection, consider enabling DynamoDB point-in-time recovery and document the setting in IaC.
- Preserve the `Bids` table key schema (`auctionId`, `placedAt`) and the verified active `bidderId-placedAt-index` GSI when changing bid storage.

### Maintain the Step Functions auction-closing workflow

- The verified ASL is stored at `backend/step-functions/WinnerMachine.asl.json`.
- `createAuction.py` starts the `WinnerMachine` execution after the auction item is created.
- The ASL starts with `CheckDynamoDB`, branches on `$.isAuctionOver`, waits until `$.endTime` when needed, and then re-checks DynamoDB before invoking `ProcessAuctionWinner`.
- Parameterize the account-specific Lambda ARNs in reusable deployment scripts or IaC instead of copying the checked-in ARNs directly into another AWS account.
- When changing anti-sniping, `CheckAuctionStatus`, or winner processing, run an end-to-end workflow test that covers a bid extension before auction close.

### Debug Lambda/API issues

- Check browser network tab for endpoint, status, and response body.
- Check API Gateway access/execution logs if enabled.
- Check CloudWatch logs for the Lambda's `print`/`logger` output.
- Confirm API Gateway path parameters match Lambda expectations, especially `auctionId` and `userId`.
- Confirm CORS `Access-Control-Allow-Methods` includes the method being called.

### Troubleshoot image issues

- Verify `POST /upload-url` succeeds and returns `uploadUrl` plus `imageKey`.
- Verify the browser `PUT` to S3 uses the exact `Content-Type` used to sign the URL.
- Verify MIME type is one of `image/jpeg`, `image/png`, `image/webp`.
- Verify `PATCH /auctions/{auctionId}` or `PATCH /users/{userId}` saved the returned key.
- Verify `POST /upload-url` with `action: "get"` returns a `viewUrl` and the object key exists.

### Troubleshoot live video/chat/viewer count

- Agora video:
  - Verify frontend `VITE_AGORA_APP_ID` matches backend `AGORA_APP_ID`.
  - Verify `AGORA_APP_CERT` is set in Lambda.
  - Verify `auction.agoraChannelName` exists.
  - Verify host uses publisher token and viewers use subscriber token.
- Chat:
  - Verify Firebase Realtime Database rules allow authenticated reads/writes for `auctionChats/{auctionId}/messages`.
  - Verify message length is <= 300 characters.
- Viewer count:
  - Verify user is logged in; viewer presence writes require `currentUserId` in `useAuctionDetails.js`.
  - Check RTDB path `auctions/{auctionId}/viewers`.

## 14. Known Limitations / Notes

- API Gateway Method Request settings were manually verified as `Authorization: NONE`, `API key required: False`, and `Request validator: None`; add an API Gateway authorizer or stronger backend Firebase token validation before production.
- The Step Functions ASL has been manually verified and stored in `backend/step-functions/WinnerMachine.asl.json`, but the Lambda ARNs in that file are account-specific and should be parameterized or generated in reusable deployment scripts/IaC.
- `createUser.py` writes `role: "user"` and `status: "active"`; other admin code expects uppercase values and frontend normalizes them.
- `updateUserStatus.py` does not use `ConditionExpression`, so it does not explicitly fail for a missing user.
- `deleteAuction.py` does not delete related bids, favorites, notifications, images, or workflow executions.
- `getLiveAuctions.py` is not called by the frontend API helpers, is not listed as a verified Swagger business route, and does not paginate scans.
- `getAllAuctions.py` recalculates status in the response but does not persist status updates.
- `placeBid.py` anti-sniping extends `Auctions.endsAt`; the verified Step Functions workflow re-checks DynamoDB and waits on the latest `endTime`, which supports extensions, but this behavior should be regression-tested after workflow or bidding changes.
- `getUserBids.py` has a likely `created_at` variable bug in equal-amount comparison.
- Notifications are displayed but no mark-as-read API or frontend action was found.
- Recent bids refresh by backend re-fetch after bid placement; no realtime bid listener was found.
- Profile page loads backend `wonAuctions`, but dashboard `wonAuctions` uses mock data from `frontend/src/data/mockDashboard.js`.
- `auctionsApi.updateAuctionImage()` calls `PATCH /auctions/{auctionId}/image`, but no matching Lambda file or verified Swagger route was found.
- Firebase config values are committed in source. These are web config values, not admin credentials, but environment-based configuration is recommended for maintainability.


## 15. Swagger Route Reconciliation Notes

This section records corrections made from the verified `BiditAPI` Swagger export supplied after the first documentation draft.

### Verified public route corrections

| Area | Correct verified route/method | Documentation action |
| --- | --- | --- |
| Bid placement | `POST /auctions/{auctionId}/bid` | Kept/documented as singular `/bid`; `POST /auctions/{auctionId}/bids` should not be used for bid placement. |
| Bid retrieval | `GET /auctions/{auctionId}/bids` | Kept as recent-bids/bid-history retrieval only. |
| Uploads | `POST /upload-url` | Kept as the only verified S3 presigned URL API. No `/uploads/presigned` route is documented. |
| Admin auction listing | No `GET /admin/auctions` business route in Swagger | Admin auction management uses verified `GET /auctions`; `/admin/auctions` is CORS `OPTIONS` only except `DELETE /admin/auctions/{auctionId}`. |
| Admin auction delete | `DELETE /admin/auctions/{auctionId}` | Documented as the verified admin delete endpoint. |
| Admin users | `GET /admin/users`, `PATCH /admin/users/{userId}/status`, `PATCH /admin/users/{userId}/role` | Documented as verified admin endpoints. |
| Agora token | `GET /agora/token` | Documented as the verified Agora token endpoint integrated with `bidit-agora-token-generator`. |
| Favorites remove | `DELETE /users/{userId}/favorites/{auctionId}` | The previous mismatch was fixed in API Gateway; the current Swagger route, frontend call, and Lambda path-parameter expectation are aligned. |
| User profile GET | `GET /users/{userId}` mapped to `updateUserProfile` | Documented carefully: the same Lambda handles both GET and PATCH by inspecting the public HTTP method. |

### Endpoints still marked unverified, frontend-only, planned, or mismatched

- `getLiveAuctions.py`: Lambda source exists, but no verified Swagger business route and no current frontend API helper call were found.
- `PATCH /auctions/{auctionId}/image`: frontend helper `updateAuctionImage()` exists in `auctionsApi.js`, but no matching Swagger route or Lambda source file was found.
- `/admin`, `/admin/auctions`, `/admin/users/{userId}`, `/users/{userId}/favorites/{auctionId}`, and `/agora` resources with `OPTIONS` only: CORS helper resources, not business APIs.

### Remaining production recommendations

- Add an API Gateway authorizer or backend Firebase token validation before production; Method Request settings were manually verified as `Authorization: NONE`.
- Keep the verified active `Bids` table GSI `bidderId-placedAt-index` documented and preserve it in AWS/IaC deployment changes.
- Parameterize AWS account-specific Lambda ARNs in `backend/step-functions/WinnerMachine.asl.json` when creating reusable deployment scripts or IaC.
- Consider enabling DynamoDB point-in-time recovery for production data protection.
- Review CloudWatch log retention, alarms, and monitoring settings before production deployment.
