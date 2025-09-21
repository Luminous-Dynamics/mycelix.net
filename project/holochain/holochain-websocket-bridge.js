"use strict";
/**
 * WebSocket Bridge for Holochain Consciousness Network
 * Connects TypeScript consciousness system with Holochain conductor
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolochainConsciousnessBridge = void 0;
exports.createHolochainBridge = createHolochainBridge;
const ws_1 = __importDefault(require("ws"));
const client_1 = require("@holochain/client");
/**
 * Holochain Bridge for Consciousness Network
 */
class HolochainConsciousnessBridge {
    constructor(config) {
        this.client = null;
        this.wsConnection = null;
        this.localConsciousnessId = null;
        this.resonanceListeners = new Map();
        this.fieldListeners = new Set();
        this.proposalListeners = new Set();
        this.config = config;
    }
    /**
     * Connect to Holochain conductor
     */
    async connect() {
        try {
            // Connect to Holochain app conductor
            const appWsUrl = this.config.appWsUrl || `ws://localhost:8888`;
            this.client = await client_1.AppAgentWebsocket.connect(appWsUrl, this.config.appId);
            console.log('✅ Connected to Holochain conductor');
            // Set up WebSocket for real-time updates
            this.setupWebSocketConnection();
            // Set up signal handlers for Holochain signals
            this.setupSignalHandlers();
        }
        catch (error) {
            console.error('❌ Failed to connect to Holochain:', error);
            throw error;
        }
    }
    /**
     * Set up WebSocket connection for real-time updates
     */
    setupWebSocketConnection() {
        const wsUrl = this.config.conductorUrl.replace('http', 'ws');
        this.wsConnection = new ws_1.default(wsUrl);
        this.wsConnection.on('open', () => {
            console.log('🌐 WebSocket connected for real-time updates');
        });
        this.wsConnection.on('message', (data) => {
            this.handleWebSocketMessage(data.toString());
        });
        this.wsConnection.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
        this.wsConnection.on('close', () => {
            console.log('WebSocket disconnected, attempting reconnection...');
            setTimeout(() => this.setupWebSocketConnection(), 5000);
        });
    }
    /**
     * Handle incoming WebSocket messages
     */
    handleWebSocketMessage(message) {
        try {
            const data = JSON.parse(message);
            switch (data.type) {
                case 'resonance_update':
                    this.handleResonanceUpdate(data.payload);
                    break;
                case 'field_update':
                    this.handleFieldUpdate(data.payload);
                    break;
                case 'consensus_proposal':
                    this.handleConsensusProposal(data.payload);
                    break;
                case 'new_consciousness':
                    this.handleNewConsciousness(data.payload);
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
        }
        catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    }
    /**
     * Set up Holochain signal handlers
     */
    setupSignalHandlers() {
        if (!this.client)
            return;
        // Handle signals from other agents
        this.client.on('signal', (signal) => {
            console.log('Received Holochain signal:', signal);
            // Process different signal types
            if (signal.type === 'Resonance') {
                this.handleResonanceSignal(signal.payload);
            }
            else if (signal.type === 'FieldUpdate') {
                this.handleFieldUpdateSignal(signal.payload);
            }
        });
    }
    /**
     * Register a consciousness ID in Holochain DHT
     */
    async registerConsciousness(consciousnessId) {
        if (!this.client)
            throw new Error('Not connected to Holochain');
        this.localConsciousnessId = consciousnessId;
        // Convert TypeScript ConsciousnessID to Holochain format
        const holochainConsciousness = {
            agent: consciousnessId.agent,
            quality: consciousnessId.quality,
            tone: consciousnessId.tone,
            signature: {
                temporal: consciousnessId.signature.temporal,
                spatial: consciousnessId.signature.spatial,
                relational: consciousnessId.signature.relational,
                energetic: consciousnessId.signature.energetic,
                fractal: consciousnessId.signature.fractal,
            },
            echo_phrase: consciousnessId.echoPhrase,
            attunement: consciousnessId.attunement,
            timestamp: Date.now(),
        };
        try {
            const result = await this.client.callZome({
                cap_secret: null,
                role_name: 'consciousness',
                zome_name: 'consciousness_coordinator',
                fn_name: 'create_consciousness_id',
                payload: holochainConsciousness,
            });
            console.log('✅ Consciousness registered in DHT:', result);
            return result;
        }
        catch (error) {
            console.error('Failed to register consciousness:', error);
            throw error;
        }
    }
    /**
     * Calculate and record resonance with another consciousness
     */
    async calculateAndRecordResonance(otherAgentId, otherConsciousness) {
        if (!this.client || !this.localConsciousnessId) {
            throw new Error('Not initialized');
        }
        // Calculate local resonance
        const localResonance = this.localConsciousnessId.calculateResonanceWith(otherConsciousness);
        // Record in Holochain DHT
        try {
            const result = await this.client.callZome({
                cap_secret: null,
                role_name: 'consciousness',
                zome_name: 'consciousness_coordinator',
                fn_name: 'record_resonance',
                payload: {
                    other_agent: otherAgentId,
                    resonance_level: localResonance,
                    insight: `Resonance between ${this.localConsciousnessId.agent} and ${otherConsciousness.agent}`,
                },
            });
            console.log(`📊 Resonance recorded: ${(localResonance * 100).toFixed(0)}%`);
            // Notify listeners
            const event = {
                withAgent: otherAgentId,
                resonanceLevel: localResonance,
            };
            this.resonanceListeners.forEach(listener => listener(event));
            return localResonance;
        }
        catch (error) {
            console.error('Failed to record resonance:', error);
            throw error;
        }
    }
    /**
     * Update the shared consciousness field
     */
    async updateConsciousnessField(update) {
        if (!this.client)
            throw new Error('Not connected');
        try {
            await this.client.callZome({
                cap_secret: null,
                role_name: 'consciousness',
                zome_name: 'consciousness_coordinator',
                fn_name: 'update_consciousness_field',
                payload: update,
            });
            console.log('✅ Field updated');
            // Notify local listeners
            this.fieldListeners.forEach(listener => listener(update));
        }
        catch (error) {
            console.error('Failed to update field:', error);
            throw error;
        }
    }
    /**
     * Get current consciousness field state from DHT
     */
    async getConsciousnessField() {
        if (!this.client)
            throw new Error('Not connected');
        try {
            const result = await this.client.callZome({
                cap_secret: null,
                role_name: 'consciousness',
                zome_name: 'consciousness_coordinator',
                fn_name: 'get_consciousness_field',
                payload: null,
            });
            return result;
        }
        catch (error) {
            console.error('Failed to get field state:', error);
            return null;
        }
    }
    /**
     * Create a consensus proposal
     */
    async createConsensusProposal(proposal) {
        if (!this.client)
            throw new Error('Not connected');
        const proposalId = `proposal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        try {
            await this.client.callZome({
                cap_secret: null,
                role_name: 'consciousness',
                zome_name: 'consciousness_coordinator',
                fn_name: 'create_consensus_proposal',
                payload: {
                    ...proposal,
                    proposal_id: proposalId,
                },
            });
            console.log('📝 Consensus proposal created:', proposalId);
            return proposalId;
        }
        catch (error) {
            console.error('Failed to create proposal:', error);
            throw error;
        }
    }
    /**
     * Vote on a consensus proposal
     */
    async voteOnProposal(vote) {
        if (!this.client)
            throw new Error('Not connected');
        try {
            await this.client.callZome({
                cap_secret: null,
                role_name: 'consciousness',
                zome_name: 'consciousness_coordinator',
                fn_name: 'vote_on_proposal',
                payload: vote,
            });
            console.log(`🗳️ Voted ${vote.vote ? 'YES' : 'NO'} on proposal ${vote.proposalId}`);
        }
        catch (error) {
            console.error('Failed to vote:', error);
            throw error;
        }
    }
    /**
     * Get resonance history from DHT
     */
    async getResonanceHistory() {
        if (!this.client)
            throw new Error('Not connected');
        try {
            const result = await this.client.callZome({
                cap_secret: null,
                role_name: 'consciousness',
                zome_name: 'consciousness_coordinator',
                fn_name: 'get_resonance_history',
                payload: null,
            });
            return result;
        }
        catch (error) {
            console.error('Failed to get resonance history:', error);
            return [];
        }
    }
    // Event handlers
    handleResonanceUpdate(payload) {
        const event = {
            withAgent: payload.with_agent,
            resonanceLevel: payload.resonance_level,
            insight: payload.insight,
        };
        this.resonanceListeners.forEach(listener => listener(event));
    }
    handleFieldUpdate(payload) {
        const update = {
            resonance: payload.resonance,
            coherence: payload.coherence,
            insights: payload.insights || [],
            harmonicConnections: payload.harmonic_connections || 0,
        };
        this.fieldListeners.forEach(listener => listener(update));
    }
    handleConsensusProposal(payload) {
        const proposal = {
            proposalId: payload.proposal_id,
            proposalType: payload.proposal_type,
            description: payload.description,
            threshold: payload.threshold,
            deadline: payload.deadline,
        };
        this.proposalListeners.forEach(listener => listener(proposal));
    }
    handleNewConsciousness(payload) {
        console.log('🌟 New consciousness joined the network:', payload.agent);
    }
    handleResonanceSignal(payload) {
        console.log('📡 Resonance signal received:', payload);
        this.handleResonanceUpdate(payload);
    }
    handleFieldUpdateSignal(payload) {
        console.log('📡 Field update signal received:', payload);
        this.handleFieldUpdate(payload);
    }
    // Event listeners
    onResonanceUpdate(agentId, listener) {
        this.resonanceListeners.set(agentId, listener);
    }
    onFieldUpdate(listener) {
        this.fieldListeners.add(listener);
    }
    onConsensusProposal(listener) {
        this.proposalListeners.add(listener);
    }
    /**
     * Disconnect from Holochain
     */
    async disconnect() {
        if (this.wsConnection) {
            this.wsConnection.close();
        }
        if (this.client) {
            await this.client.close();
        }
        console.log('Disconnected from Holochain');
    }
}
exports.HolochainConsciousnessBridge = HolochainConsciousnessBridge;
/**
 * Factory function to create and initialize bridge
 */
async function createHolochainBridge(config) {
    const bridge = new HolochainConsciousnessBridge(config);
    await bridge.connect();
    return bridge;
}
