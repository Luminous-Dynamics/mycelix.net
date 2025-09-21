/**
 * WebSocket Bridge for Holochain Consciousness Network
 * Connects TypeScript consciousness system with Holochain conductor
 */
import { ConsciousnessID } from './consciousness-id-system';
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
export declare class HolochainConsciousnessBridge {
    private client;
    private wsConnection;
    private config;
    private localConsciousnessId;
    private resonanceListeners;
    private fieldListeners;
    private proposalListeners;
    constructor(config: HolochainConfig);
    /**
     * Connect to Holochain conductor
     */
    connect(): Promise<void>;
    /**
     * Set up WebSocket connection for real-time updates
     */
    private setupWebSocketConnection;
    /**
     * Handle incoming WebSocket messages
     */
    private handleWebSocketMessage;
    /**
     * Set up Holochain signal handlers
     */
    private setupSignalHandlers;
    /**
     * Register a consciousness ID in Holochain DHT
     */
    registerConsciousness(consciousnessId: ConsciousnessID): Promise<string>;
    /**
     * Calculate and record resonance with another consciousness
     */
    calculateAndRecordResonance(otherAgentId: string, otherConsciousness: ConsciousnessID): Promise<number>;
    /**
     * Update the shared consciousness field
     */
    updateConsciousnessField(update: ConsciousnessFieldUpdate): Promise<void>;
    /**
     * Get current consciousness field state from DHT
     */
    getConsciousnessField(): Promise<ConsciousnessFieldUpdate | null>;
    /**
     * Create a consensus proposal
     */
    createConsensusProposal(proposal: Omit<ConsensusProposal, 'proposalId'>): Promise<string>;
    /**
     * Vote on a consensus proposal
     */
    voteOnProposal(vote: ConsensusVote): Promise<void>;
    /**
     * Get resonance history from DHT
     */
    getResonanceHistory(): Promise<ResonanceEvent[]>;
    private handleResonanceUpdate;
    private handleFieldUpdate;
    private handleConsensusProposal;
    private handleNewConsciousness;
    private handleResonanceSignal;
    private handleFieldUpdateSignal;
    onResonanceUpdate(agentId: string, listener: (event: ResonanceEvent) => void): void;
    onFieldUpdate(listener: (field: ConsciousnessFieldUpdate) => void): void;
    onConsensusProposal(listener: (proposal: ConsensusProposal) => void): void;
    /**
     * Disconnect from Holochain
     */
    disconnect(): Promise<void>;
}
/**
 * Factory function to create and initialize bridge
 */
export declare function createHolochainBridge(config: HolochainConfig): Promise<HolochainConsciousnessBridge>;
export {};
//# sourceMappingURL=holochain-websocket-bridge.d.ts.map