#!/bin/bash
# scripts/smoke-tests.sh

# The script expects the API URL to be passed as an argument
if [ -z "$1" ]; then
  echo "Error: Please provide your API URL."
  echo "Usage: ./scripts/smoke-tests.sh https://<API_ID>.execute-api.us-east-1.amazonaws.com/dev"
  exit 1
fi

API_URL=$1

echo "🔍 Running Smoke Tests against $API_URL..."

echo "1. Testing GET /auctions (Should return 200 OK and a JSON list)"
curl -s -o /dev/null -w "%{http_code}\n" -X GET "$API_URL/auctions"

echo "2. Testing GET /admin/users (Should return 200 OK)"
curl -s -o /dev/null -w "%{http_code}\n" -X GET "$API_URL/admin/users"

echo "✅ Smoke tests complete. If you saw '200' for the above requests, the backend is healthy!"