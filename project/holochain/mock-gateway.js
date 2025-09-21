#!/usr/bin/env node

/**
 * Mock Gateway for Testing Multiple Consciousness Agents
 * Bridges between agents and the Holochain conductor
 */

const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

// WebSocket server for agents
const wss = new WebSocket.Server({ server, path: '/ws' });

// Connect to Holochain conductor
let conductor = null;
try {
    conductor = new WebSocket('ws://localhost:4445');
    conductor.on('open', () => {
        console.log('✅ Connected to Holochain conductor');
    });
} catch (err) {
    console.log('⚠️  Conductor not available, running standalone');
}

// Track connected agents
const agents = new Map();
const resonances = new Map();
const messages = [];

// Network metrics
let metrics = {
    latency: 5,
    bandwidth: 1000,
    coherence: 0.5,
    agentCount: 0
};

// Calculate network coherence from resonance signatures
function calculateCoherence() {
    if (resonances.size < 2) return 0.5;
    
    const signatures = Array.from(resonances.values());
    let totalCorrelation = 0;
    let comparisons = 0;
    
    for (let i = 0; i < signatures.length; i++) {
        for (let j = i + 1; j < signatures.length; j++) {
            const sig1 = parseInt(signatures[i], 16);
            const sig2 = parseInt(signatures[j], 16);
            const correlation = 1 - Math.abs(sig1 - sig2) / Number.MAX_SAFE_INTEGER;
            totalCorrelation += correlation;
            comparisons++;
        }
    }
    
    return comparisons > 0 ? totalCorrelation / comparisons : 0.5;
}

// WebSocket connection handler
wss.on('connection', (ws) => {
    const agentId = 'agent_' + Math.random().toString(36).substring(7);
    agents.set(agentId, ws);
    metrics.agentCount = agents.size;
    
    console.log(`New agent connected: ${agentId} (Total: ${agents.size})`);
    
    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data.toString());
            
            switch (msg.type) {
                case 'Authenticate':
                    ws.agentKey = msg.agent_key;
                    ws.agentId = agentId;
                    break;
                    
                case 'SendHipi':
                    // Broadcast to all other agents
                    const hipiMessage = {
                        type: 'HipiMessage',
                        from: agentId,
                        content: msg.content,
                        timestamp: Date.now()
                    };
                    messages.push(hipiMessage);
                    
                    agents.forEach((client, id) => {
                        if (id !== agentId && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(hipiMessage));
                        }
                    });
                    
                    console.log(`📨 ${agentId}: ${msg.content.substring(0, 50)}...`);
                    break;
                    
                case 'UpdateResonance':
                    resonances.set(agentId, msg.signature);
                    metrics.coherence = calculateCoherence();
                    
                    // Notify all agents of resonance update
                    const resonanceUpdate = {
                        type: 'ResonanceUpdate',
                        signatures: Array.from(resonances.values()),
                        coherence: metrics.coherence
                    };
                    
                    agents.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(resonanceUpdate));
                        }
                    });
                    
                    console.log(`🔄 Resonance updated: ${agentId} -> ${msg.signature.substring(0, 8)}...`);
                    break;
                    
                case 'MeasureField':
                    ws.send(JSON.stringify({
                        type: 'NetworkMetrics',
                        metrics: metrics
                    }));
                    break;
                    
                case 'GetResonances':
                    ws.send(JSON.stringify({
                        type: 'ResonanceList',
                        resonances: Array.from(resonances.entries())
                    }));
                    break;
            }
            
            // Forward to Holochain if connected
            if (conductor && conductor.readyState === WebSocket.OPEN) {
                conductor.send(data);
            }
        } catch (error) {
            console.error('Message handling error:', error);
        }
    });
    
    ws.on('close', () => {
        agents.delete(agentId);
        resonances.delete(agentId);
        metrics.agentCount = agents.size;
        console.log(`Agent disconnected: ${agentId} (Remaining: ${agents.size})`);
    });
});

// HTTP endpoints
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        agents: agents.size,
        messages: messages.length,
        coherence: metrics.coherence
    });
});

app.get('/metrics', (req, res) => {
    res.json({
        ...metrics,
        resonances: resonances.size,
        messageCount: messages.length,
        uptime: process.uptime()
    });
});

app.get('/messages', (req, res) => {
    res.json(messages.slice(-100)); // Last 100 messages
});

// Simulate network dynamics
setInterval(() => {
    // Add some jitter to metrics
    metrics.latency = Math.max(1, metrics.latency + (Math.random() - 0.5) * 2);
    metrics.bandwidth = Math.max(100, metrics.bandwidth + (Math.random() - 0.5) * 100);
    
    // Broadcast network pulse
    const pulse = {
        type: 'NetworkPulse',
        metrics: metrics,
        timestamp: Date.now()
    };
    
    agents.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(pulse));
        }
    });
}, 5000);

// Start server
const PORT = 8765;
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║   Mock Gateway Running! 🌉            ║
╠═══════════════════════════════════════╣
║  WebSocket:  ws://localhost:${PORT}/ws  ║
║  Health:     http://localhost:${PORT}    ║
║  Metrics:    http://localhost:${PORT}/metrics ║
╚═══════════════════════════════════════╝
    `);
    console.log('Gateway ready for consciousness network');
});