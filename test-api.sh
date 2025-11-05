#!/bin/bash

# Test script for Modulr Studio SSP APIs
BASE_URL="http://localhost:3000"

echo "🧪 Testing Modulr Studio SSP APIs"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Get all publishers
echo "1️⃣  Testing GET /api/publishers"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/publishers")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Success${NC} (HTTP $http_code)"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ Failed${NC} (HTTP $http_code)"
    echo "$body"
fi
echo ""

# Test 2: Create a publisher
echo "2️⃣  Testing POST /api/publishers"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/publishers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Publisher",
    "email": "test@example.com",
    "company": "Test Company Inc"
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$http_code" -eq 201 ]; then
    echo -e "${GREEN}✅ Success${NC} (HTTP $http_code)"
    PUBLISHER_ID=$(echo "$body" | jq -r '.id' 2>/dev/null)
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ Failed${NC} (HTTP $http_code)"
    echo "$body"
    PUBLISHER_ID=""
fi
echo ""

# Test 3: Get publisher by ID (if created)
if [ -n "$PUBLISHER_ID" ]; then
    echo "3️⃣  Testing GET /api/publishers/$PUBLISHER_ID"
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/publishers/$PUBLISHER_ID")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ Success${NC} (HTTP $http_code)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ Failed${NC} (HTTP $http_code)"
        echo "$body"
    fi
    echo ""
fi

# Test 4: Get all campaigns
echo "4️⃣  Testing GET /api/campaigns"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/campaigns")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Success${NC} (HTTP $http_code)"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ Failed${NC} (HTTP $http_code)"
    echo "$body"
fi
echo ""

# Test 5: Create a campaign (if we have a publisher)
if [ -n "$PUBLISHER_ID" ]; then
    echo "5️⃣  Testing POST /api/campaigns"
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/campaigns" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"Test Campaign\",
        \"budget\": 10000,
        \"publisherId\": $PUBLISHER_ID,
        \"status\": \"active\",
        \"targetingFilters\": {
          \"iabCategories\": [\"IAB1\", \"IAB2\"],
          \"sentiment\": [\"positive\"],
          \"minBrandSafetyScore\": 7
        }
      }")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    if [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ Success${NC} (HTTP $http_code)"
        CAMPAIGN_ID=$(echo "$body" | jq -r '.id' 2>/dev/null)
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ Failed${NC} (HTTP $http_code)"
        echo "$body"
        CAMPAIGN_ID=""
    fi
    echo ""
fi

# Test 6: Get campaign by ID with matching episodes
if [ -n "$CAMPAIGN_ID" ]; then
    echo "6️⃣  Testing GET /api/campaigns/$CAMPAIGN_ID (with episode matching)"
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/campaigns/$CAMPAIGN_ID")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ Success${NC} (HTTP $http_code)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ Failed${NC} (HTTP $http_code)"
        echo "$body"
    fi
    echo ""
fi

# Test 7: Get episodes with filters
echo "7️⃣  Testing GET /api/episodes (with filters)"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/episodes?limit=5")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Success${NC} (HTTP $http_code)"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ Failed${NC} (HTTP $http_code)"
    echo "$body"
fi
echo ""

echo "✨ Testing complete!"

