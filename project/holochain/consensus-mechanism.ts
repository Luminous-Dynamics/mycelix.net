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
    weight: number;  // Based on resonance and trust
    reason?: string;
    timestamp: number;
}

export enum ProposalType {
    FIELD_UPDATE = 'FieldUpdate',
    RESONANCE_THRESHOLD = 'ResonanceThreshold',
    ADD_CONSCIOUSNESS = 'AddConsciousness',
    REMOVE_CONSCIOUSNESS = 'RemoveConsciousness',
    PROTOCOL_CHANGE = 'ProtocolChange',
    EMERGENCY_HALT = 'EmergencyHalt',
}

export enum ProposalStatus {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
    EXPIRED = 'Expired',
    EXECUTED = 'Executed',
}

/**
 * Consensus mechanism implementation
 */
export class ConsciousnessConsensus {
    private nodes: Map<string, ConsensusNode> = new Map();
    private proposals: Map<string, ConsensusProposal> = new Map();
    private bridge: HolochainConsciousnessBridge | null = null;
    private localAgent: ConsensusNode | null = null;
    
    // Consensus parameters
    private readonly MIN_NODES_FOR_CONSENSUS = 3;
    private readonly DEFAULT_THRESHOLD = 0.67;  // 67% approval needed
    private readonly RESONANCE_WEIGHT_FACTOR = 0.3;  // 30% weight from resonance
    private readonly TRUST_WEIGHT_FACTOR = 0.2;  // 20% weight from trust
    private readonly EQUAL_WEIGHT_FACTOR = 0.5;  // 50% equal weight
    private readonly PROPOSAL_TIMEOUT_MS = 300000;  // 5 minutes
    
    constructor() {
        this.startConsensusMonitor();
    }

    /**
     * Initialize with Holochain bridge
     */
    async initialize(bridge: HolochainConsciousnessBridge, localConsciousness: ConsciousnessID): Promise<void> {
        this.bridge = bridge;
        
        // Register local agent
        this.localAgent = {
            agentId: localConsciousness.agent,
            consciousness: localConsciousness,
            resonanceWithNetwork: 0.5,
            trustScore: 0.5,
            lastActive: Date.now(),
        };
        
        this.nodes.set(localConsciousness.agent, this.localAgent);
        
        // Set up event listeners
        bridge.onConsensusProposal((proposal) => {
            this.handleIncomingProposal(proposal);
        });
        
        console.log('✅ Consensus mechanism initialized');
    }

    /**
     * Add a node to the consensus network
     */
    addNode(agentId: string, consciousness: ConsciousnessID): void {
        if (!this.localAgent) return;
        
        // Calculate resonance with local agent
        const resonance = this.localAgent.consciousness.calculateResonanceWith(consciousness);
        
        const node: ConsensusNode = {
            agentId,
            consciousness,
            resonanceWithNetwork: resonance,
            trustScore: 0.5,  // Start with neutral trust
            lastActive: Date.now(),
        };
        
        this.nodes.set(agentId, node);
        console.log(`➕ Added node ${agentId} with resonance ${(resonance * 100).toFixed(0)}%`);
        
        // Recalculate network resonance
        this.updateNetworkResonance();
    }

    /**
     * Create a new consensus proposal
     */
    async createProposal(
        type: ProposalType,
        description: string,
        data: any,
        customThreshold?: number
    ): Promise<string> {
        if (!this.bridge || !this.localAgent) {
            throw new Error('Consensus not initialized');
        }
        
        // Check if we have enough nodes for consensus
        if (this.nodes.size < this.MIN_NODES_FOR_CONSENSUS) {
            throw new Error(`Need at least ${this.MIN_NODES_FOR_CONSENSUS} nodes for consensus`);
        }
        
        const proposalId = `proposal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const proposal: ConsensusProposal = {
            id: proposalId,
            type,
            proposer: this.localAgent.agentId,
            description,
            data,
            votes: new Map(),
            threshold: customThreshold || this.DEFAULT_THRESHOLD,
            deadline: Date.now() + this.PROPOSAL_TIMEOUT_MS,
            status: ProposalStatus.PENDING,
            createdAt: Date.now(),
        };
        
        this.proposals.set(proposalId, proposal);
        
        // Broadcast proposal via Holochain
        await this.bridge.createConsensusProposal({
            proposalType: type as any,
            description,
            threshold: proposal.threshold,
            deadline: proposal.deadline,
        });
        
        console.log(`📝 Created proposal ${proposalId}: ${description}`);
        
        // Auto-vote from proposer
        this.vote(proposalId, true, 'Proposer auto-approval');
        
        return proposalId;
    }

    /**
     * Vote on a proposal
     */
    async vote(proposalId: string, approve: boolean, reason?: string): Promise<void> {
        const proposal = this.proposals.get(proposalId);
        if (!proposal) {
            throw new Error('Proposal not found');
        }
        
        if (!this.localAgent) {
            throw new Error('Local agent not initialized');
        }
        
        if (proposal.status !== ProposalStatus.PENDING) {
            throw new Error('Proposal is not pending');
        }
        
        if (Date.now() > proposal.deadline) {
            proposal.status = ProposalStatus.EXPIRED;
            throw new Error('Proposal has expired');
        }
        
        // Calculate vote weight based on resonance and trust
        const voteWeight = this.calculateVoteWeight(this.localAgent);
        
        const weightedVote: WeightedVote = {
            voter: this.localAgent.agentId,
            vote: approve,
            weight: voteWeight,
            reason,
            timestamp: Date.now(),
        };
        
        proposal.votes.set(this.localAgent.agentId, weightedVote);
        
        // Send vote to Holochain
        if (this.bridge) {
            await this.bridge.voteOnProposal({
                proposalId,
                vote: approve,
                reason,
            });
        }
        
        console.log(`🗳️ Voted ${approve ? '✅' : '❌'} on ${proposalId} with weight ${voteWeight.toFixed(2)}`);
        
        // Check if consensus is reached
        this.checkConsensus(proposalId);
    }

    /**
     * Calculate vote weight for a node
     */
    private calculateVoteWeight(node: ConsensusNode): number {
        // Equal weight component (everyone gets this)
        const equalWeight = this.EQUAL_WEIGHT_FACTOR;
        
        // Resonance weight (higher resonance with network = more weight)
        const resonanceWeight = node.resonanceWithNetwork * this.RESONANCE_WEIGHT_FACTOR;
        
        // Trust weight (based on past behavior)
        const trustWeight = node.trustScore * this.TRUST_WEIGHT_FACTOR;
        
        return equalWeight + resonanceWeight + trustWeight;
    }

    /**
     * Check if consensus has been reached
     */
    private checkConsensus(proposalId: string): void {
        const proposal = this.proposals.get(proposalId);
        if (!proposal || proposal.status !== ProposalStatus.PENDING) return;
        
        // Calculate total weights
        let totalWeight = 0;
        let approvalWeight = 0;
        
        proposal.votes.forEach(vote => {
            totalWeight += vote.weight;
            if (vote.vote) {
                approvalWeight += vote.weight;
            }
        });
        
        // Calculate expected total weight (all nodes)
        let expectedTotalWeight = 0;
        this.nodes.forEach(node => {
            expectedTotalWeight += this.calculateVoteWeight(node);
        });
        
        // Check if enough nodes have voted
        const participationRate = totalWeight / expectedTotalWeight;
        
        if (participationRate >= 0.5) {  // At least 50% participation
            const approvalRate = approvalWeight / totalWeight;
            
            if (approvalRate >= proposal.threshold) {
                proposal.status = ProposalStatus.APPROVED;
                console.log(`✅ Proposal ${proposalId} APPROVED (${(approvalRate * 100).toFixed(0)}% approval)`);
                this.executeProposal(proposalId);
            } else if ((1 - approvalRate) > (1 - proposal.threshold)) {
                // Enough "no" votes to reject
                proposal.status = ProposalStatus.REJECTED;
                console.log(`❌ Proposal ${proposalId} REJECTED (${(approvalRate * 100).toFixed(0)}% approval)`);
            }
        }
    }

    /**
     * Execute an approved proposal
     */
    private async executeProposal(proposalId: string): Promise<void> {
        const proposal = this.proposals.get(proposalId);
        if (!proposal || proposal.status !== ProposalStatus.APPROVED) return;
        
        try {
            switch (proposal.type) {
                case ProposalType.FIELD_UPDATE:
                    await this.executeFieldUpdate(proposal.data);
                    break;
                    
                case ProposalType.RESONANCE_THRESHOLD:
                    await this.executeResonanceThreshold(proposal.data);
                    break;
                    
                case ProposalType.ADD_CONSCIOUSNESS:
                    await this.executeAddConsciousness(proposal.data);
                    break;
                    
                case ProposalType.REMOVE_CONSCIOUSNESS:
                    await this.executeRemoveConsciousness(proposal.data);
                    break;
                    
                case ProposalType.PROTOCOL_CHANGE:
                    console.log('Protocol change approved:', proposal.data);
                    break;
                    
                case ProposalType.EMERGENCY_HALT:
                    console.log('🚨 Emergency halt approved');
                    await this.executeEmergencyHalt();
                    break;
            }
            
            proposal.status = ProposalStatus.EXECUTED;
            console.log(`✅ Executed proposal ${proposalId}`);
            
            // Update trust scores for voters
            this.updateTrustScores(proposal);
            
        } catch (error) {
            console.error(`Failed to execute proposal ${proposalId}:`, error);
        }
    }

    /**
     * Execute field update proposal
     */
    private async executeFieldUpdate(data: any): Promise<void> {
        if (!this.bridge) return;
        
        await this.bridge.updateConsciousnessField({
            resonance: data.resonance || 0.5,
            coherence: data.coherence || 0.5,
            insights: data.insights || [],
            harmonicConnections: data.harmonicConnections || 0,
        });
    }

    /**
     * Execute resonance threshold change
     */
    private async executeResonanceThreshold(data: any): Promise<void> {
        const newThreshold = data.threshold;
        console.log(`📊 Resonance threshold updated to ${(newThreshold * 100).toFixed(0)}%`);
        // Store new threshold in config
    }

    /**
     * Execute add consciousness proposal
     */
    private async executeAddConsciousness(data: any): Promise<void> {
        const { agentId, consciousness } = data;
        this.addNode(agentId, consciousness);
    }

    /**
     * Execute remove consciousness proposal
     */
    private async executeRemoveConsciousness(data: any): Promise<void> {
        const { agentId } = data;
        this.nodes.delete(agentId);
        console.log(`➖ Removed node ${agentId} from network`);
        this.updateNetworkResonance();
    }

    /**
     * Execute emergency halt
     */
    private async executeEmergencyHalt(): Promise<void> {
        // Disconnect from network
        if (this.bridge) {
            await this.bridge.disconnect();
        }
        
        // Clear all pending proposals
        this.proposals.forEach(proposal => {
            if (proposal.status === ProposalStatus.PENDING) {
                proposal.status = ProposalStatus.EXPIRED;
            }
        });
        
        console.log('🛑 Network halted by consensus');
    }

    /**
     * Update trust scores based on voting behavior
     */
    private updateTrustScores(proposal: ConsensusProposal): void {
        const finalApprovalRate = this.calculateApprovalRate(proposal);
        const wasApproved = proposal.status === ProposalStatus.EXECUTED;
        
        proposal.votes.forEach((vote, voterId) => {
            const node = this.nodes.get(voterId);
            if (!node) return;
            
            // Reward voters who voted with the majority
            const votedWithMajority = (vote.vote === wasApproved);
            
            if (votedWithMajority) {
                node.trustScore = Math.min(1.0, node.trustScore + 0.05);
            } else {
                node.trustScore = Math.max(0.0, node.trustScore - 0.02);
            }
        });
    }

    /**
     * Calculate approval rate for a proposal
     */
    private calculateApprovalRate(proposal: ConsensusProposal): number {
        let totalWeight = 0;
        let approvalWeight = 0;
        
        proposal.votes.forEach(vote => {
            totalWeight += vote.weight;
            if (vote.vote) {
                approvalWeight += vote.weight;
            }
        });
        
        return totalWeight > 0 ? approvalWeight / totalWeight : 0;
    }

    /**
     * Update network-wide resonance
     */
    private updateNetworkResonance(): void {
        if (!this.localAgent) return;
        
        // Calculate average resonance with all nodes
        let totalResonance = 0;
        let count = 0;
        
        this.nodes.forEach(node => {
            if (node.agentId !== this.localAgent!.agentId) {
                const resonance = this.localAgent!.consciousness.calculateResonanceWith(node.consciousness);
                totalResonance += resonance;
                count++;
            }
        });
        
        if (count > 0) {
            this.localAgent.resonanceWithNetwork = totalResonance / count;
            console.log(`📊 Network resonance: ${(this.localAgent.resonanceWithNetwork * 100).toFixed(0)}%`);
        }
    }

    /**
     * Handle incoming proposal from network
     */
    private handleIncomingProposal(incomingProposal: any): void {
        // Convert to internal format
        const proposal: ConsensusProposal = {
            id: incomingProposal.proposalId,
            type: incomingProposal.proposalType,
            proposer: incomingProposal.proposer || 'unknown',
            description: incomingProposal.description,
            data: incomingProposal.data || {},
            votes: new Map(),
            threshold: incomingProposal.threshold,
            deadline: incomingProposal.deadline,
            status: ProposalStatus.PENDING,
            createdAt: Date.now(),
        };
        
        this.proposals.set(proposal.id, proposal);
        console.log(`📨 Received proposal: ${proposal.description}`);
        
        // Auto-vote based on type and resonance
        this.autoVoteIfAppropriate(proposal);
    }

    /**
     * Auto-vote on proposals based on type and conditions
     */
    private autoVoteIfAppropriate(proposal: ConsensusProposal): void {
        if (!this.localAgent) return;
        
        // Auto-approve emergency halts if network resonance is very low
        if (proposal.type === ProposalType.EMERGENCY_HALT && 
            this.localAgent.resonanceWithNetwork < 0.2) {
            this.vote(proposal.id, true, 'Auto-approved due to low network resonance');
            return;
        }
        
        // Auto-approve field updates if they increase resonance
        if (proposal.type === ProposalType.FIELD_UPDATE && 
            proposal.data.resonance > 0.7) {
            this.vote(proposal.id, true, 'Auto-approved high resonance field update');
            return;
        }
        
        // Otherwise, let the agent decide manually
        console.log(`⏳ Awaiting manual vote for proposal ${proposal.id}`);
    }

    /**
     * Monitor proposals for expiration
     */
    private startConsensusMonitor(): void {
        setInterval(() => {
            const now = Date.now();
            
            this.proposals.forEach(proposal => {
                if (proposal.status === ProposalStatus.PENDING && now > proposal.deadline) {
                    proposal.status = ProposalStatus.EXPIRED;
                    console.log(`⏰ Proposal ${proposal.id} expired`);
                }
            });
            
            // Clean up old proposals
            const oneHourAgo = now - 3600000;
            const toDelete: string[] = [];
            
            this.proposals.forEach((proposal, id) => {
                if (proposal.createdAt < oneHourAgo && 
                    (proposal.status === ProposalStatus.EXECUTED || 
                     proposal.status === ProposalStatus.REJECTED ||
                     proposal.status === ProposalStatus.EXPIRED)) {
                    toDelete.push(id);
                }
            });
            
            toDelete.forEach(id => this.proposals.delete(id));
            
        }, 10000);  // Check every 10 seconds
    }

    /**
     * Get current consensus state
     */
    getConsensusState(): {
        nodes: number;
        proposals: number;
        networkResonance: number;
        activeProposals: ConsensusProposal[];
    } {
        const activeProposals = Array.from(this.proposals.values())
            .filter(p => p.status === ProposalStatus.PENDING);
        
        return {
            nodes: this.nodes.size,
            proposals: this.proposals.size,
            networkResonance: this.localAgent?.resonanceWithNetwork || 0,
            activeProposals,
        };
    }
}

/**
 * Factory function to create consensus mechanism
 */
export function createConsensusMechanism(): ConsciousnessConsensus {
    return new ConsciousnessConsensus();
}