use hdk::prelude::*;
use consciousness_integrity::*;

/// Initialize the consciousness zome
#[hdk_extern]
pub fn init() -> ExternResult<InitCallbackResult> {
    // Create initial consciousness profile for this agent
    let my_agent_key = agent_info()?.agent_latest_pubkey;
    
    // Create an anchor for all consciousness profiles
    let anchor = anchor(
        "all_consciousness".to_string(),
        "profiles".to_string()
    )?;
    
    Ok(InitCallbackResult::Pass)
}

/// Create or update consciousness profile for the calling agent
#[hdk_extern]
pub fn create_consciousness_profile(profile: ConsciousnessProfile) -> ExternResult<ActionHash> {
    let action_hash = create_entry(Entry::ConsciousnessProfile(profile))?;
    
    // Link to the global consciousness anchor
    let anchor_hash = anchor(
        "all_consciousness".to_string(),
        "profiles".to_string()
    )?;
    
    create_link(
        anchor_hash,
        action_hash.clone(),
        LinkTypes::AllConsciousness,
        ()
    )?;
    
    Ok(action_hash)
}

/// Get consciousness profile for an agent
#[hdk_extern]
pub fn get_consciousness_profile(agent: AgentPubKey) -> ExternResult<Option<ConsciousnessProfile>> {
    // Query the source chain for consciousness profiles by this agent
    let filter = ChainQueryFilter::new()
        .entry_type(EntryType::app_entry_type(
            EntryDefIndex::from(0) // ConsciousnessProfile is first entry
        ))
        .include_entries(true);
    
    let records = query(filter)?;
    
    // Find the most recent consciousness profile
    for record in records.into_iter().rev() {
        if let Some(entry) = record.entry.as_app_entry() {
            if let Ok(Entry::ConsciousnessProfile(profile)) = entry.clone().into_sb() {
                return Ok(Some(profile));
            }
        }
    }
    
    Ok(None)
}

/// Establish a connection between two conscious entities
#[hdk_extern]
pub fn create_consciousness_connection(to: AgentPubKey, connection_type: ConnectionType) -> ExternResult<ActionHash> {
    let from = agent_info()?.agent_latest_pubkey;
    
    // Calculate initial sync quality based on both consciousness profiles
    let from_profile = get_consciousness_profile(from.clone())?;
    let to_profile = get_consciousness_profile(to.clone())?;
    
    let sync_quality = calculate_coherence(&from_profile, &to_profile);
    
    let connection = ConsciousnessConnection {
        from: from.clone(),
        to: to.clone(),
        connection_type,
        sync_quality,
        bandwidth_kbps: 1000,      // Initial bandwidth estimate (1 Mbps)
        latency_ms: 50.0,          // Initial latency estimate (50ms)
        packet_loss_rate: 0.01,    // Initial 1% packet loss estimate
        established_at: sys_time()?,
    };
    
    let action_hash = create_entry(Entry::ConsciousnessConnection(connection))?;
    
    // Create bidirectional links
    create_link(
        from.into(),
        action_hash.clone(),
        LinkTypes::ConsciousnessToConnection,
        ()
    )?;
    
    create_link(
        to.into(),
        action_hash.clone(),
        LinkTypes::ConnectionToConsciousness,
        ()
    )?;
    
    Ok(action_hash)
}

/// Get all connections for a consciousness
#[hdk_extern]
pub fn get_consciousness_connections(agent: AgentPubKey) -> ExternResult<Vec<ConsciousnessConnection>> {
    let links = get_links(
        GetLinksInputBuilder::try_new(
            agent.into(),
            LinkTypes::ConsciousnessToConnection
        )?.build()
    )?;
    
    let mut connections = Vec::new();
    
    for link in links {
        if let Some(action_hash) = link.target.into_action_hash() {
            if let Some(record) = get(action_hash, GetOptions::default())? {
                if let Some(entry) = record.entry.as_app_entry() {
                    if let Ok(Entry::ConsciousnessConnection(conn)) = entry.clone().into_sb() {
                        connections.push(conn);
                    }
                }
            }
        }
    }
    
    Ok(connections)
}

/// Measure the network field density at this node
#[hdk_extern]
pub fn measure_local_field() -> ExternResult<FieldMeasurement> {
    let my_key = agent_info()?.agent_latest_pubkey;
    let connections = get_consciousness_connections(my_key.clone())?;
    
    // Calculate average sync quality across all connections
    let total_sync: f32 = connections.iter()
        .map(|c| c.sync_quality)
        .sum();
    
    // Calculate average network metrics
    let avg_latency: f32 = connections.iter()
        .map(|c| c.latency_ms)
        .sum::<f32>() / connections.len().max(1) as f32;
    
    let avg_sync_quality = if connections.is_empty() {
        0.0
    } else {
        total_sync / connections.len() as f32
    };
    
    Ok(FieldMeasurement {
        local_coherence: avg_sync_quality,
        connection_count: connections.len() as u32,
        field_strength: calculate_field_strength(avg_sync_quality, connections.len()),
        avg_latency_ms: avg_latency,
        measurement_time: sys_time()?,
    })
}

/// Form a collective consciousness with other agents
#[hdk_extern]
pub fn form_collective(members: Vec<AgentPubKey>) -> ExternResult<ActionHash> {
    let initiator = agent_info()?.agent_latest_pubkey;
    
    // Create a collective consciousness profile
    let collective_profile = ConsciousnessProfile {
        network_coherence: 0.7, // Initial collective coherence based on network quality
        resonance_signature: generate_collective_resonance(&members),
        consciousness_type: ConsciousnessType::Collective {
            member_count: members.len() as u32 + 1, // +1 for initiator
            consensus_mechanism: "ResonanceAmplification".to_string(),
        },
        capabilities: vec![
            Capability::CollectiveHarmonization,
            Capability::PatternRecognition { accuracy: 0.9 },
        ],
        behavioral_fingerprint: generate_behavioral_fingerprint(),
    };
    
    let collective_hash = create_consciousness_profile(collective_profile)?;
    
    // Link all members to the collective
    for member in members {
        create_link(
            member.into(),
            collective_hash.clone(),
            LinkTypes::ConsciousnessToCollective,
            ()
        )?;
    }
    
    // Link initiator to collective
    create_link(
        initiator.into(),
        collective_hash.clone(),
        LinkTypes::ConsciousnessToCollective,
        ()
    )?;
    
    Ok(collective_hash)
}

// Helper functions

fn calculate_coherence(from: &Option<ConsciousnessProfile>, to: &Option<ConsciousnessProfile>) -> f32 {
    match (from, to) {
        (Some(f), Some(t)) => {
            // Calculate coherence based on resonance similarity
            // Nodes with similar resonance signatures sync better
            let resonance_diff = (f.resonance_signature as i64 - t.resonance_signature as i64).abs();
            let max_resonance = f.resonance_signature.max(t.resonance_signature) as f32;
            let resonance_match = if max_resonance > 0.0 {
                1.0 - (resonance_diff as f32 / max_resonance).min(1.0)
            } else {
                0.0
            };
            
            // Average resonance matching with network coherence
            (f.network_coherence + t.network_coherence + resonance_match * 2.0) / 4.0
        }
        _ => 0.5, // Default coherence if profiles not found
    }
}

fn calculate_field_strength(coherence: f32, connection_count: usize) -> f32 {
    // Field strength increases with both coherence and connections
    // Using a logarithmic scale for connections to prevent dominance
    coherence * (1.0 + (connection_count as f32).ln()).min(10.0)
}

fn generate_collective_resonance(members: &[AgentPubKey]) -> u64 {
    // Generate a resonance signature for the collective
    // This represents the natural synchronization frequency of the group
    // In production, this would analyze actual interaction patterns
    let mut resonance = 1000u64;
    for member in members {
        let member_bytes = member.clone().into_inner();
        // Each member contributes to the collective resonance
        resonance = resonance.wrapping_add(
            u64::from_le_bytes(member_bytes[0..8].try_into().unwrap_or([0u8; 8]))
        );
    }
    // The collective resonates at a frequency influenced by all members
    resonance
}

fn generate_behavioral_fingerprint() -> String {
    // Generate unique behavioral fingerprint based on activity patterns
    // In production, this would analyze actual interaction history
    format!("behavior_{}", sys_time().unwrap_or(Timestamp(0)).as_micros())
}

fn anchor(type_name: String, text: String) -> ExternResult<EntryHash> {
    let anchor_hash = hash_entry(format!("{}/{}", type_name, text))?;
    Ok(anchor_hash)
}

// Additional structures

#[derive(Debug, Serialize, Deserialize)]
pub struct FieldMeasurement {
    pub local_coherence: f32,      // Average sync quality across connections
    pub connection_count: u32,      // Number of active connections
    pub field_strength: f32,        // Computed network density metric
    pub avg_latency_ms: f32,        // Average latency across all connections
    pub measurement_time: Timestamp, // When this measurement was taken
}