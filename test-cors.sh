#!/bin/bash

# CORS Testing Script
# Tests the backend API for proper CORS configuration

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="https://budgetbot-tg-mini-app.kayukov2010.workers.dev"
ORIGIN="http://localhost:3000"

echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       CORS & API Connectivity Test Suite          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
echo -e "\n${BLUE}Backend URL: $BACKEND_URL${NC}"
echo -e "${BLUE}Origin: $ORIGIN${NC}\n"

# Test function
test_endpoint() {
    local name=$1
    local path=$2
    local auth_header=$3

    echo -e "${YELLOW}▶ Testing: $name${NC}"
    echo -e "${BLUE}  $path${NC}\n"

    # Test OPTIONS (preflight)
    echo -e "${CYAN}  OPTIONS Preflight Request:${NC}"
    response=$(curl -s -i -X OPTIONS \
        -H "Origin: $ORIGIN" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: authorization,content-type" \
        "$BACKEND_URL$path" 2>&1)

    # Extract status code
    status_code=$(echo "$response" | grep -i "^HTTP" | tail -1 | awk '{print $2}')

    if [ -z "$status_code" ]; then
        echo -e "${RED}    ✗ Failed to connect${NC}"
        echo -e "${RED}    Error: $response${NC}\n"
        return 1
    fi

    echo -e "    Status: ${GREEN}$status_code${NC}"

    # Check for CORS headers
    cors_origin=$(echo "$response" | grep -i "access-control-allow-origin" | cut -d: -f2- | tr -d '\r')
    cors_methods=$(echo "$response" | grep -i "access-control-allow-methods" | cut -d: -f2- | tr -d '\r')
    cors_headers=$(echo "$response" | grep -i "access-control-allow-headers" | cut -d: -f2- | tr -d '\r')
    cors_credentials=$(echo "$response" | grep -i "access-control-allow-credentials" | cut -d: -f2- | tr -d '\r')

    if [ -n "$cors_origin" ]; then
        echo -e "    ${GREEN}✓ access-control-allow-origin:$cors_origin${NC}"
    else
        echo -e "    ${RED}✗ access-control-allow-origin: MISSING${NC}"
    fi

    if [ -n "$cors_methods" ]; then
        echo -e "    ${GREEN}✓ access-control-allow-methods:$cors_methods${NC}"
    else
        echo -e "    ${RED}✗ access-control-allow-methods: MISSING${NC}"
    fi

    if [ -n "$cors_headers" ]; then
        echo -e "    ${GREEN}✓ access-control-allow-headers:$cors_headers${NC}"
    else
        echo -e "    ${RED}✗ access-control-allow-headers: MISSING${NC}"
    fi

    if [ -n "$cors_credentials" ]; then
        echo -e "    ${GREEN}✓ access-control-allow-credentials:$cors_credentials${NC}"
    fi

    # Test actual GET request
    echo -e "\n${CYAN}  Actual GET Request:${NC}"

    if [ -n "$auth_header" ]; then
        response=$(curl -s -i -X GET \
            -H "Origin: $ORIGIN" \
            -H "Authorization: $auth_header" \
            "$BACKEND_URL$path" 2>&1)
    else
        response=$(curl -s -i -X GET \
            -H "Origin: $ORIGIN" \
            "$BACKEND_URL$path" 2>&1)
    fi

    status_code=$(echo "$response" | grep -i "^HTTP" | tail -1 | awk '{print $2}')

    if [ -z "$status_code" ]; then
        echo -e "${RED}    ✗ Failed to connect${NC}\n"
        return 1
    fi

    if [ "$status_code" -lt 400 ]; then
        echo -e "    Status: ${GREEN}$status_code${NC}"
    else
        echo -e "    Status: ${YELLOW}$status_code${NC}"
    fi

    cors_origin=$(echo "$response" | grep -i "access-control-allow-origin" | cut -d: -f2- | tr -d '\r')
    if [ -n "$cors_origin" ]; then
        echo -e "    ${GREEN}✓ CORS header present${NC}"
    else
        echo -e "    ${RED}✗ CORS header missing${NC}"
    fi

    echo ""
    echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}\n"
}

# Run tests
test_endpoint "Firefly III - About" "/api/v1/about" "Bearer test_token"
test_endpoint "Sync API - Health Check" "/api/sync/health" ""
test_endpoint "Sync API - Account Usage" "/api/sync/get_accounts_usage" "Bearer test_token"

echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                  Test Complete                     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}Note:${NC} These tests verify CORS headers are present."
echo -e "For full testing with real tokens, use the browser-based test:"
echo -e "${BLUE}  npm run dev${NC}"
echo -e "${BLUE}  Then open: http://localhost:3000/test.html${NC}\n"
