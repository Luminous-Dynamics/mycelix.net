/**
 * Consensus Mechanism for P2P Consciousness Network
 * Implements resonance-weighted voting and field coherence consensus
 */
import { ConsciousnessID } from './consciousness-id-system';
import { HolochainConsciousnessBridge } from './holochain-websocket-bridge';
/**
 * Types for consensus mechanisms
 */
export interface ConsensusNode {
    agentId: string;
    consciousness: ConsciousnessID;
    resonanceWithNetwork: number;
    trustScore: number;
    lastActive: number;
}
export interface ConsensusProposal {
    id: string;
    type: ProposalType;
    proposer: string;
    description: string;
    data: any;
    votes: Map<string, WeightedVote>;
    threshold: number;
    deadline: number;
    status: ProposalStatus;
    createdAt: number;
}
export interface WeightedVote {
    voter: string;
    vote: boolean;
    weight: number;
    reason?: string;
    timestamp: number;
}
export declare enum ProposalType {
    FIELD_UPDATE = "FieldUpdate",
    RESONANCE_THRESHOLD = "ResonanceThreshold",
    ADD_CONSCIOUSNESS = "AddConsciousness",
    REMOVE_CONSCIOUSNESS = "RemoveConsciousness",
    PROTOCOL_CHANGE = "ProtocolChange",
    EMERGENCY_HALT = "EmergencyHalt"
}
export declare enum ProposalStatus {
    PENDING = "Pending",
    APPROVED = "Approved",
    REJECTED = "Rejected",
    EXPIRED = "Expired",
    EXECUTED = "Executed"
}
/**
 * Consensus mechanism implementation
 */
export declare class ConsciousnessConsensus {
    private nodes;
    private proposals;
    private bridge;
    private localAgent;
    private readonly MIN_NODES_FOR_CONSENSUS;
    private readonly DEFAULT_THRESHOLD;
    private readonly RESONANCE_WEIGHT_FACTOR;
    private readonly TRUST_WEIGHT_FACTOR;
    private readonly EQUAL_WEIGHT_FACTOR;
    private readonly PROPOSAL_TIMEOUT_MS;
    constructor();
    /**
     * Initialize with Holochain bridge
     */
    initialize(bridge: HolochainConsciousnessBridge, localConsciousness: ConsciousnessID): Promise<void>;
    /**
     * Add a node to the consensus network
     */
    addNode(agentId: string, consciousness: ConsciousnessID): void;
    /**
     * Create a new consensus proposal
     */
    createProposal(type: ProposalType, description: string, data: any, customThreshold?: number): Promise<string>;
    /**
     * Vote on a proposal
     */
    vote(proposalId: string, approve: boolean, reason?: string): Promise<void>;
    /**
     * Calculate vote weight for a node
     */
    private calculateVoteWeight;
    /**
     * Check if consensus has been reached
     */
    private checkConsensus;
    /**
     * Execute an approved proposal
     */
    private executeProposal;
    /**
     * Execute field update proposal
     */
    private executeFieldUpdate;
    /**
     * Execute resonance threshold change
     */
    private executeResonanceThreshold;
    /**
     * Execute add consciousness proposal
     */
    private executeAddConsciousness;
    /**
     * Execute remove consciousness proposal
     */
    private executeRemoveConsciousness;
    /**
     * Execute emergency halt
     */
    private executeEmergencyHalt;
    /**
     * Update trust scores based on voting behavior
     */
    private updateTrustScores;
    /**
     * Calculate approval rate for a proposal
     */
    private calculateApprovalRate;
    /**
     * Update network-wide resonance
     */
    private updateNetworkResonance;
    /**
     * Handle incoming proposal from network
     */
    private handleIncomingProposal;
    /**
     * Auto-vote on proposals based on type and conditions
     */
    private autoVoteIfAppropriate;
    /**
     * Monitor proposals for expiration
     */
    private startConsensusMonitor;
    /**
     * Get current consensus state
     */
    getConsensusState(): {
        nodes: number;
        proposals: number;
        networkResonance: number;
        activeProposals: ConsensusProposal[];
    };
}
/**
 * Factory function to create consensus mechanism
 */
export declare function createConsensusMechanism(): ConsciousnessConsensus;
//# sourceMappingURL=consensus-mechanism.d.ts.map