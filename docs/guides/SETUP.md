# Local AWS Infrastructure Setup Script

**File:** `scripts/setup-local-aws.sh`

This script automatically provisions the AWS resources required for local BidIt development. It creates DynamoDB tables, provisions a development S3 bucket with a globally unique name, enables bucket versioning, and configures CORS.

## Purpose

Running this script eliminates the need to manually create AWS resources during local development.

Resources created:

* `Users` DynamoDB table
* `Auctions` DynamoDB table
* `Bids` DynamoDB table
* `Notifications` DynamoDB table
* Development S3 bucket (`bidit-auction-images-dev-<ACCOUNT_ID>`)

---

## Prerequisites

Before running the script, ensure:

* AWS CLI is installed.
* AWS credentials are configured using:

```bash
aws configure
```

* The authenticated IAM user has permissions for:

  * DynamoDB
  * S3
  * STS

* The file `s3-cors-config.json` exists in the project root.

---

## Running the Script

From the project root:

```bash
chmod +x scripts/setup-local-aws.sh
./scripts/setup-local-aws.sh
```

---

## What the Script Does

### 1. Retrieves AWS Account ID

The script dynamically fetches the current AWS Account ID:

```bash
aws sts get-caller-identity
```

This ID is appended to the development bucket name to guarantee global uniqueness.

Example:

```text
bidit-auction-images-dev-123456789012
```

---

### 2. Creates DynamoDB Tables

The following tables are created using on-demand billing (`PAY_PER_REQUEST`):

| Table         | Primary Key             |
| ------------- | ----------------------- |
| Users         | userId                  |
| Auctions      | auctionId               |
| Bids          | auctionId + placedAt    |
| Notifications | userId + notificationId |

#### Bids Secondary Index

The `Bids` table includes the following Global Secondary Index (GSI):

| Index Name              |
| ----------------------- |
| bidderId-placedAt-index |

This enables efficient retrieval of bid history by bidder.

---

### 3. Creates Development S3 Bucket

A bucket is created using the generated name:

```text
bidit-auction-images-dev-<ACCOUNT_ID>
```

The script then:

* Enables versioning
* Applies the project's CORS configuration

---

## Script Output

Upon successful completion, the script displays the generated bucket name:

```text
BUCKET_NAME=bidit-auction-images-dev-123456789012
```

---

## Required Configuration

After the script completes, update your local Lambda environment file:

```env
BUCKET_NAME=bidit-auction-images-dev-123456789012
```

File:

```text
lambdas/.env.lambda
```

---

## Verification

Verify the infrastructure was created successfully:

```bash
aws dynamodb list-tables --region us-east-1
```

```bash
aws s3 ls
```

You should see all four DynamoDB tables and the development S3 bucket in the output.

---

## Notes

* The script is idempotent and can be run multiple times.
* Existing tables and buckets are detected automatically.
* S3 bucket names are globally unique due to the appended AWS Account ID.
* This script is intended for development environments only. Production resources are provisioned through CloudFormation.
