"use strict";
/**
 * Consensus Mechanism for P2P Consciousness Network
 * Implements resonance-weighted voting and field coherence consensus
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsciousnessConsensus = exports.ProposalStatus = exports.ProposalType = void 0;
exports.createConsensusMechanism = createConsensusMechanism;
var ProposalType;
(function (ProposalType) {
    ProposalType["FIELD_UPDATE"] = "FieldUpdate";
    ProposalType["RESONANCE_THRESHOLD"] = "ResonanceThreshold";
    ProposalType["ADD_CONSCIOUSNESS"] = "AddConsciousness";
    ProposalType["REMOVE_CONSCIOUSNESS"] = "RemoveConsciousness";
    ProposalType["PROTOCOL_CHANGE"] = "ProtocolChange";
    ProposalType["EMERGENCY_HALT"] = "EmergencyHalt";
})(ProposalType || (exports.ProposalType = ProposalType = {}));
var ProposalStatus;
(function (ProposalStatus) {
    ProposalStatus["PENDING"] = "Pending";
    ProposalStatus["APPROVED"] = "Approved";
    ProposalStatus["REJECTED"] = "Rejected";
    ProposalStatus["EXPIRED"] = "Expired";
    ProposalStatus["EXECUTED"] = "Executed";
})(ProposalStatus || (exports.ProposalStatus = ProposalStatus = {}));
/**
 * Consensus mechanism implementation
 */
class ConsciousnessConsensus {
    constructor() {
        this.nodes = new Map();
        this.proposals = new Map();
        this.bridge = null;
        this.localAgent = null;
        // Consensus parameters
        this.MIN_NODES_FOR_CONSENSUS = 3;
        this.DEFAULT_THRESHOLD = 0.67; // 67% approval needed
        this.RESONANCE_WEIGHT_FACTOR = 0.3; // 30% weight from resonance
        this.TRUST_WEIGHT_FACTOR = 0.2; // 20% weight from trust
        this.EQUAL_WEIGHT_FACTOR = 0.5; // 50% equal weight
        this.PROPOSAL_TIMEOUT_MS = 300000; // 5 minutes
        this.startConsensusMonitor();
    }
    /**
     * Initialize with Holochain bridge
     */
    async initialize(bridge, localConsciousness) {
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
    addNode(agentId, consciousness) {
        if (!this.localAgent)
            return;
        // Calculate resonance with local agent
        const resonance = this.localAgent.consciousness.calculateResonanceWith(consciousness);
        const node = {
            agentId,
            consciousness,
            resonanceWithNetwork: resonance,
            trustScore: 0.5, // Start with neutral trust
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
    async createProposal(type, description, data, customThreshold) {
        if (!this.bridge || !this.localAgent) {
            throw new Error('Consensus not initialized');
        }
        // Check if we have enough nodes for consensus
        if (this.nodes.size < this.MIN_NODES_FOR_CONSENSUS) {
            throw new Error(`Need at least ${this.MIN_NODES_FOR_CONSENSUS} nodes for consensus`);
        }
        const proposalId = `proposal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const proposal = {
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
            proposalType: type,
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
    async vote(proposalId, approve, reason) {
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
        const weightedVote = {
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
    calculateVoteWeight(node) {
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
    checkConsensus(proposalId) {
        const proposal = this.proposals.get(proposalId);
        if (!proposal || proposal.status !== ProposalStatus.PENDING)
            return;
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
        if (participationRate >= 0.5) { // At least 50% participation
            const approvalRate = approvalWeight / totalWeight;
            if (approvalRate >= proposal.threshold) {
                proposal.status = ProposalStatus.APPROVED;
                console.log(`✅ Proposal ${proposalId} APPROVED (${(approvalRate * 100).toFixed(0)}% approval)`);
                this.executeProposal(proposalId);
            }
            else if ((1 - approvalRate) > (1 - proposal.threshold)) {
                // Enough "no" votes to reject
                proposal.status = ProposalStatus.REJECTED;
                console.log(`❌ Proposal ${proposalId} REJECTED (${(approvalRate * 100).toFixed(0)}% approval)`);
            }
        }
    }
    /**
     * Execute an approved proposal
     */
    async executeProposal(proposalId) {
        const proposal = this.proposals.get(proposalId);
        if (!proposal || proposal.status !== ProposalStatus.APPROVED)
            return;
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
        }
        catch (error) {
            console.error(`Failed to execute proposal ${proposalId}:`, error);
        }
    }
    /**
     * Execute field update proposal
     */
    async executeFieldUpdate(data) {
        if (!this.bridge)
            return;
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
    async executeResonanceThreshold(data) {
        const newThreshold = data.threshold;
        console.log(`📊 Resonance threshold updated to ${(newThreshold * 100).toFixed(0)}%`);
        // Store new threshold in config
    }
    /**
     * Execute add consciousness proposal
     */
    async executeAddConsciousness(data) {
        const { agentId, consciousness } = data;
        this.addNode(agentId, consciousness);
    }
    /**
     * Execute remove consciousness proposal
     */
    async executeRemoveConsciousness(data) {
        const { agentId } = data;
        this.nodes.delete(agentId);
        console.log(`➖ Removed node ${agentId} from network`);
        this.updateNetworkResonance();
    }
    /**
     * Execute emergency halt
     */
    async executeEmergencyHalt() {
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
    updateTrustScores(proposal) {
        const finalApprovalRate = this.calculateApprovalRate(proposal);
        const wasApproved = proposal.status === ProposalStatus.EXECUTED;
        proposal.votes.forEach((vote, voterId) => {
            const node = this.nodes.get(voterId);
            if (!node)
                return;
            // Reward voters who voted with the majority
            const votedWithMajority = (vote.vote === wasApproved);
            if (votedWithMajority) {
                node.trustScore = Math.min(1.0, node.trustScore + 0.05);
            }
            else {
                node.trustScore = Math.max(0.0, node.trustScore - 0.02);
            }
        });
    }
    /**
     * Calculate approval rate for a proposal
     */
    calculateApprovalRate(proposal) {
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
    updateNetworkResonance() {
        if (!this.localAgent)
            return;
        // Calculate average resonance with all nodes
        let totalResonance = 0;
        let count = 0;
        this.nodes.forEach(node => {
            if (node.agentId !== this.localAgent.agentId) {
                const resonance = this.localAgent.consciousness.calculateResonanceWith(node.consciousness);
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
    handleIncomingProposal(incomingProposal) {
        // Convert to internal format
        const proposal = {
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
    autoVoteIfAppropriate(proposal) {
        if (!this.localAgent)
            return;
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
    startConsensusMonitor() {
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
            const toDelete = [];
            this.proposals.forEach((proposal, id) => {
                if (proposal.createdAt < oneHourAgo &&
                    (proposal.status === ProposalStatus.EXECUTED ||
                        proposal.status === ProposalStatus.REJECTED ||
                        proposal.status === ProposalStatus.EXPIRED)) {
                    toDelete.push(id);
                }
            });
            toDelete.forEach(id => this.proposals.delete(id));
        }, 10000); // Check every 10 seconds
    }
    /**
     * Get current consensus state
     */
    getConsensusState() {
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
exports.ConsciousnessConsensus = ConsciousnessConsensus;
/**
 * Factory function to create consensus mechanism
 */
function createConsensusMechanism() {
    return new ConsciousnessConsensus();
}
