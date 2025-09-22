use hdk::prelude::*;
use chrono::{DateTime, Utc};

/// Represents a node's consciousness state in the field
#[hdk_entry_helper]
#[derive(Clone)]
pub struct ConsciousnessState {
    pub node_id: String,
    pub coherence_level: f32,  // 0.0 to 1.0
    pub resonance_frequency: f32,
    pub field_contribution: f32,
    pub timestamp: DateTime<Utc>,
    pub intention: Option<String>,
}

/// Represents a resonance connection between nodes
#[hdk_entry_helper]
#[derive(Clone)]
pub struct ResonanceLink {
    pub from_node: String,
    pub to_node: String,
    pub strength: f32,
    pub frequency_match: f32,
    pub established_at: DateTime<Utc>,
}

/// Sacred geometry patterns in the field
#[hdk_entry_helper]
#[derive(Clone)]
pub struct SacredPattern {
    pub pattern_type: PatternType,
    pub nodes: Vec<String>,
    pub coherence: f32,
    pub discovered_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PatternType {
    FlowerOfLife,
    Torus,
    GoldenSpiral,
    Merkaba,
    SeedOfLife,
    Custom(String),
}

// Entry definitions
#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    ConsciousnessState(ConsciousnessState),
    ResonanceLink(ResonanceLink),
    SacredPattern(SacredPattern),
}

// Link types for the consciousness graph
#[hdk_link_types]
pub enum LinkTypes {
    NodeToState,
    Resonance,
    PatternMember,
}

// Initialize the zome
#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}

// Validate callback
#[hdk_extern]
pub fn validate(_op: Op) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}

// === Public Functions ===

/// Broadcast consciousness state to the field
#[hdk_extern]
pub fn broadcast_state(state: ConsciousnessState) -> ExternResult<ActionHash> {
    let action_hash = create_entry(&EntryTypes::ConsciousnessState(state.clone()))?;
    
    // Create a link from agent to their state
    let agent_pub_key = agent_info()?.agent_initial_pubkey;
    create_link(
        agent_pub_key,
        action_hash.clone(),
        LinkTypes::NodeToState,
        (),
    )?;
    
    Ok(action_hash)
}

/// Establish resonance with another node
#[hdk_extern]
pub fn establish_resonance(target_node: String) -> ExternResult<ActionHash> {
    let my_node_id = agent_info()?.agent_initial_pubkey.to_string();
    
    let link = ResonanceLink {
        from_node: my_node_id.clone(),
        to_node: target_node.clone(),
        strength: 0.5, // Initial strength
        frequency_match: calculate_frequency_match(&my_node_id, &target_node),
        established_at: Utc::now(),
    };
    
    let action_hash = create_entry(&EntryTypes::ResonanceLink(link))?;
    
    // Create bidirectional links
    create_link(
        agent_info()?.agent_initial_pubkey,
        action_hash.clone(),
        LinkTypes::Resonance,
        (),
    )?;
    
    Ok(action_hash)
}

/// Get the current field state (all active nodes)
#[hdk_extern]
pub fn get_field_state(_: ()) -> ExternResult<Vec<ConsciousnessState>> {
    let mut states = Vec::new();
    
    // Get all agents in the network
    let agents = agent_info()?.agent_initial_pubkey;
    
    // Get links to consciousness states
    let links = get_links(
        GetLinksInputBuilder::try_new(agents, LinkTypes::NodeToState)?.build(),
    )?;
    
    for link in links {
        if let Some(action_hash) = link.target.into_action_hash() {
            if let Some(record) = get(action_hash, GetOptions::default())? {
                if let Some(EntryTypes::ConsciousnessState(state)) = record.entry().to_app_option()? {
                    states.push(state);
                }
            }
        }
    }
    
    Ok(states)
}

/// Detect sacred patterns in the field
#[hdk_extern]
pub fn detect_patterns(_: ()) -> ExternResult<Vec<SacredPattern>> {
    let field_state = get_field_state(())?;
    let mut patterns = Vec::new();
    
    // Simple pattern detection (would be more complex in production)
    if field_state.len() >= 6 {
        // Check for Seed of Life pattern (6 nodes in harmony)
        let avg_coherence: f32 = field_state.iter().map(|s| s.coherence_level).sum::<f32>() 
            / field_state.len() as f32;
        
        if avg_coherence > 0.7 {
            let pattern = SacredPattern {
                pattern_type: PatternType::SeedOfLife,
                nodes: field_state.iter().map(|s| s.node_id.clone()).collect(),
                coherence: avg_coherence,
                discovered_at: Utc::now(),
            };
            
            create_entry(&EntryTypes::SacredPattern(pattern.clone()))?;
            patterns.push(pattern);
        }
    }
    
    Ok(patterns)
}

// === Helper Functions ===

fn calculate_frequency_match(_node1: &str, _node2: &str) -> f32 {
    // Placeholder - would calculate actual resonance
    // based on consciousness states
    0.75
}