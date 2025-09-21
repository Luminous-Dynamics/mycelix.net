#!/usr/bin/env bash

# Quick demo script for Mycelix - runs a minimal gateway simulation
# This demonstrates the system without requiring full Holochain installation

set -e

echo "🍄 Mycelix Demo Mode"
echo "===================="
echo ""
echo "Running in demo mode without Holochain conductor."
echo "This demonstrates the gateway and client functionality."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Create a simple Node.js gateway mock for demo
cat > /tmp/mycelix-demo-gateway.js << 'EOF'
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');

// Configuration
const PORT = 8765;
const clients = new Map();
const resonanceSignatures = new Map();

// Create HTTP server
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', mode: 'demo' }));
    } else if (req.url === '/metrics') {
        const metrics = {
            connections: clients.size,
            resonance_signatures: resonanceSignatures.size,
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(metrics));
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Calculate resonance match score
function calculateResonance(sig1, sig2) {
    // Simplified resonance calculation
    const diff = Math.abs(parseInt(sig1, 16) - parseInt(sig2, 16));
    const maxDiff = parseInt('FFFFFFFFFFFFFFFF', 16);
    return 1.0 - (diff / maxDiff);
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
    const clientId = crypto.randomBytes(16).toString('hex');
    clients.set(clientId, ws);
    
    console.log(`Client connected: ${clientId}`);
    
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'Connected',
        client_id: clientId,
        timestamp: new Date().toISOString()
    }));
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            
            switch (message.type) {
                case 'UpdateResonance':
                    resonanceSignatures.set(clientId, message.signature);
                    
                    // Find resonating peers
                    const matches = [];
                    resonanceSignatures.forEach((sig, id) => {
                        if (id !== clientId) {
                            const score = calculateResonance(message.signature, sig);
                            if (score > 0.8) {
                                matches.push({ peer_id: id, match_score: score });
                            }
                        }
                    });
                    
                    ws.send(JSON.stringify({
                        type: 'ResonanceMatches',
                        matches: matches
                    }));
                    break;
                    
                case 'SendHipi':
                    // Broadcast message to all clients
                    const hipiMessage = {
                        type: 'HipiReceived',
                        from: clientId,
                        content: message.content,
                        timestamp: new Date().toISOString()
                    };
                    
                    clients.forEach((client, id) => {
                        if (id !== clientId && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(hipiMessage));
                        }
                    });
                    break;
                    
                case 'MeasureField':
                    // Simulate network field measurements
                    const measurement = {
                        type: 'FieldUpdate',
                        measurement: {
                            network_metrics: {
                                latency_ms: 20 + Math.random() * 30,
                                bandwidth_kbps: 1000 + Math.random() * 9000,
                                packet_loss: Math.random() * 0.02,
                                jitter_ms: Math.random() * 5,
                                connection_count: clients.size
                            },
                            coherence: 0.7 + Math.random() * 0.3,
                            timestamp: new Date().toISOString()
                        }
                    };
                    ws.send(JSON.stringify(measurement));
                    break;
                    
                default:
                    ws.send(JSON.stringify({
                        type: 'Error',
                        message: `Unknown message type: ${message.type}`
                    }));
            }
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({
                type: 'Error',
                message: error.message
            }));
        }
    });
    
    ws.on('close', () => {
        clients.delete(clientId);
        resonanceSignatures.delete(clientId);
        console.log(`Client disconnected: ${clientId}`);
    });
});

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   Mycelix Demo Gateway Running! 🍄     ║
╠════════════════════════════════════════╣
║  WebSocket: ws://localhost:${PORT}/ws   ║
║  Health:    http://localhost:${PORT}/health ║
║  Metrics:   http://localhost:${PORT}/metrics ║
╚════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down demo gateway...');
    wss.clients.forEach((ws) => ws.close());
    server.close(() => {
        console.log('Demo gateway stopped');
        process.exit(0);
    });
});
EOF

# Create demo client HTML
cat > /tmp/mycelix-demo-client.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mycelix Demo Client</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
            color: #e0e6ed;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        h1 {
            text-align: center;
            color: #00ffff;
            margin-bottom: 30px;
            text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        }
        
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .panel {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .metrics {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        
        .metric {
            background: rgba(0, 255, 255, 0.1);
            padding: 10px;
            border-radius: 8px;
            border: 1px solid rgba(0, 255, 255, 0.3);
        }
        
        .metric-label {
            font-size: 12px;
            color: #8892b0;
            margin-bottom: 5px;
        }
        
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #00ffff;
        }
        
        .resonance-signature {
            font-family: monospace;
            font-size: 18px;
            color: #ffd700;
            text-align: center;
            padding: 15px;
            background: rgba(255, 215, 0, 0.1);
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .messages {
            max-height: 300px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
        }
        
        .message {
            padding: 8px;
            margin-bottom: 8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 5px;
            border-left: 3px solid #00ffff;
        }
        
        .controls {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        button {
            flex: 1;
            padding: 12px;
            background: linear-gradient(135deg, #00ffff 0%, #0099cc 100%);
            border: none;
            border-radius: 8px;
            color: #0a0e27;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0, 255, 255, 0.4);
        }
        
        .status {
            text-align: center;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .status.connected {
            background: rgba(0, 255, 0, 0.2);
            border: 1px solid rgba(0, 255, 0, 0.5);
        }
        
        .status.disconnected {
            background: rgba(255, 0, 0, 0.2);
            border: 1px solid rgba(255, 0, 0, 0.5);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🍄 Mycelix Consciousness Network - Demo Mode</h1>
        
        <div class="status disconnected" id="status">
            Connecting to gateway...
        </div>
        
        <div class="grid">
            <div class="panel">
                <h2>Network Metrics</h2>
                <div class="metrics">
                    <div class="metric">
                        <div class="metric-label">Latency</div>
                        <div class="metric-value" id="latency">--</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Bandwidth</div>
                        <div class="metric-value" id="bandwidth">--</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Coherence</div>
                        <div class="metric-value" id="coherence">--</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Connections</div>
                        <div class="metric-value" id="connections">--</div>
                    </div>
                </div>
                
                <div class="resonance-signature" id="resonance">
                    ----:----:----:----
                </div>
                
                <div class="controls">
                    <button onclick="updateResonance()">Update Resonance</button>
                    <button onclick="measureField()">Measure Field</button>
                </div>
            </div>
            
            <div class="panel">
                <h2>HIPI Messages</h2>
                <div class="controls">
                    <input type="text" id="messageInput" placeholder="Enter message..." style="flex: 2; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; color: white;">
                    <button onclick="sendMessage()">Send</button>
                </div>
                <div class="messages" id="messages">
                    <div class="message">Welcome to Mycelix demo mode...</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let ws;
        let clientId = null;
        let resonanceSignature = null;
        
        function connect() {
            ws = new WebSocket('ws://localhost:8765/ws');
            
            ws.onopen = () => {
                document.getElementById('status').className = 'status connected';
                document.getElementById('status').textContent = 'Connected to gateway';
                console.log('Connected to gateway');
            };
            
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                console.log('Received:', message);
                
                switch (message.type) {
                    case 'Connected':
                        clientId = message.client_id;
                        addMessage(`Connected with ID: ${clientId.substring(0, 8)}...`);
                        break;
                        
                    case 'FieldUpdate':
                        const metrics = message.measurement.network_metrics;
                        document.getElementById('latency').textContent = Math.round(metrics.latency_ms) + 'ms';
                        document.getElementById('bandwidth').textContent = Math.round(metrics.bandwidth_kbps / 1000) + 'Mbps';
                        document.getElementById('coherence').textContent = metrics.coherence.toFixed(2);
                        document.getElementById('connections').textContent = metrics.connection_count;
                        break;
                        
                    case 'ResonanceMatches':
                        if (message.matches.length > 0) {
                            addMessage(`Found ${message.matches.length} resonating peers!`);
                        }
                        break;
                        
                    case 'HipiReceived':
                        addMessage(`Message from ${message.from.substring(0, 8)}: ${message.content}`);
                        break;
                }
            };
            
            ws.onclose = () => {
                document.getElementById('status').className = 'status disconnected';
                document.getElementById('status').textContent = 'Disconnected - Reconnecting...';
                setTimeout(connect, 3000);
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        }
        
        function updateResonance() {
            resonanceSignature = generateResonance();
            const formatted = resonanceSignature.match(/.{4}/g).join(':');
            document.getElementById('resonance').textContent = formatted;
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'UpdateResonance',
                    signature: resonanceSignature
                }));
            }
        }
        
        function generateResonance() {
            return Array.from({length: 16}, () => 
                Math.floor(Math.random() * 16).toString(16)
            ).join('').toUpperCase();
        }
        
        function measureField() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'MeasureField' }));
            }
        }
        
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (message && ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'SendHipi',
                    content: message,
                    target: { type: 'Broadcast' }
                }));
                addMessage(`You: ${message}`);
                input.value = '';
            }
        }
        
        function addMessage(text) {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            messageDiv.textContent = text;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        // Initialize
        connect();
        updateResonance();
        setInterval(measureField, 5000);
        
        // Enter key sends message
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    </script>
</body>
</html>
EOF

# Install dependencies
print_info "Setting up demo environment..."
cd /tmp
if [ ! -f "package.json" ]; then
    npm init -y > /dev/null 2>&1
fi
npm install ws > /dev/null 2>&1 || {
    echo "Failed to install WebSocket library"
    exit 1
}

# Start demo gateway
print_info "Starting demo gateway..."
node mycelix-demo-gateway.js &
GATEWAY_PID=$!

sleep 2

# Start simple HTTP server for client
print_info "Starting web server for demo client..."
python3 -m http.server 8766 > /dev/null 2>&1 &
HTTP_PID=$!

print_success "Demo services started!"

echo ""
echo "========================================="
echo "     Mycelix Demo Running! 🎉"
echo "========================================="
echo ""
echo "Access Points:"
echo "  • Demo Client: http://localhost:8766/mycelix-demo-client.html"
echo "  • WebSocket: ws://localhost:8765/ws"
echo "  • Health: http://localhost:8765/health"
echo "  • Metrics: http://localhost:8765/metrics"
echo ""
echo "Demo Features:"
echo "  • Real-time resonance matching"
echo "  • HIPI message broadcasting"
echo "  • Network field measurements"
echo "  • WebSocket communication"
echo ""
echo "Press Ctrl+C to stop the demo"
echo ""

# Handle shutdown
cleanup() {
    echo ""
    print_info "Stopping demo services..."
    kill $GATEWAY_PID 2>/dev/null || true
    kill $HTTP_PID 2>/dev/null || true
    print_success "Demo stopped"
    exit 0
}

trap cleanup EXIT INT TERM

# Keep running
while true; do
    sleep 1
done