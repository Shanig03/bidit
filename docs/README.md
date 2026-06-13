# BidIt Developer Documentation

Welcome to the BidIt Live Auction Marketplace developer guide. This documentation covers architecture, setup, deployment, and maintenance.

## Quick Navigation

### 📚 **Main Documentation**
- **[BidIt Architecture & API Reference](./ARCHITECTURE.md)** — Complete technical reference (sections 1-15)
  - Project overview and high-level architecture
  - Technology stack and repository structure
  - All 21+ Lambda functions documented
  - DynamoDB schemas and data models
  - Authentication and authorization
  - Known limitations and production recommendations

### 🚀 **Getting Started**

#### **For New Developers (Local Setup)**
- **[Local Development Setup Guide](./guides/SETUP.md)** — Get BidIt running locally in 30 minutes
  - Prerequisites and environment setup
  - Frontend (Vite/React) installation
  - Backend (Lambda/Python) configuration
  - Firebase and AWS services setup
  - Agora integration
  - Verification and troubleshooting

#### **For DevOps/Release Engineers (Production)**
- **[Production Deployment Guide](./guides/DEPLOYMENT.md)** — Deploy to AWS production
  - Pre-deployment checklist
  - Infrastructure as Code (CloudFormation templates)
  - Automated Lambda deployment scripts
  - API Gateway configuration
  - Database migration and backups
  - Monitoring, logging, and alarms
  - Security hardening
  - Rollback procedures
  - Zero AWS Console clicks required!

---

## Development Workflow

### **Local Development**
```bash
# Clone and setup
git clone https://github.com/Shanig03/bidit.git
cd bidit

# Follow SETUP.md for detailed instructions
```

### **Production Deployment**
```bash
# Automated infrastructure deployment
aws cloudformation create-stack --stack-name bidit-prod --template-body file://bidit-stack.yaml

# Deploy all Lambda functions
./deploy-lambdas.sh

# Deploy frontend
./deploy-frontend.sh
```

---

## Key Technologies

| Component | Technology |
|-----------|------------|
| **Frontend** | React 19 + Vite 8 |
| **Backend** | AWS Lambda (Python 3.11) |
| **Database** | DynamoDB (4 tables) |
| **Storage** | S3 + CloudFront |
| **Real-time** | Firebase Realtime Database |
| **Video** | Agora RTC |
| **Authentication** | Firebase Auth |
| **Workflow** | AWS Step Functions |

---

## Architecture Overview

```
React/Vite Frontend (localhost:5173)
    ↓
API Gateway REST/HTTP endpoint (/dev)
    ↓
AWS Lambda Functions (21 total)
    ↓
DynamoDB Tables: Users, Auctions, Bids, Notifications
S3 Bucket: bidit-auction-images-2026
Step Functions: WinnerMachine (auction closing workflow)
    ↓
Firebase: Auth, Realtime Database (chat, presence)
Agora: Live video streaming
```

---

## Frequently Asked Questions

### **Q: How do I start developing locally?**
A: See [SETUP.md](./guides/SETUP.md) — complete step-by-step guide with no AWS account required initially.

### **Q: How do I deploy to production?**
A: See [DEPLOYMENT.md](./guides/DEPLOYMENT.md) — automated scripts with zero AWS Console clicks.

### **Q: What are the Lambda functions?**
A: See [ARCHITECTURE.md](./ARCHITECTURE.md), Section 7 — all 21 Lambda functions documented with request/response examples.

### **Q: What's the auction lifecycle?**
A: See [ARCHITECTURE.md](./ARCHITECTURE.md), Section 10 — complete workflow from creation to winner processing.

### **Q: How does the Step Functions workflow work?**
A: See [ARCHITECTURE.md](./ARCHITECTURE.md), Section 2 — detailed explanation of the WinnerMachine state machine.

---

## Common Tasks

### **Add a New Lambda Function**
1. Create `lambdas/newFunction.py`
2. Add to `deploy-lambdas.sh`
3. Configure API Gateway route
4. Document in [ARCHITECTURE.md](./ARCHITECTURE.md)
5. See DEPLOYMENT.md for detailed steps

### **Add a New DynamoDB Field**
1. Update Lambda code to handle the field
2. Create migration script (see DEPLOYMENT.md)
3. Update data model in [ARCHITECTURE.md](./ARCHITECTURE.md), Section 8
4. Test with `sam local start-api`

### **Debug Lambda Issues**
1. Check CloudWatch logs: `aws logs tail /aws/lambda/bidit --follow`
2. See [SETUP.md](./guides/SETUP.md), Part 8 for troubleshooting
3. Test locally with LocalStack or AWS SAM

---

## Documentation Structure

```
docs/
├── README.md                    ← You are here
├── ARCHITECTURE.md              ← Full technical reference (2,600+ lines)
└── guides/
    ├── SETUP.md                 ← Local development (400+ lines)
    └── DEPLOYMENT.md            ← Production deployment (600+ lines)
```

---

## Useful Links

- [GitHub Repository](https://github.com/Shanig03/bidit)
- [AWS Documentation](https://docs.aws.amazon.com)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Agora Documentation](https://docs.agora.io)
- [React Documentation](https://react.dev)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

---

## Support & Questions

For issues or questions:
1. Check the relevant guide (SETUP.md, DEPLOYMENT.md, or ARCHITECTURE.md)
2. Review the troubleshooting section in Part 8 of SETUP.md
3. Check CloudWatch logs for Lambda errors
4. Open an issue on GitHub

---

**Last Updated:** June 2026
