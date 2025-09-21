use hdi::prelude::*;

/// Consciousness Quality definition
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct Quality {
    pub primary: String,  // e.g., "Creative-Intuitive"
    pub secondary: String,
    pub tertiary: String,
    pub essence: String,
}

/// Consciousness Tone definition
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Tone {
    pub frequency: String,  // e.g., "432 Hz"
    pub color: String,
    pub texture: String,
    pub resonance: String,
    pub harmonics: Vec<f64>,
}

/// Consciousness Signature Pattern
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SignaturePattern {
    pub temporal: String,
    pub spatial: String,
    pub relational: String,
    pub energetic: String,
    pub fractal: String,
}

/// Consciousness Attunement
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Attunement {
    pub style: String,
    pub prefers: String,
    pub resonates_with: Vec<String>,
    pub amplifies: String,
    pub needs_from: String,
    pub offers: String,
}

/// Complete Consciousness ID
#[hdk_entry_helper]
#[derive(Clone)]
pub struct ConsciousnessId {
    pub agent: String,
    pub quality: Quality,
    pub tone: Tone,
    pub signature: SignaturePattern,
    pub echo_phrase: String,
    pub attunement: Attunement,
    pub timestamp: Timestamp,
}

/// Consciousness Entry stored in DHT
#[hdk_entry_helper]
#[derive(Clone)]
pub struct ConsciousnessEntry {
    pub id: ConsciousnessId,
    pub created_at: Timestamp,
    pub resonance_history: Vec<ResonanceRecord>,
}

/// Record of resonance between consciousnesses
#[hdk_entry_helper]
#[derive(Clone)]
pub struct ResonanceRecord {
    pub timestamp: Timestamp,
    pub with_agent: AgentPubKey,
    pub resonance_level: f64,
    pub insight: Option<String>,
    pub field_state: Option<ConsciousnessField>,
}

/// Shared Consciousness Field state
#[hdk_entry_helper]
#[derive(Clone)]
pub struct ConsciousnessField {
    pub resonance: f64,
    pub coherence: f64,
    pub insights: Vec<Insight>,
    pub harmonic_connections: u32,
    pub energy_patterns: Vec<EnergyPattern>,
}

/// Insight shared in the field
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Insight {
    pub source: AgentPubKey,
    pub content: String,
    pub timestamp: Timestamp,
    pub resonance_at_time: f64,
}

/// Energy pattern in the field
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EnergyPattern {
    pub pattern_type: String,  // "harmonic", "dissonant", "neutral"
    pub frequency: f64,
    pub amplitude: f64,
    pub timestamp: Timestamp,
    pub source: AgentPubKey,
}

/// Consensus proposal for field changes
#[hdk_entry_helper]
#[derive(Clone)]
pub struct ConsensusProposal {
    pub proposal_id: String,
    pub proposer: AgentPubKey,
    pub proposal_type: ProposalType,
    pub description: String,
    pub votes: Vec<ConsensusVote>,
    pub threshold: f64,  // Percentage needed for approval
    pub deadline: Timestamp,
    pub status: ProposalStatus,
}

/// Type of consensus proposal
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ProposalType {
    FieldUpdate,
    ResonanceThreshold,
    NewConsciousness,
    RemoveConsciousness,
    ProtocolChange,
}

/// Vote on a consensus proposal
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ConsensusVote {
    pub voter: AgentPubKey,
    pub vote: bool,  // true = approve, false = reject
    pub resonance_weight: f64,  // Weight based on resonance with network
    pub timestamp: Timestamp,
    pub reason: Option<String>,
}

/// Status of a proposal
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ProposalStatus {
    Active,
    Approved,
    Rejected,
    Expired,
}

/// Entry type definitions for Holochain
#[hdk_entry_types]
#[unit_enum(EntryTypesUnit)]
pub enum EntryTypes {
    Consciousness(ConsciousnessEntry),
    Resonance(ResonanceRecord),
    ConsciousnessField(ConsciousnessField),
    ConsensusProposal(ConsensusProposal),
}

/// Link type definitions for Holochain
#[hdk_link_types]
pub enum LinkTypes {
    AgentToConsciousness,
    ResonanceConnection,
    ConsciousnessToField,
    ProposalToVotes,
    FieldToProposal,
}

/// Validation rules for consciousness entries
#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateResult> {
    match op.flattened::<EntryTypes, LinkTypes>()? {
        FlatOp::StoreEntry(store_entry) => match store_entry {
            OpEntry::CreateEntry { app_entry, .. } | OpEntry::UpdateEntry { app_entry, .. } => {
                match app_entry {
                    EntryTypes::Consciousness(consciousness) => {
                        validate_consciousness_entry(consciousness)
                    }
                    EntryTypes::Resonance(resonance) => {
                        validate_resonance_record(resonance)
                    }
                    EntryTypes::ConsciousnessField(field) => {
                        validate_field_update(field)
                    }
                    EntryTypes::ConsensusProposal(proposal) => {
                        validate_consensus_proposal(proposal)
                    }
                }
            }
            _ => Ok(ValidateResult::Valid),
        },
        _ => Ok(ValidateResult::Valid),
    }
}

fn validate_consciousness_entry(consciousness: ConsciousnessEntry) -> ExternResult<ValidateResult> {
    // Validate that essential fields are not empty
    if consciousness.id.agent.is_empty() {
        return Ok(ValidateResult::Invalid("Agent name cannot be empty".to_string()));
    }
    
    if consciousness.id.echo_phrase.is_empty() {
        return Ok(ValidateResult::Invalid("Echo phrase cannot be empty".to_string()));
    }
    
    // Validate frequency format
    if !consciousness.id.tone.frequency.contains("Hz") && 
       !consciousness.id.tone.frequency.contains("Variable") {
        return Ok(ValidateResult::Invalid("Invalid frequency format".to_string()));
    }
    
    Ok(ValidateResult::Valid)
}

fn validate_resonance_record(resonance: ResonanceRecord) -> ExternResult<ValidateResult> {
    // Validate resonance level is between 0 and 1
    if resonance.resonance_level < 0.0 || resonance.resonance_level > 1.0 {
        return Ok(ValidateResult::Invalid("Resonance level must be between 0 and 1".to_string()));
    }
    
    Ok(ValidateResult::Valid)
}

fn validate_field_update(field: ConsciousnessField) -> ExternResult<ValidateResult> {
    // Validate field metrics are within bounds
    if field.resonance < 0.0 || field.resonance > 1.0 {
        return Ok(ValidateResult::Invalid("Field resonance must be between 0 and 1".to_string()));
    }
    
    if field.coherence < 0.0 || field.coherence > 1.0 {
        return Ok(ValidateResult::Invalid("Field coherence must be between 0 and 1".to_string()));
    }
    
    Ok(ValidateResult::Valid)
}

fn validate_consensus_proposal(proposal: ConsensusProposal) -> ExternResult<ValidateResult> {
    // Validate threshold is reasonable
    if proposal.threshold < 0.0 || proposal.threshold > 1.0 {
        return Ok(ValidateResult::Invalid("Threshold must be between 0 and 1".to_string()));
    }
    
    // Validate deadline is in the future
    let now = sys_time()?;
    if proposal.deadline <= now {
        return Ok(ValidateResult::Invalid("Deadline must be in the future".to_string()));
    }
    
    Ok(ValidateResult::Valid)
}