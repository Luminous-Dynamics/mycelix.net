use hdk::prelude::*;
use std::collections::HashMap;

/// Proposal for collective decision-making
#[hdk_entry_helper]
#[derive(Clone)]
pub struct Proposal {
    pub id: String,
    pub title: String,
    pub description: String,
    pub proposer: AgentPubKey,
    pub created_at: Timestamp,
    pub voting_deadline: Timestamp,
    pub required_quorum: f32,      // 0.0-1.0 (percentage of network)
    pub approval_threshold: f32,    // 0.0-1.0 (percentage for passing)
    pub proposal_type: ProposalType,
    pub status: ProposalStatus,
}

#[hdk_entry_helper]
#[derive(Clone)]
pub enum ProposalType {
    NetworkUpgrade,
    ParameterChange,
    ResourceAllocation,
    PolicyDecision,
    EmergencyAction,
}

#[hdk_entry_helper]
#[derive(Clone)]
pub enum ProposalStatus {
    Active,
    Passed,
    Failed,
    Cancelled,
    Executed,
}

/// Vote on a proposal with resonance weighting
#[hdk_entry_helper]
#[derive(Clone)]
pub struct Vote {
    pub proposal_id: String,
    pub voter: AgentPubKey,
    pub vote: VoteChoice,
    pub weight: f32,           // Based on resonance with proposer
    pub reasoning: Option<String>,
    pub timestamp: Timestamp,
}

#[hdk_entry_helper]
#[derive(Clone)]
pub enum VoteChoice {
    Yes,
    No,
    Abstain,
    Delegate(AgentPubKey),    // Delegate vote to another agent
}

/// Consensus result after voting period
#[hdk_entry_helper]
#[derive(Clone)]
pub struct ConsensusResult {
    pub proposal_id: String,
    pub total_votes: u32,
    pub yes_weight: f32,
    pub no_weight: f32,
    pub abstain_weight: f32,
    pub participation_rate: f32,
    pub passed: bool,
    pub finalized_at: Timestamp,
    pub execution_hash: Option<EntryHash>,
}

/// Entry definitions
#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Proposal(Proposal),
    Vote(Vote),
    ConsensusResult(ConsensusResult),
}

/// Link types for consensus tracking
#[hdk_link_types]
pub enum LinkTypes {
    ProposalToVotes,
    AgentToProposals,
    ProposalToResult,
    DelegationChain,
    ActiveProposals,
}

/// Create a new proposal
#[hdk_extern]
pub fn create_proposal(proposal: Proposal) -> ExternResult<EntryHash> {
    // Validate proposal parameters
    if proposal.required_quorum < 0.1 || proposal.required_quorum > 1.0 {
        return Err(wasm_error!(
            WasmErrorInner::Guest(String::from("Quorum must be between 0.1 and 1.0"))
        ));
    }
    
    if proposal.approval_threshold < 0.5 || proposal.approval_threshold > 1.0 {
        return Err(wasm_error!(
            WasmErrorInner::Guest(String::from("Approval threshold must be between 0.5 and 1.0"))
        ));
    }
    
    if proposal.voting_deadline <= sys_time()? {
        return Err(wasm_error!(
            WasmErrorInner::Guest(String::from("Voting deadline must be in the future"))
        ));
    }
    
    // Create the proposal entry
    let hash = hash_entry(&proposal)?;
    create_entry(EntryTypes::Proposal(proposal.clone()))?;
    
    // Link to proposer
    create_link(
        proposal.proposer.clone(),
        hash.clone(),
        LinkTypes::AgentToProposals,
        (),
    )?;
    
    // Link to active proposals list
    let active_anchor = hash_entry(&"active_proposals".to_string())?;
    create_link(
        active_anchor,
        hash.clone(),
        LinkTypes::ActiveProposals,
        (),
    )?;
    
    // Emit signal for new proposal
    emit_signal(ConsensusSignal::NewProposal {
        proposal_id: proposal.id.clone(),
        title: proposal.title.clone(),
        proposer: proposal.proposer,
        deadline: proposal.voting_deadline,
    })?;
    
    Ok(hash)
}

/// Cast a vote on a proposal
#[hdk_extern]
pub fn cast_vote(vote: Vote) -> ExternResult<EntryHash> {
    // Get the proposal
    let proposal = get_proposal_by_id(vote.proposal_id.clone())?;
    
    // Check if voting is still open
    if sys_time()? > proposal.voting_deadline {
        return Err(wasm_error!(
            WasmErrorInner::Guest(String::from("Voting period has ended"))
        ));
    }
    
    // Check proposal status
    match proposal.status {
        ProposalStatus::Active => {},
        _ => return Err(wasm_error!(
            WasmErrorInner::Guest(String::from("Proposal is not active for voting"))
        )),
    }
    
    // Calculate vote weight based on resonance with proposer
    let resonance = calculate_voter_weight(vote.voter.clone(), proposal.proposer.clone())?;
    let weighted_vote = Vote {
        weight: resonance,
        ..vote
    };
    
    // Create the vote entry
    let hash = hash_entry(&weighted_vote)?;
    create_entry(EntryTypes::Vote(weighted_vote.clone()))?;
    
    // Link vote to proposal
    let proposal_hash = hash_entry(&proposal)?;
    create_link(
        proposal_hash,
        hash.clone(),
        LinkTypes::ProposalToVotes,
        (),
    )?;
    
    // Handle delegation if applicable
    if let VoteChoice::Delegate(delegate) = &weighted_vote.vote {
        create_link(
            weighted_vote.voter.clone(),
            delegate.clone(),
            LinkTypes::DelegationChain,
            (),
        )?;
    }
    
    // Emit signal for vote cast
    emit_signal(ConsensusSignal::VoteCast {
        proposal_id: weighted_vote.proposal_id,
        voter: weighted_vote.voter,
        weight: weighted_vote.weight,
    })?;
    
    Ok(hash)
}

/// Finalize a proposal after voting period
#[hdk_extern]
pub fn finalize_proposal(proposal_id: String) -> ExternResult<ConsensusResult> {
    let proposal = get_proposal_by_id(proposal_id.clone())?;
    
    // Check if voting period has ended
    if sys_time()? <= proposal.voting_deadline {
        return Err(wasm_error!(
            WasmErrorInner::Guest(String::from("Voting period still active"))
        ));
    }
    
    // Get all votes for the proposal
    let votes = get_votes_for_proposal(proposal_id.clone())?;
    
    // Calculate weighted results
    let mut yes_weight = 0.0;
    let mut no_weight = 0.0;
    let mut abstain_weight = 0.0;
    let mut delegated_votes: HashMap<AgentPubKey, Vec<Vote>> = HashMap::new();
    
    for vote in &votes {
        match &vote.vote {
            VoteChoice::Yes => yes_weight += vote.weight,
            VoteChoice::No => no_weight += vote.weight,
            VoteChoice::Abstain => abstain_weight += vote.weight,
            VoteChoice::Delegate(delegate) => {
                delegated_votes.entry(delegate.clone())
                    .or_insert_with(Vec::new)
                    .push(vote.clone());
            }
        }
    }
    
    // Process delegated votes
    for (delegate, delegated) in delegated_votes {
        if let Ok(delegate_vote) = get_vote_for_agent(proposal_id.clone(), delegate) {
            let delegated_weight: f32 = delegated.iter().map(|v| v.weight).sum();
            match delegate_vote.vote {
                VoteChoice::Yes => yes_weight += delegated_weight,
                VoteChoice::No => no_weight += delegated_weight,
                VoteChoice::Abstain => abstain_weight += delegated_weight,
                VoteChoice::Delegate(_) => {} // Ignore recursive delegation for now
            }
        }
    }
    
    // Calculate participation
    let total_weight = yes_weight + no_weight + abstain_weight;
    let network_size = estimate_network_size()?;
    let participation_rate = (votes.len() as f32) / (network_size as f32);
    
    // Determine if proposal passed
    let passed = participation_rate >= proposal.required_quorum &&
                  yes_weight / (yes_weight + no_weight) >= proposal.approval_threshold;
    
    // Create consensus result
    let result = ConsensusResult {
        proposal_id: proposal_id.clone(),
        total_votes: votes.len() as u32,
        yes_weight,
        no_weight,
        abstain_weight,
        participation_rate,
        passed,
        finalized_at: sys_time()?,
        execution_hash: None,
    };
    
    // Store the result
    let result_hash = hash_entry(&result)?;
    create_entry(EntryTypes::ConsensusResult(result.clone()))?;
    
    // Link result to proposal
    let proposal_hash = hash_entry(&proposal)?;
    create_link(
        proposal_hash,
        result_hash,
        LinkTypes::ProposalToResult,
        (),
    )?;
    
    // Update proposal status
    let mut updated_proposal = proposal.clone();
    updated_proposal.status = if passed {
        ProposalStatus::Passed
    } else {
        ProposalStatus::Failed
    };
    update_entry(hash_entry(&proposal)?, &updated_proposal)?;
    
    // Emit signal for consensus reached
    emit_signal(ConsensusSignal::ConsensusReached {
        proposal_id: proposal_id.clone(),
        passed,
        yes_weight,
        no_weight,
        participation: participation_rate,
    })?;
    
    Ok(result)
}

/// Get all active proposals
#[hdk_extern]
pub fn get_active_proposals() -> ExternResult<Vec<Proposal>> {
    let active_anchor = hash_entry(&"active_proposals".to_string())?;
    let links = get_links(
        GetLinksInputBuilder::try_new(active_anchor, LinkTypes::ActiveProposals)?.build()
    )?;
    
    let mut proposals = Vec::new();
    for link in links {
        if let Some(record) = get(link.target, GetOptions::default())? {
            if let Some(proposal) = record.entry().to_app_option()? {
                proposals.push(proposal);
            }
        }
    }
    
    // Filter out expired proposals
    let now = sys_time()?;
    proposals.retain(|p: &Proposal| p.voting_deadline > now);
    
    Ok(proposals)
}

/// Get voting history for an agent
#[hdk_extern]
pub fn get_voting_history(agent: AgentPubKey) -> ExternResult<Vec<Vote>> {
    // Query chain for all votes by this agent
    let filter = ChainQueryFilter::new()
        .entry_type(EntryType::App(AppEntryDef {
            entry_index: 1.into(), // Vote entry index
            zome_index: 0.into(),
            visibility: EntryVisibility::Public,
        }))
        .include_entries(true);
    
    let records = query(filter)?;
    
    let mut votes = Vec::new();
    for record in records {
        if let Some(entry) = record.entry.into_option() {
            if let Ok(vote) = entry.try_into() {
                let v: Vote = vote;
                if v.voter == agent {
                    votes.push(v);
                }
            }
        }
    }
    
    Ok(votes)
}

// Helper functions

fn get_proposal_by_id(proposal_id: String) -> ExternResult<Proposal> {
    // Query for proposal with matching ID
    let filter = ChainQueryFilter::new()
        .entry_type(EntryType::App(AppEntryDef {
            entry_index: 0.into(), // Proposal entry index
            zome_index: 0.into(),
            visibility: EntryVisibility::Public,
        }))
        .include_entries(true);
    
    let records = query(filter)?;
    
    for record in records {
        if let Some(entry) = record.entry.into_option() {
            if let Ok(proposal) = entry.try_into() {
                let p: Proposal = proposal;
                if p.id == proposal_id {
                    return Ok(p);
                }
            }
        }
    }
    
    Err(wasm_error!(
        WasmErrorInner::Guest(format!("Proposal {} not found", proposal_id))
    ))
}

fn get_votes_for_proposal(proposal_id: String) -> ExternResult<Vec<Vote>> {
    // Query for all votes with this proposal ID
    let filter = ChainQueryFilter::new()
        .entry_type(EntryType::App(AppEntryDef {
            entry_index: 1.into(), // Vote entry index
            zome_index: 0.into(),
            visibility: EntryVisibility::Public,
        }))
        .include_entries(true);
    
    let records = query(filter)?;
    
    let mut votes = Vec::new();
    for record in records {
        if let Some(entry) = record.entry.into_option() {
            if let Ok(vote) = entry.try_into() {
                let v: Vote = vote;
                if v.proposal_id == proposal_id {
                    votes.push(v);
                }
            }
        }
    }
    
    Ok(votes)
}

fn get_vote_for_agent(proposal_id: String, agent: AgentPubKey) -> ExternResult<Vote> {
    let votes = get_votes_for_proposal(proposal_id)?;
    
    for vote in votes {
        if vote.voter == agent {
            return Ok(vote);
        }
    }
    
    Err(wasm_error!(
        WasmErrorInner::Guest(String::from("Vote not found for agent"))
    ))
}

fn calculate_voter_weight(voter: AgentPubKey, proposer: AgentPubKey) -> ExternResult<f32> {
    // Call consciousness_identity zome to get resonance
    // For now, return a simulated weight
    if voter == proposer {
        Ok(1.0)  // Proposer has full weight
    } else {
        // In production, would call:
        // call_remote(proposer, "consciousness_identity", "calculate_resonance", voter)?
        Ok(0.5 + (rand::random::<f32>() * 0.5))  // Simulated 0.5-1.0
    }
}

fn estimate_network_size() -> ExternResult<usize> {
    // In production, would query DHT for peer count
    // For now, return estimate
    Ok(10)
}

// Signal definitions

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum ConsensusSignal {
    NewProposal {
        proposal_id: String,
        title: String,
        proposer: AgentPubKey,
        deadline: Timestamp,
    },
    VoteCast {
        proposal_id: String,
        voter: AgentPubKey,
        weight: f32,
    },
    ConsensusReached {
        proposal_id: String,
        passed: bool,
        yes_weight: f32,
        no_weight: f32,
        participation: f32,
    },
    ProposalExecuted {
        proposal_id: String,
        execution_hash: EntryHash,
    },
}