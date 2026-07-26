#!/usr/bin/env bash
# Verifies the two fixes:
#   1. FEED query (and others) using GraphQL Int no longer fails with 400
#   2. Backend rejects weak passwords during register
# Backend is expected to be running on :4000 (already started)

set -u

API="http://127.0.0.1:4000/graphql"
TS=$(date +%s)

echo "=== Test 1: Register with STRONG password (should succeed) ==="
REG_RESP=$(curl -s "$API" -X POST -H "Content-Type: application/json" -d '{
  "query": "mutation Register($input: RegisterInput!) { register(input: $input) { user { id username } accessToken } }",
  "variables": {
    "input": {
      "username": "verifybug_'"$TS"'",
      "email": "verify'"$TS"'@example.com",
      "password": "Str0ng!Pass",
      "fullName": "Verify"
    }
  }
}')
echo "$REG_RESP" | python3 -m json.tool
echo ""

ACCESS=$(echo "$REG_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['register']['accessToken'])" 2>/dev/null)

if [ -z "$ACCESS" ]; then
  echo "FAIL: did not get access token from strong-password register"
  exit 1
fi

echo "=== Test 2: FEED with Int args (was the bug) ==="
curl -s "$API" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $ACCESS" -d '{"query":"query Feed($limit: Int, $offset: Int) { feed(limit: $limit, offset: $offset) { items { id } hasMore } }","variables":{"limit":10,"offset":0}}' | python3 -m json.tool
echo ""

echo "=== Test 3: EXPLORE with Int args ==="
curl -s "$API" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $ACCESS" -d '{"query":"query ExploreFeed($limit: Int, $offset: Int) { exploreFeed(limit: $limit, offset: $offset) { items { id } hasMore } }","variables":{"limit":10,"offset":0}}' | python3 -m json.tool
echo ""

echo "=== Test 4: ME query (verifies auth works) ==="
curl -s "$API" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $ACCESS" -d '{"query":"query Me { me { id username email } }"}' | python3 -m json.tool
echo ""

TS2=$(date +%s)
echo "=== Test 5: Register with WEAK password (should be REJECTED with 400) ==="
curl -s "$API" -X POST -H "Content-Type: application/json" -d '{
  "query": "mutation Register($input: RegisterInput!) { register(input: $input) { user { id } } }",
  "variables": {
    "input": {
      "username": "weakpass_'"$TS2"'",
      "email": "weak'"$TS2"'@example.com",
      "password": "password123",
      "fullName": "Weak"
    }
  }
}' | python3 -m json.tool
echo ""

TS3=$(date +%s)
echo "=== Test 6: Register with no uppercase (should be REJECTED) ==="
curl -s "$API" -X POST -H "Content-Type: application/json" -d '{
  "query": "mutation Register($input: RegisterInput!) { register(input: $input) { user { id } } }",
  "variables": {
    "input": {
      "username": "nouppercase_'"$TS3"'",
      "email": "noupper'"$TS3"'@example.com",
      "password": "weakpass1!",
      "fullName": "No Upper"
    }
  }
}' | python3 -m json.tool
echo ""

echo "=== All tests complete ==="
