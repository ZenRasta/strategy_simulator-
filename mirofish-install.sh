#!/bin/bash
# =============================================================
# MiroFish Installation Script — Linux VM (Ubuntu 22.04/24.04)
# =============================================================
# Run with: bash mirofish-install.sh
# Run as a non-root user with sudo privileges.
# =============================================================

set -e  # Exit on any error

echo ""
echo "====================================================="
echo "  MiroFish Installer — Company Strategy Simulator"
echo "====================================================="
echo ""

# -------------------------------------------------------------
# STEP 1: System update + core dependencies
# -------------------------------------------------------------
echo "[1/7] Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y

echo "[1/7] Installing system dependencies..."
sudo apt-get install -y \
    curl \
    git \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    unzip \
    wget \
    ca-certificates \
    gnupg \
    lsb-release

# -------------------------------------------------------------
# STEP 2: Install Node.js 20 (LTS) via NodeSource
# -------------------------------------------------------------
echo ""
echo "[2/7] Installing Node.js 20 LTS..."

if command -v node &> /dev/null; then
    NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VER" -ge 18 ]; then
        echo "  Node.js $(node -v) already installed. Skipping."
    else
        echo "  Existing Node.js version too old. Upgrading..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "  Node.js: $(node -v)"
echo "  npm:     $(npm -v)"

# -------------------------------------------------------------
# STEP 3: Install Python 3.11
# -------------------------------------------------------------
echo ""
echo "[3/7] Installing Python 3.11..."

sudo apt-get install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt-get update -y
sudo apt-get install -y python3.11 python3.11-venv python3.11-dev

# Set python3.11 as the default python3 if not already
PYTHON_VER=$(python3 --version 2>&1 | grep -oP '\d+\.\d+' | head -1)
echo "  Python: $(python3.11 --version)"

# -------------------------------------------------------------
# STEP 4: Install uv (Python package manager)
# -------------------------------------------------------------
echo ""
echo "[4/7] Installing uv (Python package manager)..."

if command -v uv &> /dev/null; then
    echo "  uv already installed: $(uv --version)"
else
    curl -LsSf https://astral.sh/uv/install.sh | sh
    # Add uv to PATH for this session
    export PATH="$HOME/.cargo/bin:$HOME/.local/bin:$PATH"
    echo 'export PATH="$HOME/.cargo/bin:$HOME/.local/bin:$PATH"' >> ~/.bashrc
fi

echo "  uv: $(uv --version)"

# -------------------------------------------------------------
# STEP 5: Clone MiroFish repository
# -------------------------------------------------------------
echo ""
echo "[5/7] Cloning MiroFish repository..."

INSTALL_DIR="$HOME/mirofish"

if [ -d "$INSTALL_DIR" ]; then
    echo "  Directory $INSTALL_DIR already exists. Pulling latest..."
    cd "$INSTALL_DIR" && git pull
else
    git clone https://github.com/666ghj/MiroFish.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

echo "  Cloned to: $INSTALL_DIR"

# -------------------------------------------------------------
# STEP 6: Configure environment variables
# -------------------------------------------------------------
echo ""
echo "[6/7] Configuring environment variables..."

cd "$INSTALL_DIR"

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ""
    echo "  ┌─────────────────────────────────────────────────────┐"
    echo "  │         ACTION REQUIRED: Edit your .env file        │"
    echo "  └─────────────────────────────────────────────────────┘"
    echo ""
    echo "  You need two API keys before MiroFish can run:"
    echo ""
    echo "  1) LLM API Key — any OpenAI-compatible provider."
    echo "     Recommended: Claude (Anthropic) via OpenAI-compatible endpoint,"
    echo "     or Alibaba qwen-plus (cheapest for high agent counts)."
    echo ""
    echo "     For Anthropic (Claude Sonnet):"
    echo "       LLM_API_KEY=your_anthropic_api_key"
    echo "       LLM_BASE_URL=https://api.anthropic.com/v1"
    echo "       LLM_MODEL_NAME=claude-sonnet-4-6"
    echo ""
    echo "     For Alibaba qwen-plus (default, lowest cost):"
    echo "       LLM_API_KEY=your_dashscope_key"
    echo "       LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1"
    echo "       LLM_MODEL_NAME=qwen-plus"
    echo ""
    echo "  2) Zep Cloud API Key — free tier is sufficient."
    echo "     Sign up at: https://app.getzep.com/"
    echo "       ZEP_API_KEY=your_zep_api_key"
    echo ""
    echo "  Edit now with:"
    echo "    nano $INSTALL_DIR/.env"
    echo ""
    read -p "  Press ENTER once you have edited .env to continue, or Ctrl+C to exit and edit first..."
else
    echo "  .env already exists. Skipping. Verify your keys are set:"
    grep -E "^LLM_|^ZEP_" .env | sed 's/=.*/=<set>/'
fi

# Validate that keys are not empty placeholders
if grep -qE "^LLM_API_KEY=your_|^LLM_API_KEY=$" .env 2>/dev/null; then
    echo ""
    echo "  WARNING: LLM_API_KEY appears unset in .env."
    echo "  Edit $INSTALL_DIR/.env before running MiroFish."
fi

if grep -qE "^ZEP_API_KEY=your_|^ZEP_API_KEY=$" .env 2>/dev/null; then
    echo ""
    echo "  WARNING: ZEP_API_KEY appears unset in .env."
    echo "  Sign up at https://app.getzep.com/ and add your key."
fi

# -------------------------------------------------------------
# STEP 7: Install all dependencies
# -------------------------------------------------------------
echo ""
echo "[7/7] Installing Node and Python dependencies..."

cd "$INSTALL_DIR"

# Root + frontend Node dependencies
echo "  Installing Node dependencies (root + frontend)..."
npm run setup

# Backend Python dependencies (creates venv automatically via uv)
echo "  Installing Python backend dependencies via uv..."
npm run setup:backend

echo ""
echo "====================================================="
echo "  Installation Complete!"
echo "====================================================="
echo ""
echo "  Location:  $INSTALL_DIR"
echo "  Frontend:  http://localhost:3000  (or your VM's IP)"
echo "  Backend:   http://localhost:5001"
echo ""
echo "  To start MiroFish:"
echo "    cd $INSTALL_DIR"
echo "    npm run dev"
echo ""
echo "  To run in background (tmux recommended):"
echo "    tmux new -s mirofish"
echo "    cd $INSTALL_DIR && npm run dev"
echo "    # Detach: Ctrl+B then D"
echo "    # Reattach: tmux attach -t mirofish"
echo ""
echo "  If accessing from outside the VM, open firewall ports:"
echo "    sudo ufw allow 3000/tcp"
echo "    sudo ufw allow 5001/tcp"
echo ""
echo "  Estimated cost per simulation run:"
echo "    Small  (200 agents, 15 rounds):   < \$5"
echo "    Medium (800 agents, 30 rounds):   \$5–15"
echo "    Large  (1200 agents, 50 rounds):  \$15–25"
echo ""
echo "  For a company strategy scenario (20–50 key actors),"
echo "  you're at the low end — tight agent count, high fidelity."
echo ""
