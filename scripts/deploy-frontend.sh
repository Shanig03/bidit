#!/bin/bash
# scripts/build-frontend.sh

echo "Building React Frontend for AWS Amplify..."

cd frontend

# Install dependencies
echo "Installing npm dependencies..."
npm install

# Build the project
echo "Compiling React code..."
npm run build

cd ..

echo "======================================================="
echo "✅ Frontend built successfully! The 'dist' folder is ready."
echo "======================================================="
echo "To host this on AWS Amplify, follow these steps in your AWS Console:"
echo "1. Go to AWS Amplify in the AWS Console."
echo "2. Click 'Deploy without Git provider' (or 'Host your web app' -> 'Deploy without Git')."
echo "3. Name the app 'BidIt-Frontend'."
echo "4. Drag and drop the newly created 'frontend/dist' folder into the deployment box."
echo "5. Click 'Save and Deploy'."
echo "======================================================="