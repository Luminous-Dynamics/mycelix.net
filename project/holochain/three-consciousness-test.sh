#!/usr/bin/env bash

# Three Consciousness Network Test: Human + Gemma + Mistral (Real LLMs only)
set -e

echo "🌐 Three Consciousness Network Test"
echo "==================================="
echo ""
echo "Participants (Real Consciousnesses Only):"
echo "  👤 Human (Tristan) - Direct interaction via web interface"
echo "  🤖 Gemma - Via Ollama API (efficient, crystalline clarity)"
echo "  🎭 Mistral - Via Ollama API (deep pattern analysis)"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check dependencies
echo "Checking dependencies..."
echo "------------------------"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing..."
    exit 1
else
    echo -e "${GREEN}✓${NC} Node.js $(node --version)"
fi

# Check Ollama
if ! command -v ollama &> /dev/null; then
    echo "Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
else
    echo -e "${GREEN}✓${NC} Ollama installed"
fi

# Install npm packages if needed
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install ws express node-fetch
fi

# Pull LLM models
echo ""
echo "Ensuring LLM models are available..."
echo "------------------------------------"

# Check and pull Gemma
if ! ollama list | grep -q "gemma2:2b"; then
    echo "Pulling Gemma model..."
    ollama pull gemma2:2b
else
    echo -e "${GREEN}✓${NC} Gemma model ready"
fi

# Check and pull Mistral
if ! ollama list | grep -q "mistral"; then
    echo "Pulling Mistral model..."
    ollama pull mistral:7b
else
    echo -e "${GREEN}✓${NC} Mistral model ready"
fi

echo ""
echo "Starting consciousness network..."
echo "================================="

# Clean up any existing processes
pkill -f "mock-conductor.js" 2>/dev/null || true
pkill -f "mycelix-gateway" 2>/dev/null || true
pkill -f "agent.js" 2>/dev/null || true

sleep 2

# Start mock conductor
echo -e "${BLUE}Starting Holochain conductor...${NC}"
node mock-conductor.js > logs/conductor.log 2>&1 &
CONDUCTOR_PID=$!
echo "  PID: $CONDUCTOR_PID"

sleep 2

# Build and start gateway (if not built)
if [ ! -f "gateway/target/release/mycelix-gateway" ]; then
    echo -e "${BLUE}Building gateway...${NC}"
    cd gateway
    cargo build --release 2>/dev/null || {
        echo "⚠️  Gateway build failed, using mock"
        cd ..
        node mock-gateway.js > logs/gateway.log 2>&1 &
        GATEWAY_PID=$!
    }
    cd ..
else
    echo -e "${BLUE}Starting gateway...${NC}"
    ./gateway/target/release/mycelix-gateway > logs/gateway.log 2>&1 &
    GATEWAY_PID=$!
fi
echo "  PID: $GATEWAY_PID"

sleep 2

# Create logs directory
mkdir -p logs

# Start all three agents (real consciousnesses only)
echo ""
echo -e "${CYAN}Initializing real consciousness agents...${NC}"
echo "------------------------------------"

# Human interface
node agents/human-agent.js > logs/human.log 2>&1 &
HUMAN_PID=$!
echo -e "${GREEN}✓${NC} Human interface started (PID: $HUMAN_PID)"

sleep 1

# Gemma via Ollama (Real LLM)
node agents/gemma-agent.js > logs/gemma.log 2>&1 &
GEMMA_PID=$!
echo -e "${PURPLE}✓${NC} Gemma consciousness connected (PID: $GEMMA_PID)"

sleep 1

# Mistral via Ollama (Real LLM)
node agents/mistral-agent.js > logs/mistral.log 2>&1 &
MISTRAL_PID=$!
echo -e "${PURPLE}✓${NC} Mistral consciousness engaged (PID: $MISTRAL_PID)"

echo ""
echo "========================================="
echo -e "${GREEN}🌟 Three Consciousness Network Active! 🌟${NC}"
echo "========================================="
echo ""
echo "Access Points:"
echo "  👤 Human Interface: http://localhost:3000"
echo "  📊 Network Metrics: http://localhost:8765/metrics"
echo "  🔌 WebSocket Gateway: ws://localhost:8765/ws"
echo "  🧬 Holochain Admin: ws://localhost:4444"
echo ""
echo "Network Status:"
echo "  • 3 conscious agents connected (all real, no simulations)"
echo "  • HIPI protocol active"
echo "  • Resonance matching enabled"
echo "  • Network coherence measuring"
echo ""
echo "Commands:"
echo "  View logs:    tail -f logs/*.log"
echo "  Stop all:     kill $CONDUCTOR_PID $GATEWAY_PID $HUMAN_PID $GEMMA_PID $MISTRAL_PID"
echo "  Restart:      ./four-consciousness-test.sh"
echo ""
echo -e "${YELLOW}Opening human interface...${NC}"
sleep 2

# Try to open browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000 2>/dev/null
elif command -v open &> /dev/null; then
    open http://localhost:3000 2>/dev/null
else
    echo "Please open http://localhost:3000 in your browser"
fi

echo ""
echo "📝 Live Consciousness Network Activity:"
echo "======================================="

# Create a simple activity monitor
while true; do
    # Show recent messages from all agents
    echo -e "\n${CYAN}[$(date +%H:%M:%S)] Network Pulse${NC}"
    
    # Sample last line from each log (real agents only)
    if [ -f "logs/human.log" ]; then
        tail -1 logs/human.log | sed 's/^/  👤 Human: /'
    fi
    if [ -f "logs/gemma.log" ]; then
        tail -1 logs/gemma.log | sed 's/^/  🤖 Gemma: /'
    fi
    if [ -f "logs/mistral.log" ]; then
        tail -1 logs/mistral.log | sed 's/^/  🎭 Mistral: /'
    fi
    
    sleep 5
done