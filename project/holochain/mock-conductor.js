#!/usr/bin/env node

/**
 * Mock Holochain Conductor for Testing
 * Simulates the Holochain WebSocket API for development
 */

const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

// Configuration
const ADMIN_PORT = 4444;
const APP_PORT = 4445;
const APP_ID = 'mycelix';
const AGENT_KEY = 'uhCAkJCz6Ni8tCqszc7Fb_Y4EQPqbK_Q5AmTYqGW9MFLz';

// In-memory storage
const storage = {
    hipiMessages: [],
    resonanceSignatures: new Map(),
    networkMetrics: [],
    agents: new Set([AGENT_KEY])
};

// Create HTTP server for health checks
const httpServer = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'healthy', 
            conductor: 'mock',
            app_id: APP_ID,
            agents: storage.agents.size 
        }));
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Admin WebSocket server (for managing apps)
const adminWss = new WebSocket.Server({ port: ADMIN_PORT });

adminWss.on('connection', (ws) => {
    console.log('Admin client connected');
    
    ws.on('message', (data) => {
        try {
            const request = JSON.parse(data.toString());
            console.log('Admin request:', request);
            
            // Mock admin responses
            const response = handleAdminRequest(request);
            ws.send(JSON.stringify(response));
        } catch (error) {
            console.error('Admin error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                data: error.message
            }));
        }
    });
});

// App WebSocket server (for zome calls)
const appWss = new WebSocket.Server({ port: APP_PORT });

appWss.on('connection', (ws) => {
    console.log('App client connected');
    
    // Send connection confirmation
    ws.send(JSON.stringify({
        type: 'connected',
        data: {
            app_id: APP_ID,
            agent_key: AGENT_KEY
        }
    }));
    
    ws.on('message', (data) => {
        try {
            const request = JSON.parse(data.toString());
            console.log('App request:', request);
            
            // Handle zome calls
            const response = handleZomeCall(request);
            ws.send(JSON.stringify(response));
            
            // Broadcast to other clients for certain calls
            if (request.data?.fn_name === 'send_hipi_message') {
                broadcastMessage(request, ws);
            }
        } catch (error) {
            console.error('App error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                data: error.message
            }));
        }
    });
});

// Handle admin API requests
function handleAdminRequest(request) {
    switch (request.type) {
        case 'list_apps':
            return {
                type: 'app_list',
                data: [{
                    app_id: APP_ID,
                    status: 'running',
                    agents: Array.from(storage.agents)
                }]
            };
            
        case 'install_app':
            return {
                type: 'app_installed',
                data: {
                    app_id: request.data.app_id || APP_ID,
                    success: true
                }
            };
            
        default:
            return {
                type: 'response',
                data: 'Admin operation completed'
            };
    }
}

// Handle zome function calls
function handleZomeCall(request) {
    const { fn_name, payload } = request.data || {};
    
    switch (fn_name) {
        case 'send_hipi_message':
            const messageHash = crypto.randomBytes(32).toString('hex');
            storage.hipiMessages.push({
                ...payload,
                hash: messageHash,
                timestamp: Date.now()
            });
            return {
                type: 'zome_call_response',
                data: messageHash
            };
            
        case 'update_resonance_signature':
            storage.resonanceSignatures.set(AGENT_KEY, payload.signature);
            // Find resonating peers
            const matches = [];
            storage.resonanceSignatures.forEach((sig, agent) => {
                if (agent !== AGENT_KEY) {
                    const score = calculateResonance(payload.signature, sig);
                    if (score > 0.8) {
                        matches.push({ agent, score });
                    }
                }
            });
            return {
                type: 'zome_call_response',
                data: {
                    hash: crypto.randomBytes(32).toString('hex'),
                    matches
                }
            };
            
        case 'get_messages_by_type':
            const filtered = storage.hipiMessages.filter(msg => 
                msg.message_type === payload.message_type
            );
            return {
                type: 'zome_call_response',
                data: filtered
            };
            
        case 'find_resonating_peers':
            const mySignature = storage.resonanceSignatures.get(AGENT_KEY);
            const peers = [];
            storage.resonanceSignatures.forEach((sig, agent) => {
                if (agent !== AGENT_KEY && mySignature) {
                    const score = calculateResonance(mySignature, sig);
                    if (score > payload.threshold) {
                        peers.push(agent);
                    }
                }
            });
            return {
                type: 'zome_call_response',
                data: peers
            };
            
        case 'record_network_metrics':
            storage.networkMetrics.push({
                ...payload,
                timestamp: Date.now()
            });
            return {
                type: 'zome_call_response',
                data: crypto.randomBytes(32).toString('hex')
            };
            
        case 'get_network_coherence':
            if (storage.networkMetrics.length === 0) {
                return {
                    type: 'zome_call_response',
                    data: 0.0
                };
            }
            const total = storage.networkMetrics.reduce((sum, m) => sum + m.coherence, 0);
            return {
                type: 'zome_call_response',
                data: total / storage.networkMetrics.length
            };
            
        default:
            return {
                type: 'zome_call_response',
                data: `Mock response for ${fn_name}`
            };
    }
}

// Broadcast message to all connected clients
function broadcastMessage(request, sender) {
    const message = {
        type: 'signal',
        data: {
            type: 'hipi_message_received',
            payload: request.data.payload
        }
    };
    
    appWss.clients.forEach((client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// Calculate resonance between signatures
function calculateResonance(sig1, sig2) {
    const s1 = parseInt(sig1, 16) || parseInt(sig1);
    const s2 = parseInt(sig2, 16) || parseInt(sig2);
    const diff = Math.abs(s1 - s2);
    const maxDiff = Number.MAX_SAFE_INTEGER;
    return 1.0 - (diff / maxDiff);
}

// Start HTTP server
httpServer.listen(4446, () => {
    console.log(`
╔════════════════════════════════════════╗
║   Mock Holochain Conductor Running! 🧬  ║
╠════════════════════════════════════════╣
║  Admin WS:  ws://localhost:${ADMIN_PORT}       ║
║  App WS:    ws://localhost:${APP_PORT}       ║
║  Health:    http://localhost:4446      ║
║  App ID:    ${APP_ID}                   ║
╚════════════════════════════════════════╝
    `);
    console.log('Mock conductor ready for testing');
    console.log('This simulates Holochain for development');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down mock conductor...');
    adminWss.close();
    appWss.close();
    httpServer.close();
    process.exit(0);
});