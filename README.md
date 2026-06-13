# BidIt - Live Auction Marketplace

BidIt is a live auction marketplace web application that allows sellers to create product auctions and buyers to participate in them in real time. The platform combines auction browsing, live video streaming, chat, bidding, favorites, image uploads, user profiles, notifications, and admin management in one application.

The project is built with a React/Vite frontend and a serverless backend architecture. The frontend communicates with AWS API endpoints for users, auctions, bids, favorites, image uploads, and admin actions. Firebase is used for authentication and selected real-time features, Agora is used for live video streaming, and AWS services are used for backend logic, data storage, image storage, and auction workflow automation.

## Main Features

- Email/password and Google authentication
- Protected routes and role-based navigation for guests, users, and admins
- Home page with trending live auctions
- Live auctions page with search and category filtering
- Auction details page with product images, lightbox gallery, countdown timer, bids, recent bids, chat, and viewer count
- Optional live video broadcast for sellers and live stream viewing for users
- Favorites system and user dashboard with saved auctions and bid history
- Auction creation flow with multi-image upload using S3 presigned URLs
- User profile editing, profile image upload, auctions won, and notifications display
- Admin area for managing users, blocking/unblocking users, promoting admins, searching auctions, and deleting auctions
- Step Functions workflow for closing auctions and processing winners without continuously scanning all auctions

## Architecture Overview

BidIt uses a serverless architecture. The React frontend sends HTTPS requests to Amazon API Gateway, which invokes AWS Lambda functions. Lambda functions handle the main backend logic and read/write application data from Amazon DynamoDB. Product and profile images are stored in Amazon S3 as private objects and are accessed through presigned URLs.

AWS Step Functions is used for the auction closing workflow. When an auction is created, a workflow can wait until the auction end time, check the auction status, and process the winner if the auction has ended.

External services are also part of the system:
- Firebase Auth handles email/password and Google login.
- Firebase Realtime Database supports live chat, auction page viewer presence, and blocked-user status updates.
- Agora SDK enables live video broadcasting and viewing.

## Tech Stack

- **Frontend:** React, Vite, React Router
- **Authentication:** Firebase Auth
- **Real-time features:** Firebase Realtime Database
- **Live video:** Agora RTC SDK
- **Backend API:** Amazon API Gateway + AWS Lambda
- **Database:** Amazon DynamoDB
- **Image storage:** Amazon S3 with presigned URLs
- **Auction workflow automation:** AWS Step Functions

## Project Structure

```text
frontend/
  constants/          Shared constants and configuration values
  src/api/            API helper functions for backend requests
  src/components/     Reusable UI and feature components
  src/context/        Authentication context and session handling
  src/hooks/          Feature hooks for auth, auctions, bidding, profile, admin, and uploads
  src/pages/          Route-level page components
  src/styles/         Global styles, variables, and shared CSS
```

## Main App Routes

- `/` - Home page
- `/login` - Login
- `/signup` - Sign up
- `/auctions` - Live and upcoming auctions list
- `/auction/:id` - Auction details, bidding, chat, images, and optional live stream
- `/dashboard` - User favorites and bid history
- `/go-live` - Create a new auction
- `/profile` - User profile, notifications, and won auctions
- `/admin/users` - Admin user management
- `/admin/auctions` - Admin auction management

## Getting Started

### Prerequisites

Before running the project locally, make sure you have:

- Node.js and npm installed
- Access to a backend/API that matches the frontend routes
- Firebase project configuration for Auth and Realtime Database
- Agora project configuration for live video streaming
- AWS resources configured for API Gateway, Lambda, DynamoDB, S3, and Step Functions

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create a `frontend/.env` file and define the API base URL:

```env
VITE_API_BASE_URL=https://your-api-url.example.com
```

Firebase and Agora configuration values are currently defined in the frontend source files for this project. When deploying to a new environment, update them to match the correct Firebase and Agora projects.

### Run Locally

```bash
cd frontend
npm run dev
```

Then open the local Vite URL shown in the terminal.

### Build for Production

```bash
cd frontend
npm run build
```

### Preview Production Build

```bash
cd frontend
npm run preview
```
