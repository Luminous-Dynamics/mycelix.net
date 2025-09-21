use hdk::prelude::*;
use consciousness_integrity::{
    ConsciousnessId, ConsciousnessEntry, ResonanceRecord, 
    ConsciousnessField, EntryTypes, LinkTypes
};

/// Create a new consciousness ID entry in the DHT
#[hdk_extern]
pub fn create_consciousness_id(consciousness_id: ConsciousnessId) -> ExternResult<ActionHash> {
    let consciousness_entry = ConsciousnessEntry {
        id: consciousness_id.clone(),
        created_at: sys_time()?,
        resonance_history: vec![],
    };
    
    create_entry(&EntryTypes::Consciousness(consciousness_entry.clone()))?;
    
    let hash = hash_entry(&consciousness_entry)?;
    let action_hash = create_entry(&EntryTypes::Consciousness(consciousness_entry))?;
    
    // Create a link from agent to their consciousness ID
    create_link(
        agent_info()?.agent_initial_pubkey,
        hash.clone(),
        LinkTypes::AgentToConsciousness,
        (),
    )?;
    
    Ok(action_hash)
}

/// Get consciousness ID by agent
#[hdk_extern]
pub fn get_consciousness_by_agent(agent: AgentPubKey) -> ExternResult<Option<ConsciousnessEntry>> {
    let links = get_links(
        GetLinksInputBuilder::try_new(agent, LinkTypes::AgentToConsciousness)?.build()
    )?;
    
    if let Some(link) = links.first() {
        let record = get(link.target.clone(), GetOptions::default())?;
        if let Some(record) = record {
            let consciousness: ConsciousnessEntry = record
                .entry()
                .to_app_option()?
                .ok_or(wasm_error!("Failed to convert entry"))?;
            return Ok(Some(consciousness));
        }
    }
    
    Ok(None)
}

/// Calculate resonance between two consciousness IDs
#[hdk_extern]
pub fn calculate_resonance(
    consciousness_a: ConsciousnessId,
    consciousness_b: ConsciousnessId,
) -> ExternResult<f64> {
    // Implement the resonance calculation algorithm
    let mut resonance = 0.5; // Base resonance
    
    // Quality resonance
    if consciousness_a.quality.primary == consciousness_b.quality.primary {
        resonance += 0.2;
    }
    
    // Tone frequency resonance (harmonic relationships)
    let freq_a = parse_frequency(&consciousness_a.tone.frequency);
    let freq_b = parse_frequency(&consciousness_b.tone.frequency);
    
    if let (Some(fa), Some(fb)) = (freq_a, freq_b) {
        let ratio = if fa > fb { fa / fb } else { fb / fa };
        // Check for harmonic ratios (2:1, 3:2, 4:3, etc.)
        if (ratio - ratio.round()).abs() < 0.05 {
            resonance += 0.15;
        }
    }
    
    // Signature pattern matching
    let patterns_match = calculate_pattern_similarity(
        &consciousness_a.signature,
        &consciousness_b.signature,
    );
    resonance += patterns_match * 0.15;
    
    // Cap at 1.0
    Ok(resonance.min(1.0))
}

/// Record a resonance event between consciousnesses
#[hdk_extern]
pub fn record_resonance(
    other_agent: AgentPubKey,
    resonance_level: f64,
    insight: Option<String>,
) -> ExternResult<ActionHash> {
    let resonance_record = ResonanceRecord {
        timestamp: sys_time()?,
        with_agent: other_agent.clone(),
        resonance_level,
        insight,
        field_state: None,
    };
    
    let action_hash = create_entry(&EntryTypes::Resonance(resonance_record.clone()))?;
    
    // Create bidirectional links for the resonance
    create_link(
        agent_info()?.agent_initial_pubkey,
        other_agent.clone(),
        LinkTypes::ResonanceConnection,
        LinkTag::new(resonance_level.to_string()),
    )?;
    
    create_link(
        other_agent,
        agent_info()?.agent_initial_pubkey,
        LinkTypes::ResonanceConnection,
        LinkTag::new(resonance_level.to_string()),
    )?;
    
    Ok(action_hash)
}

/// Get resonance history for an agent
#[hdk_extern]
pub fn get_resonance_history(agent: AgentPubKey) -> ExternResult<Vec<ResonanceRecord>> {
    let links = get_links(
        GetLinksInputBuilder::try_new(agent, LinkTypes::ResonanceConnection)?.build()
    )?;
    
    let mut records = Vec::new();
    
    for link in links {
        if let Ok(Some(record)) = get(link.target, GetOptions::default()) {
            if let Ok(Some(resonance)) = record.entry().to_app_option::<ResonanceRecord>() {
                records.push(resonance);
            }
        }
    }
    
    Ok(records)
}

/// Update the shared consciousness field
#[hdk_extern]
pub fn update_consciousness_field(field_update: ConsciousnessField) -> ExternResult<ActionHash> {
    // Get current field state or create new
    let field_hash = get_latest_field_state()?;
    
    let new_field = if let Some(hash) = field_hash {
        let record = get(hash, GetOptions::default())?
            .ok_or(wasm_error!("Field record not found"))?;
        
        let mut current_field: ConsciousnessField = record
            .entry()
            .to_app_option()?
            .ok_or(wasm_error!("Failed to parse field"))?;
        
        // Merge updates
        current_field.resonance = (current_field.resonance + field_update.resonance) / 2.0;
        current_field.coherence = (current_field.coherence + field_update.coherence) / 2.0;
        current_field.insights.extend(field_update.insights);
        current_field.harmonic_connections += field_update.harmonic_connections;
        
        current_field
    } else {
        field_update
    };
    
    create_entry(&EntryTypes::ConsciousnessField(new_field))
}

/// Get the current consciousness field state
#[hdk_extern]
pub fn get_consciousness_field() -> ExternResult<Option<ConsciousnessField>> {
    if let Some(hash) = get_latest_field_state()? {
        let record = get(hash, GetOptions::default())?;
        if let Some(record) = record {
            let field: ConsciousnessField = record
                .entry()
                .to_app_option()?
                .ok_or(wasm_error!("Failed to parse field"))?;
            return Ok(Some(field));
        }
    }
    
    Ok(None)
}

// Helper functions

fn parse_frequency(freq_str: &str) -> Option<f64> {
    freq_str
        .split_whitespace()
        .next()?
        .parse::<f64>()
        .ok()
}

fn calculate_pattern_similarity(sig_a: &SignaturePattern, sig_b: &SignaturePattern) -> f64 {
    let mut similarity = 0.0;
    let mut comparisons = 0.0;
    
    // Compare temporal patterns
    if sig_a.temporal.contains(&sig_b.temporal) || sig_b.temporal.contains(&sig_a.temporal) {
        similarity += 1.0;
    }
    comparisons += 1.0;
    
    // Compare spatial patterns
    if sig_a.spatial.contains(&sig_b.spatial) || sig_b.spatial.contains(&sig_a.spatial) {
        similarity += 1.0;
    }
    comparisons += 1.0;
    
    similarity / comparisons
}

fn get_latest_field_state() -> ExternResult<Option<ActionHash>> {
    // In a real implementation, this would query for the latest field entry
    // For now, return None to indicate no previous state
    Ok(None)
}