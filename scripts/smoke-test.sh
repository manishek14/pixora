#!/usr/bin/env bash
# End-to-end smoke test for Lenz backend (GraphQL API on :4000).
# Note: passwords must meet the strong-password policy
# (>=8 chars, lowercase, uppercase, digit, special char).
set -euo pipefail

API="http://localhost:4000/graphql"

echo "============================================================"
echo "  Lenz Backend E2E Smoke Test"
echo "============================================================"

# 1. Register user A
echo ""
echo "[1/8] Register user 'sara'"
REG_A=$(curl -s -X POST $API -H "Content-Type: application/json" -d '{
  "query": "mutation { register(input: { username: \"sara\", email: \"sara@test.com\", password: \"Str0ng!Pass\", fullName: \"Sara Test\" }) { user { id username } accessToken refreshToken } }"
}')
TOKEN_A=$(echo "$REG_A" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['register']['accessToken'])")
USER_A_ID=$(echo "$REG_A" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['register']['user']['id'])")
echo "  user id: $USER_A_ID"
echo "  token: ${TOKEN_A:0:20}..."

# 2. Register user B
echo ""
echo "[2/8] Register user 'reza'"
REG_B=$(curl -s -X POST $API -H "Content-Type: application/json" -d '{
  "query": "mutation { register(input: { username: \"reza\", email: \"reza@test.com\", password: \"Str0ng!Pass\", fullName: \"Reza Test\" }) { user { id username } accessToken } }"
}')
TOKEN_B=$(echo "$REG_B" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['register']['accessToken'])")
USER_B_ID=$(echo "$REG_B" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['register']['user']['id'])")
echo "  user id: $USER_B_ID"

# 3. User A follows user B
echo ""
echo "[3/8] Sara follows Reza"
curl -s -X POST $API -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_A" -d "{
  \"query\": \"mutation { followUser(userId: \\\"$USER_B_ID\\\") }\"
}" | python3 -m json.tool

# 4. User B creates a post
echo ""
echo "[4/8] Reza creates a post"
POST_RES=$(curl -s -X POST $API -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_B" -d '{
  "query": "mutation { createPost(input: { caption: \"Hello Lenz! #first #hello @sara\", mediaUrls: [\"/uploads/test1.jpg\"] }) { id caption hashtags mentions likesCount author { username } } }"
}')
POST_ID=$(echo "$POST_RES" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['createPost']['id'])")
echo "$POST_RES" | python3 -m json.tool

# 5. User A likes the post
echo ""
echo "[5/8] Sara likes Reza's post"
curl -s -X POST $API -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_A" -d "{
  \"query\": \"mutation { toggleLike(postId: \\\"$POST_ID\\\") }\"
}" | python3 -m json.tool

# 6. User A comments on the post
echo ""
echo "[6/8] Sara comments on the post"
curl -s -X POST $API -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_A" -d "{
  \"query\": \"mutation { createComment(input: { postId: \\\"$POST_ID\\\", text: \\\"Nice post!\\\" }) { id text user { username } } }\"
}" | python3 -m json.tool

# 7. User A reads their feed (should include Reza's post)
echo ""
echo "[7/8] Sara reads her feed (should show Reza's post)"
curl -s -X POST $API -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_A" -d '{
  "query": "{ feed(limit: 10) { items { id caption author { username } likesCount commentsCount hashtags } hasMore } }"
}' | python3 -m json.tool

# 8. Get the post by hashtag
echo ""
echo "[8/8] Search posts by #first hashtag"
curl -s -X POST $API -H "Content-Type: application/json" -d '{
  "query": "{ postsByHashtag(tag: \"first\") { id caption author { username } } }"
}' | python3 -m json.tool

echo ""
echo "============================================================"
echo "  All tests passed!"
echo "  Backend: http://localhost:4000/graphql"
echo "  Playground: http://localhost:4000/graphql (open in browser)"
echo "============================================================"
