/**
 * Bridge between existing WebRTC UI and new Holochain backend
 * This allows gradual migration from WebRTC to Holochain
 */

class MycelixBridge {
    constructor() {
        this.webrtcPeers = new Map();
        this.holochainClient = null;
        this.gatewayWs = null;
        this.resonanceSignature = null;
        this.isConnected = false;
    }
    
    /**
     * Initialize bridge to both WebRTC and Holochain
     */
    async init() {
        console.log('🌉 Initializing Mycelix Bridge...');
        
        // Connect to Rust gateway for Holochain
        await this.connectToGateway();
        
        // Set up WebRTC peer discovery (existing code)
        this.setupWebRTC();
        
        // Start syncing between networks
        this.startNetworkSync();
        
        console.log('✅ Bridge initialized successfully');
    }
    
    /**
     * Connect to Rust gateway
     */
    async connectToGateway() {
        return new Promise((resolve, reject) => {
            this.gatewayWs = new WebSocket('ws://localhost:8765/ws');
            
            this.gatewayWs.onopen = () => {
                this.isConnected = true;
                console.log('🍄 Connected to Holochain gateway');
                
                // Authenticate if we have an agent key
                const agentKey = localStorage.getItem('holochain_agent_key');
                if (agentKey) {
                    this.authenticate(agentKey);
                }
                
                resolve();
            };
            
            this.gatewayWs.onmessage = (event) => {
                this.handleGatewayMessage(JSON.parse(event.data));
            };
            
            this.gatewayWs.onerror = (error) => {
                console.error('Gateway error:', error);
                reject(error);
            };
        });
    }
    
    /**
     * Set up WebRTC connections (integrate with existing code)
     */
    setupWebRTC() {
        // This would integrate with your existing WebRTC setup
        // For now, we'll create a simple peer management system
        
        if (window.SimplePeer) {
            // Hook into existing SimplePeer events
            this.interceptWebRTCMessages();
        }
    }
    
    /**
     * Intercept WebRTC messages and forward to Holochain
     */
    interceptWebRTCMessages() {
        const originalSend = window.SimplePeer.prototype.send;
        const self = this;
        
        window.SimplePeer.prototype.send = function(data) {
            // Call original WebRTC send
            originalSend.call(this, data);
            
            // Also send through Holochain if it's a HIPI message
            if (self.isHipiMessage(data)) {
                self.sendToHolochain(data);
            }
        };
    }
    
    /**
     * Check if data is a HIPI protocol message
     */
    isHipiMessage(data) {
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            return parsed.type === 'hipi' || parsed.protocol === 'hipi/1.0';
        } catch {
            return false;
        }
    }
    
    /**
     * Send message through Holochain
     */
    sendToHolochain(data) {
        if (!this.isConnected || !this.gatewayWs) return;
        
        const message = {
            type: 'SendHipi',
            content: typeof data === 'string' ? data : JSON.stringify(data),
            target: { type: 'Broadcast' } // Broadcast by default
        };
        
        this.gatewayWs.send(JSON.stringify(message));
    }
    
    /**
     * Handle messages from Holochain gateway
     */
    handleGatewayMessage(message) {
        switch (message.type) {
            case 'HipiReceived':
                this.handleHolochainMessage(message);
                break;
                
            case 'FieldUpdate':
                this.updateNetworkMetrics(message.measurement);
                break;
                
            case 'ResonanceMatches':
                this.handleResonanceMatches(message.matches);
                break;
        }
    }
    
    /**
     * Handle HIPI message from Holochain
     */
    handleHolochainMessage(message) {
        // Forward to WebRTC peers if not already received
        const messageId = this.getMessageId(message);
        
        if (!this.receivedMessages.has(messageId)) {
            this.receivedMessages.add(messageId);
            
            // Forward to all WebRTC peers
            this.webrtcPeers.forEach(peer => {
                if (peer.connected) {
                    peer.send(JSON.stringify({
                        type: 'hipi',
                        source: 'holochain',
                        ...message
                    }));
                }
            });
            
            // Update UI
            this.displayMessage(message);
        }
    }
    
    /**
     * Update network metrics in UI
     */
    updateNetworkMetrics(measurement) {
        // Update existing UI elements with Holochain metrics
        const metrics = measurement.network_metrics;
        
        // Update latency display
        const latencyEl = document.querySelector('.latency-value');
        if (latencyEl) {
            latencyEl.textContent = `${metrics.latency_ms.toFixed(1)}ms`;
        }
        
        // Update bandwidth display
        const bandwidthEl = document.querySelector('.bandwidth-value');
        if (bandwidthEl) {
            bandwidthEl.textContent = `${metrics.bandwidth_kbps} Kbps`;
        }
        
        // Update connection count
        const connectionsEl = document.querySelector('.connections-value');
        if (connectionsEl) {
            connectionsEl.textContent = metrics.connection_count;
        }
        
        // Store for resonance calculation
        this.lastMetrics = metrics;
    }
    
    /**
     * Handle resonance matches from Holochain
     */
    handleResonanceMatches(matches) {
        console.log(`🎵 Found ${matches.length} resonance matches`);
        
        // Prioritize connections to resonating peers
        matches.forEach(match => {
            if (match.match_score > 0.8) {
                // Attempt direct WebRTC connection to resonating peer
                this.connectToResonatingPeer(match.signature);
            }
        });
    }
    
    /**
     * Start syncing between WebRTC and Holochain networks
     */
    startNetworkSync() {
        // Sync network state every 30 seconds
        setInterval(() => {
            this.syncNetworkState();
        }, 30000);
        
        // Update resonance signature every minute
        setInterval(() => {
            this.updateResonanceSignature();
        }, 60000);
    }
    
    /**
     * Sync state between networks
     */
    syncNetworkState() {
        if (!this.isConnected) return;
        
        // Request field measurement
        this.gatewayWs.send(JSON.stringify({ type: 'MeasureField' }));
        
        // Count WebRTC peers
        const webrtcPeerCount = Array.from(this.webrtcPeers.values())
            .filter(p => p.connected).length;
        
        // Send WebRTC metrics to Holochain
        if (webrtcPeerCount > 0) {
            const state = {
                webrtc_peers: webrtcPeerCount,
                messages_relayed: this.messageCount || 0,
                timestamp: Date.now()
            };
            
            this.gatewayWs.send(JSON.stringify({
                type: 'SyncState',
                state_type: 'webrtc_bridge',
                data: Array.from(new TextEncoder().encode(JSON.stringify(state)))
            }));
        }
    }
    
    /**
     * Calculate and update resonance signature
     */
    updateResonanceSignature() {
        // Calculate activity pattern from user behavior
        const pattern = this.calculateActivityPattern();
        const signature = this.patternToSignature(pattern);
        
        if (signature !== this.resonanceSignature) {
            this.resonanceSignature = signature;
            
            // Update Holochain
            if (this.isConnected) {
                this.gatewayWs.send(JSON.stringify({
                    type: 'UpdateResonance',
                    signature: signature.toString()
                }));
            }
            
            // Update UI
            this.displayResonanceSignature(signature);
        }
    }
    
    /**
     * Calculate activity pattern from user behavior
     */
    calculateActivityPattern() {
        const pattern = new Array(16).fill(0);
        
        // Message frequency
        const messagesPerHour = (this.messageCount || 0) / 
            Math.max(1, (Date.now() - this.startTime) / 3600000);
        pattern[0] = Math.min(messagesPerHour / 100, 1);
        
        // Active hours
        const hour = new Date().getHours();
        pattern[1] = hour / 24;
        
        // Connection count
        const connections = this.webrtcPeers.size + (this.isConnected ? 1 : 0);
        pattern[2] = Math.min(connections / 10, 1);
        
        // Network quality
        if (this.lastMetrics) {
            pattern[3] = 1 - Math.min(this.lastMetrics.latency_ms / 500, 1);
            pattern[4] = Math.min(this.lastMetrics.bandwidth_kbps / 10000, 1);
        }
        
        // Add some randomness for uniqueness
        for (let i = 5; i < 16; i++) {
            pattern[i] = Math.random() * 0.5;
        }
        
        return pattern;
    }
    
    /**
     * Convert activity pattern to resonance signature
     */
    patternToSignature(pattern) {
        let signature = 0n;
        
        for (let i = 0; i < Math.min(pattern.length, 16); i++) {
            const normalized = Math.floor(pattern[i] * 15);
            signature |= BigInt(normalized) << BigInt(i * 4);
        }
        
        return signature;
    }
    
    /**
     * Display resonance signature in UI
     */
    displayResonanceSignature(signature) {
        const formatted = signature.toString(16).toUpperCase()
            .padStart(16, '0').match(/.{4}/g).join('-');
        
        const signatureEl = document.querySelector('.resonance-signature');
        if (signatureEl) {
            signatureEl.textContent = formatted;
            signatureEl.style.textShadow = '0 0 10px #00ffff';
        }
    }
    
    /**
     * Display message in UI
     */
    displayMessage(message) {
        const messagesContainer = document.querySelector('.messages');
        if (!messagesContainer) return;
        
        const messageEl = document.createElement('div');
        messageEl.className = 'message holochain-message';
        messageEl.innerHTML = `
            <div class="message-header">
                <span class="sender">${message.from || 'Unknown'}</span>
                <span class="timestamp">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="message-content">${message.content}</div>
        `;
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Tracking
    messageCount = 0;
    startTime = Date.now();
    receivedMessages = new Set();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mycelixBridge = new MycelixBridge();
        window.mycelixBridge.init().catch(console.error);
    });
} else {
    window.mycelixBridge = new MycelixBridge();
    window.mycelixBridge.init().catch(console.error);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MycelixBridge;
}