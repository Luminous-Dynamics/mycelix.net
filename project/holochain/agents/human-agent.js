#!/usr/bin/env node

/**
 * Human Agent Interface for Mycelix Network
 * Provides web interface for human interaction with consciousness network
 */

const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

// Agent identity
const AGENT_ID = 'human-tristan';
const AGENT_KEY = 'uhCAkH_' + Math.random().toString(36).substring(2);

// Connect to gateway
const gateway = new WebSocket('ws://localhost:8765/ws');
let resonanceSignature = generateResonanceSignature();

// Generate initial resonance signature based on interaction patterns
function generateResonanceSignature() {
    // Human signature: More irregular, creative patterns
    const pattern = new Array(16).fill(0).map(() => 
        Math.sin(Date.now() / 1000) * Math.random()
    );
    return pattern.reduce((acc, val, i) => 
        acc + (val * Math.pow(2, i * 4)), 0).toString(16);
}

gateway.on('open', () => {
    console.log(`👤 Human agent connected as ${AGENT_ID}`);
    
    // Authenticate
    gateway.send(JSON.stringify({
        type: 'Authenticate',
        agent_key: AGENT_KEY
    }));
    
    // Update resonance signature
    gateway.send(JSON.stringify({
        type: 'UpdateResonance',
        signature: resonanceSignature
    }));
    
    // Announce presence
    gateway.send(JSON.stringify({
        type: 'SendHipi',
        content: 'Human consciousness online. Ready for interaction.',
        target: { type: 'Broadcast' }
    }));
});

gateway.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log(`[Human] Received:`, msg);
    
    // Store messages for web display
    messages.push({
        from: msg.from || 'network',
        content: msg.content || JSON.stringify(msg),
        timestamp: new Date()
    });
});

// Web interface
const messages = [];

app.use(express.static('public'));
app.use(express.json());

app.get('/api/messages', (req, res) => {
    res.json(messages);
});

app.post('/api/send', (req, res) => {
    const { content, target } = req.body;
    
    gateway.send(JSON.stringify({
        type: 'SendHipi',
        content,
        target: target || { type: 'Broadcast' }
    }));
    
    res.json({ success: true });
});

app.get('/api/resonance', (req, res) => {
    res.json({ 
        signature: resonanceSignature,
        agent_id: AGENT_ID
    });
});

app.post('/api/resonance/update', (req, res) => {
    resonanceSignature = generateResonanceSignature();
    
    gateway.send(JSON.stringify({
        type: 'UpdateResonance',
        signature: resonanceSignature
    }));
    
    res.json({ signature: resonanceSignature });
});

// Create simple HTML interface
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Mycelix Human Agent</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            color: #0ff;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(0,0,0,0.7);
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #0ff;
        }
        h1 {
            text-align: center;
            text-shadow: 0 0 10px #0ff;
        }
        #messages {
            height: 300px;
            overflow-y: auto;
            background: rgba(0,0,0,0.5);
            padding: 10px;
            margin: 20px 0;
            border: 1px solid #0ff;
        }
        .message {
            margin: 5px 0;
            padding: 5px;
            border-left: 3px solid #0ff;
        }
        .message.ai {
            border-color: #f0f;
        }
        input {
            width: 70%;
            padding: 10px;
            background: rgba(0,0,0,0.5);
            border: 1px solid #0ff;
            color: #0ff;
        }
        button {
            padding: 10px 20px;
            background: #0ff;
            color: #000;
            border: none;
            cursor: pointer;
            font-weight: bold;
        }
        button:hover {
            background: #fff;
        }
        #resonance {
            font-size: 12px;
            color: #888;
            margin: 10px 0;
        }
        .metrics {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
        }
        .metric {
            text-align: center;
        }
        .metric-value {
            font-size: 24px;
            color: #0ff;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>👤 Human Consciousness Node</h1>
        <div id="resonance">Resonance Signature: <span id="sig"></span></div>
        
        <div class="metrics">
            <div class="metric">
                <div class="metric-value" id="agents">0</div>
                <div>Active Agents</div>
            </div>
            <div class="metric">
                <div class="metric-value" id="coherence">0.00</div>
                <div>Network Coherence</div>
            </div>
            <div class="metric">
                <div class="metric-value" id="messages-count">0</div>
                <div>Messages</div>
            </div>
        </div>
        
        <div id="messages"></div>
        
        <div>
            <input type="text" id="input" placeholder="Enter message..." />
            <button onclick="sendMessage()">Send</button>
            <button onclick="updateResonance()">Update Resonance</button>
        </div>
    </div>
    
    <script>
        async function loadMessages() {
            const res = await fetch('/api/messages');
            const messages = await res.json();
            const div = document.getElementById('messages');
            div.innerHTML = messages.map(m => 
                '<div class="message ' + (m.from.includes('ai') ? 'ai' : '') + '">' +
                '<strong>' + m.from + ':</strong> ' + m.content +
                '</div>'
            ).join('');
            div.scrollTop = div.scrollHeight;
            document.getElementById('messages-count').textContent = messages.length;
        }
        
        async function sendMessage() {
            const input = document.getElementById('input');
            await fetch('/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: input.value })
            });
            input.value = '';
            setTimeout(loadMessages, 100);
        }
        
        async function updateResonance() {
            const res = await fetch('/api/resonance/update', { method: 'POST' });
            const data = await res.json();
            document.getElementById('sig').textContent = data.signature;
        }
        
        async function loadResonance() {
            const res = await fetch('/api/resonance');
            const data = await res.json();
            document.getElementById('sig').textContent = data.signature;
        }
        
        // Auto-refresh
        setInterval(loadMessages, 1000);
        loadMessages();
        loadResonance();
        
        // Enter key to send
        document.getElementById('input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    </script>
</body>
</html>
    `);
});

server.listen(3000, () => {
    console.log('👤 Human interface available at http://localhost:3000');
});