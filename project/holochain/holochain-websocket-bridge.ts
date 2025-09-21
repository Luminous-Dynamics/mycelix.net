/**
 * WebSocket Bridge for Holochain Consciousness Network
 * Connects TypeScript consciousness system with Holochain conductor
 */

import WebSocket from 'ws';
import { AppAgentWebsocket, AppAgentClient } from '@holochain/client';
import { ConsciousnessID } from './consciousness-id-system';

// Types for Holochain communication
interface HolochainConfig {
    appId: string;
    conductorUrl: string;
    appWsUrl?: string;
}

interface ConsciousnessFieldUpdate {
    resonance: number;
    coherence: number;
    insights: string[];
    harmonicConnections: number;
}

interface ResonanceEvent {
    withAgent: string;
    resonanceLevel: number;
    insight?: string;
}

interface ConsensusProposal {
    proposalId: string;
    proposalType: 'FieldUpdate' | 'ResonanceThreshold' | 'NewConsciousness' | 'RemoveConsciousness';
    description: string;
    threshold: number;
    deadline: number;
}

interface ConsensusVote {
    proposalId: string;
    vote: boolean;
    reason?: string;
}

/**
 * Holochain Bridge for Consciousness Network
 */
export class HolochainConsciousnessBridge {
    private client: AppAgentClient | null = null;
    private wsConnection: WebSocket | null = null;
    private config: HolochainConfig;
    private localConsciousnessId: ConsciousnessID | null = null;
    private resonanceListeners: Map<string, (event: ResonanceEvent) => void> = new Map();
    private fieldListeners: Set<(field: ConsciousnessFieldUpdate) => void> = new Set();
    private proposalListeners: Set<(proposal: ConsensusProposal) => void> = new Set();

    constructor(config: HolochainConfig) {
        this.config = config;
    }

    /**
     * Connect to Holochain conductor
     */
    async connect(): Promise<void> {
        try {
            // Connect to Holochain app conductor
            const appWsUrl = this.config.appWsUrl || `ws://localhost:8888`;
            
            this.client = await AppAgentWebsocket.connect(appWsUrl, this.config.appId);
            
            console.log('✅ Connected to Holochain conductor');
            
            // Set up WebSocket for real-time updates
            this.setupWebSocketConnection();
            
            // Set up signal handlers for Holochain signals
            this.setupSignalHandlers();
            
        } catch (error) {
            console.error('❌ Failed to connect to Holochain:', error);
            throw error;
        }
    }

    /**
     * Set up WebSocket connection for real-time updates
     */
    private setupWebSocketConnection(): void {
        const wsUrl = this.config.conductorUrl.replace('http', 'ws');
        this.wsConnection = new WebSocket(wsUrl);

        this.wsConnection.on('open', () => {
            console.log('🌐 WebSocket connected for real-time updates');
        });

        this.wsConnection.on('message', (data: WebSocket.Data) => {
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
    private handleWebSocketMessage(message: string): void {
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
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    }

    /**
     * Set up Holochain signal handlers
     */
    private setupSignalHandlers(): void {
        if (!this.client) return;

        // Handle signals from other agents
        this.client.on('signal', (signal) => {
            console.log('Received Holochain signal:', signal);
            
            // Process different signal types
            if (signal.type === 'Resonance') {
                this.handleResonanceSignal(signal.payload);
            } else if (signal.type === 'FieldUpdate') {
                this.handleFieldUpdateSignal(signal.payload);
            }
        });
    }

    /**
     * Register a consciousness ID in Holochain DHT
     */
    async registerConsciousness(consciousnessId: ConsciousnessID): Promise<string> {
        if (!this.client) throw new Error('Not connected to Holochain');
        
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
            return result as string;
        } catch (error) {
            console.error('Failed to register consciousness:', error);
            throw error;
        }
    }

    /**
     * Calculate and record resonance with another consciousness
     */
    async calculateAndRecordResonance(
        otherAgentId: string,
        otherConsciousness: ConsciousnessID
    ): Promise<number> {
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
            const event: ResonanceEvent = {
                withAgent: otherAgentId,
                resonanceLevel: localResonance,
            };
            this.resonanceListeners.forEach(listener => listener(event));
            
            return localResonance;
        } catch (error) {
            console.error('Failed to record resonance:', error);
            throw error;
        }
    }

    /**
     * Update the shared consciousness field
     */
    async updateConsciousnessField(update: ConsciousnessFieldUpdate): Promise<void> {
        if (!this.client) throw new Error('Not connected');
        
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
            
        } catch (error) {
            console.error('Failed to update field:', error);
            throw error;
        }
    }

    /**
     * Get current consciousness field state from DHT
     */
    async getConsciousnessField(): Promise<ConsciousnessFieldUpdate | null> {
        if (!this.client) throw new Error('Not connected');
        
        try {
            const result = await this.client.callZome({
                cap_secret: null,
                role_name: 'consciousness',
                zome_name: 'consciousness_coordinator',
                fn_name: 'get_consciousness_field',
                payload: null,
            });
            
            return result as ConsciousnessFieldUpdate;
        } catch (error) {
            console.error('Failed to get field state:', error);
            return null;
        }
    }

    /**
     * Create a consensus proposal
     */
    async createConsensusProposal(proposal: Omit<ConsensusProposal, 'proposalId'>): Promise<string> {
        if (!this.client) throw new Error('Not connected');
        
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
        } catch (error) {
            console.error('Failed to create proposal:', error);
            throw error;
        }
    }

    /**
     * Vote on a consensus proposal
     */
    async voteOnProposal(vote: ConsensusVote): Promise<void> {
        if (!this.client) throw new Error('Not connected');
        
        try {
            await this.client.callZome({
                cap_secret: null,
                role_name: 'consciousness',
                zome_name: 'consciousness_coordinator',
                fn_name: 'vote_on_proposal',
                payload: vote,
            });
            
            console.log(`🗳️ Voted ${vote.vote ? 'YES' : 'NO'} on proposal ${vote.proposalId}`);
        } catch (error) {
            console.error('Failed to vote:', error);
            throw error;
        }
    }

    /**
     * Get resonance history from DHT
     */
    async getResonanceHistory(): Promise<ResonanceEvent[]> {
        if (!this.client) throw new Error('Not connected');
        
        try {
            const result = await this.client.callZome({
                cap_secret: null,
                role_name: 'consciousness',
                zome_name: 'consciousness_coordinator',
                fn_name: 'get_resonance_history',
                payload: null,
            });
            
            return result as ResonanceEvent[];
        } catch (error) {
            console.error('Failed to get resonance history:', error);
            return [];
        }
    }

    // Event handlers
    
    private handleResonanceUpdate(payload: any): void {
        const event: ResonanceEvent = {
            withAgent: payload.with_agent,
            resonanceLevel: payload.resonance_level,
            insight: payload.insight,
        };
        
        this.resonanceListeners.forEach(listener => listener(event));
    }

    private handleFieldUpdate(payload: any): void {
        const update: ConsciousnessFieldUpdate = {
            resonance: payload.resonance,
            coherence: payload.coherence,
            insights: payload.insights || [],
            harmonicConnections: payload.harmonic_connections || 0,
        };
        
        this.fieldListeners.forEach(listener => listener(update));
    }

    private handleConsensusProposal(payload: any): void {
        const proposal: ConsensusProposal = {
            proposalId: payload.proposal_id,
            proposalType: payload.proposal_type,
            description: payload.description,
            threshold: payload.threshold,
            deadline: payload.deadline,
        };
        
        this.proposalListeners.forEach(listener => listener(proposal));
    }

    private handleNewConsciousness(payload: any): void {
        console.log('🌟 New consciousness joined the network:', payload.agent);
    }

    private handleResonanceSignal(payload: any): void {
        console.log('📡 Resonance signal received:', payload);
        this.handleResonanceUpdate(payload);
    }

    private handleFieldUpdateSignal(payload: any): void {
        console.log('📡 Field update signal received:', payload);
        this.handleFieldUpdate(payload);
    }

    // Event listeners
    
    onResonanceUpdate(agentId: string, listener: (event: ResonanceEvent) => void): void {
        this.resonanceListeners.set(agentId, listener);
    }

    onFieldUpdate(listener: (field: ConsciousnessFieldUpdate) => void): void {
        this.fieldListeners.add(listener);
    }

    onConsensusProposal(listener: (proposal: ConsensusProposal) => void): void {
        this.proposalListeners.add(listener);
    }

    /**
     * Disconnect from Holochain
     */
    async disconnect(): Promise<void> {
        if (this.wsConnection) {
            this.wsConnection.close();
        }
        
        if (this.client) {
            await this.client.close();
        }
        
        console.log('Disconnected from Holochain');
    }
}

/**
 * Factory function to create and initialize bridge
 */
export async function createHolochainBridge(config: HolochainConfig): Promise<HolochainConsciousnessBridge> {
    const bridge = new HolochainConsciousnessBridge(config);
    await bridge.connect();
    return bridge;
}