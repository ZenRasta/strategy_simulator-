#!/bin/bash
# =============================================================
# MiroFish Strategy Simulator — Launch Script
# =============================================================
# Starts both the MiroFish backend (port 5001) and the webapp (port 8080)
# =============================================================

set -e

echo ""
echo "====================================================="
echo "  MiroFish Strategy Simulator — Starting"
echo "====================================================="
echo ""

# Kill any existing processes on our ports
echo "[1/3] Cleaning up existing processes..."
fuser -k 5001/tcp 2>/dev/null || true
fuser -k 8080/tcp 2>/dev/null || true
sleep 1

# Start MiroFish backend
echo "[2/3] Starting MiroFish backend (port 5001)..."
cd /root/mirofish
source backend/.venv/bin/activate 2>/dev/null || true
cd backend
nohup python run.py > /var/www/strategy_sim/logs/mirofish-backend.log 2>&1 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo "  Waiting for backend to be ready..."
for i in $(seq 1 30); do
    if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
        echo "  Backend ready!"
        break
    fi
    sleep 2
done

# Start webapp
echo "[3/3] Starting webapp dashboard (port 8080)..."
cd /var/www/strategy_sim/webapp
nohup python3 app.py > /var/www/strategy_sim/logs/webapp.log 2>&1 &
WEBAPP_PID=$!
echo "  Webapp PID: $WEBAPP_PID"

sleep 2

echo ""
echo "====================================================="
echo "  Ready!"
echo "====================================================="
echo ""
echo "  Dashboard:  http://localhost:8080"
echo "  Backend:    http://localhost:5001"
echo ""
echo "  Logs:"
echo "    tail -f /var/www/strategy_sim/logs/mirofish-backend.log"
echo "    tail -f /var/www/strategy_sim/logs/webapp.log"
echo ""
echo "  To stop:"
echo "    kill $BACKEND_PID $WEBAPP_PID"
echo ""
