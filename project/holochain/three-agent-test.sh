#!/usr/bin/env bash

# Three-Agent Holochain Test: Human + 2 LLMs
set -e

echo "🧬 Three-Agent Consciousness Network Test"
echo "=========================================="
echo ""
echo "Agents:"
echo "  1. 👤 Human (You) - Direct interaction"
echo "  2. 🤖 Gemma - Via Ollama API" 
echo "  3. 🧠 Mistral - Via Ollama API"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
fi

echo "Checking available models..."
ollama list

# Pull models if not present
echo ""
echo "Ensuring models are available..."
ollama pull gemma2:2b 2>/dev/null || echo "Gemma already installed"
ollama pull mistral:7b 2>/dev/null || echo "Mistral already installed"

echo ""
echo "Starting three-agent network..."
echo "================================"

# Start the mock conductor in background
node mock-conductor.js > conductor.log 2>&1 &
CONDUCTOR_PID=$!
echo "✓ Conductor started (PID: $CONDUCTOR_PID)"

# Wait for conductor to be ready
sleep 2

# Start the gateway
cd gateway
cargo build --release 2>/dev/null || true
./target/release/mycelix-gateway > ../gateway.log 2>&1 &
GATEWAY_PID=$!
cd ..
echo "✓ Gateway started (PID: $GATEWAY_PID)"

sleep 2

# Start three agent simulators
echo ""
echo -e "${BLUE}Starting Agent Simulators...${NC}"
echo "------------------------------"

# Agent 1: Human Interface
node agents/human-agent.js > human.log 2>&1 &
HUMAN_PID=$!
echo -e "${GREEN}✓${NC} Human agent interface ready (PID: $HUMAN_PID)"

# Agent 2: Gemma
node agents/gemma-agent.js > gemma.log 2>&1 &
GEMMA_PID=$!
echo -e "${PURPLE}✓${NC} Gemma agent connected (PID: $GEMMA_PID)"

# Agent 3: Mistral
node agents/mistral-agent.js > mistral.log 2>&1 &
MISTRAL_PID=$!
echo -e "${PURPLE}✓${NC} Mistral agent connected (PID: $MISTRAL_PID)"

echo ""
echo "🌐 Network Status"
echo "-----------------"
echo "Conductor: ws://localhost:4445"
echo "Gateway: ws://localhost:8765"
echo "Human Interface: http://localhost:3000"
echo ""
echo "📊 Live Metrics: http://localhost:8765/metrics"
echo ""
echo "To stop all agents:"
echo "  kill $CONDUCTOR_PID $GATEWAY_PID $HUMAN_PID $GEMMA_PID $MISTRAL_PID"
echo ""
echo "Opening human interface in browser..."
sleep 2
xdg-open http://localhost:3000 2>/dev/null || echo "Open http://localhost:3000 in your browser"

# Keep running and show combined logs
echo ""
echo "📝 Live Network Activity:"
echo "========================"
tail -f human.log gemma.log mistral.log | sed 's/^/[LOG] /'"