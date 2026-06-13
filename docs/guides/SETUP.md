# BidIt - Local Development Setup Guide

This guide walks you through setting up BidIt. Follow the section corresponding to your operating system.

---

## Phase 1: Prerequisites

Before beginning, install the following tools:

1. **Node.js (>= 18.0.0) & npm**

   * Download from: https://nodejs.org/

2. **Python (>= 3.11)**

   * Download from: https://python.org/
   * Windows users: Ensure **Add Python to PATH** is checked during installation.

3. **AWS CLI**

   * Installation Guide: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
   * After installation, configure credentials:

   ```bash
   aws configure
   ```

4. **Git**

   * Download from: https://git-scm.com/

---

## Phase 2: Clone Repository & Frontend Setup

Clone the repository and install frontend dependencies:

```bash
git clone https://github.com/Shanig03/bidit.git
cd bidit/frontend
npm install
```

Create a file named:

```text
frontend/.env
```

Add the following contents:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_AGORA_APP_ID=your-agora-app-id-here
```

---

## Phase 3: Backend Setup

Navigate to the `lambdas` directory and create a Python virtual environment.

### Linux / macOS

```bash
cd ../lambdas

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

### Windows

```powershell
cd ..\lambdas

python -m venv venv
.\venv\Scripts\activate

pip install -r requirements.txt
```

---

## Phase 4: AWS Infrastructure Setup

Choose the setup method appropriate for your operating system.

### Linux / macOS

Run the shell scripts located in `scripts/Linux/`:

```bash
cd ..

chmod +x scripts/Linux/*.sh

./scripts/Linux/setup-local-aws.sh
```

### Windows

Open PowerShell from the project root and run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

.\scripts\win\setup-local-aws.ps1
```

---

## Phase 5: Environment Configuration

After the setup script completes, a unique S3 bucket name will be generated.

Create:

```text
lambdas/.env.lambda
```

Populate it with:

```env
USERS_TABLE_NAME=Users
AUCTIONS_TABLE_NAME=Auctions
BIDS_TABLE_NAME=Bids
NOTIFICATIONS_TABLE_NAME=Notifications

BUCKET_NAME=bidit-auction-images-dev-YOUR_ACCOUNT_ID

AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERT=your-agora-app-certificate

STATE_MACHINE_ARN=arn:aws:states:us-east-1:YOUR_ACCOUNT_ID:stateMachine:WinnerMachine
```

Replace:

* `YOUR_ACCOUNT_ID`
* `your-agora-app-id`
* `your-agora-app-certificate`

with your actual values.

---

## Phase 6: Run Application

### Start Frontend

Open a terminal in the frontend directory:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

---

## Verification

Verify that the AWS setup script successfully created the required DynamoDB tables:

```bash
aws dynamodb list-tables --region us-east-1
```

Expected tables:

```text
Users
Auctions
Bids
Notifications
```

Verify that the generated S3 bucket exists:

```bash
aws s3 ls
```

---

## Troubleshooting

### AWS CLI Not Found

Verify installation:

```bash
aws --version
```

If AWS CLI is installed but not found, ensure the installation directory is present in your system PATH.

### Python Dependencies Fail

Upgrade pip and reinstall:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend Dependencies Fail

Clear npm cache and reinstall:

```bash
npm cache clean --force
npm install
```

---

## Additional Documentation

For production deployment instructions, see:

```text
docs/guides/DEPLOYMENT.md
```

For architecture and API documentation, see:

```text
docs/ARCHITECTURE.md
```
