#!/bin/bash
# Starts both backend and frontend, runs smoke test, and keeps both running.
# Usage: bash scripts/dev-up.sh
set -u

ROOT=/home/z/my-project
BACKEND_LOG=/tmp/lenz-backend.log
FRONTEND_LOG=/tmp/lenz-frontend.log

# 1) Kill any stragglers
pkill -f "node dist/main.js" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# 2) Start backend
cd "$ROOT/apps/backend"
nohup node dist/main.js > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# 3) Start frontend
cd "$ROOT/apps/frontend"
nohup npx next dev -p 3000 > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# 4) Wait for backend (max 15s)
for i in $(seq 1 30); do
  if curl -s -X POST http://localhost:4000/graphql -H "Content-Type: application/json" -d '{"query":"{__typename}"}' 2>/dev/null | grep -q __typename; then
    echo "Backend ready after ${i}*0.5s"
    break
  fi
  sleep 0.5
done

# 5) Wait for frontend (max 30s)
for i in $(seq 1 60); do
  if curl -s -o /dev/null http://localhost:3000 2>/dev/null; then
    echo "Frontend ready after ${i}*0.5s"
    break
  fi
  sleep 0.5
done

# 6) Wait for frontend to finish compiling (give it 8s)
sleep 8

# 7) Health check
echo "=== Health ==="
curl -s -o /dev/null -w "Backend direct: %{http_code}\n" -X POST http://localhost:4000/graphql -H "Content-Type: application/json" -d '{"query":"{__typename}"}'
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:3000
echo -n "Proxy /api/graphql: "
curl -s -X POST http://localhost:3000/api/graphql -H "Content-Type: application/json" -d '{"query":"{__typename}"}'
echo ""

# 8) Test register via proxy
echo "=== Register test via proxy ==="
RESULT=$(curl -s -X POST http://localhost:3000/api/graphql -H "Content-Type: application/json" -d '{"query":"mutation { register(input: { username: \"liquidtest2\", email: \"liquid2@test.local\", password: \"password123\", fullName: \"Liquid Test 2\" }) { user { id username } accessToken } }"}')
echo "$RESULT" | head -c 400
echo ""

# 9) Show any errors
echo "=== Recent backend log ==="
tail -5 "$BACKEND_LOG"
echo "=== Recent frontend log ==="
tail -10 "$FRONTEND_LOG"

# 10) Save PIDs for later use
echo "$BACKEND_PID" > /tmp/lenz-backend.pid
echo "$FRONTEND_PID" > /tmp/lenz-frontend.pid
echo ""
echo "PIDs saved. Backend=$BACKEND_PID Frontend=$FRONTEND_PID"
