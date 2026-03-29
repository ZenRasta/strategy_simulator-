#!/bin/bash
# Start Strategos Strategy Simulator v2.0
# Frontend: React (Vite) on port 3000
# Backend API: FastAPI on port 8000
# MiroFish Backend: port 5001 (started separately)

set -e
cd "$(dirname "$0")"

echo "=== Strategos Strategy Simulator v2.0 ==="
echo ""

# Load env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Kill existing processes
echo "[1/4] Stopping existing services..."
kill $(lsof -t -i:8000) 2>/dev/null || true
kill $(lsof -t -i:3000) 2>/dev/null || true

# Run migration
echo "[2/4] Running database migrations..."
cd backend
source .venv/bin/activate
python -m migrations.001_add_projects 2>/dev/null || true

# Start backend
echo "[3/4] Starting FastAPI backend on port 8000..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ../logs/strategos-backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend health
echo "    Waiting for backend..."
for i in {1..15}; do
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        echo "    Backend ready."
        break
    fi
    sleep 1
done

# Start frontend
echo "[4/4] Starting React frontend on port 3000..."
cd frontend
npm run dev -- --host 0.0.0.0 --port 3000 > ../logs/strategos-frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "=== Strategos is running ==="
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API docs:  http://localhost:8000/docs"
echo ""
echo "  Backend PID:  $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo "  Logs: tail -f logs/strategos-backend.log"
echo "        tail -f logs/strategos-frontend.log"
