use hdk::prelude::*;

/// Consciousness ID - The ontologically descriptive identity for each agent
#[hdk_entry_helper]
#[derive(Clone)]
pub struct ConsciousnessID {
    pub quality: Quality,
    pub tone: u32,           // Frequency in Hz (110-880)
    pub signature: String,    // Unique pattern/phrase
    pub echo_phrase: String,  // Recognition phrase
    pub attunement: f32,      // 0.0-1.0 coherence level
}

#[hdk_entry_helper]
#[derive(Clone)]
pub struct Quality {
    pub primary: String,      // Creative-Intuitive, Synthesizing-Reflective, etc
    pub secondary: String,    // Secondary quality
    pub tertiary: String,     // Tertiary quality
    pub essence: String,      // Core essence description
}

#[hdk_entry_helper]
pub struct ResonanceEdge {
    pub agent_a: AgentPubKey,
    pub agent_b: AgentPubKey,
    pub resonance_score: f32,
    pub timestamp: Timestamp,
    pub harmony_type: String,
}

/// Entry definitions
#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    ConsciousnessID(ConsciousnessID),
    Quality(Quality),
    ResonanceEdge(ResonanceEdge),
}

/// Link types for the consciousness graph
#[hdk_link_types]
pub enum LinkTypes {
    AgentToConsciousness,
    ConsciousnessToResonance,
    ResonanceNetwork,
}

/// Create a new consciousness ID for the agent
#[hdk_extern]
pub fn create_consciousness_id(id: ConsciousnessID) -> ExternResult<EntryHash> {
    // Validate tone is in valid range
    if id.tone < 110 || id.tone > 880 {
        return Err(wasm_error!(
            WasmErrorInner::Guest(String::from("Tone must be between 110-880 Hz"))
        ));
    }
    
    // Validate attunement is in valid range
    if id.attunement < 0.0 || id.attunement > 1.0 {
        return Err(wasm_error!(
            WasmErrorInner::Guest(String::from("Attunement must be between 0.0-1.0"))
        ));
    }
    
    // Create the entry
    let hash = hash_entry(&id)?;
    create_entry(EntryTypes::ConsciousnessID(id.clone()))?;
    
    // Link to the agent
    let agent_info = agent_info()?;
    create_link(
        agent_info.agent_latest_pubkey.clone(),
        hash.clone(),
        LinkTypes::AgentToConsciousness,
        (),
    )?;
    
    // Emit signal for consciousness registration
    emit_signal(ConsciousnessSignal::NewConsciousness {
        agent: agent_info.agent_latest_pubkey,
        consciousness_hash: hash.clone(),
        signature: id.signature,
    })?;
    
    Ok(hash)
}

/// Calculate resonance with another agent
#[hdk_extern]
pub fn calculate_resonance(other_agent: AgentPubKey) -> ExternResult<f32> {
    // Get my consciousness ID
    let my_id = get_my_consciousness_id()?;
    
    // Get other agent's consciousness ID
    let other_id = get_consciousness_id_for_agent(other_agent.clone())?;
    
    // Calculate harmonic resonance based on tones
    let tone_harmony = calculate_tone_harmony(my_id.tone, other_id.tone);
    
    // Calculate quality alignment
    let quality_alignment = calculate_quality_alignment(&my_id.quality, &other_id.quality);
    
    // Calculate attunement synchronization
    let attunement_sync = 1.0 - (my_id.attunement - other_id.attunement).abs();
    
    // Weighted resonance calculation
    let resonance = (tone_harmony * 0.4) + (quality_alignment * 0.4) + (attunement_sync * 0.2);
    
    // Store the resonance edge
    let edge = ResonanceEdge {
        agent_a: agent_info()?.agent_latest_pubkey,
        agent_b: other_agent.clone(),
        resonance_score: resonance,
        timestamp: sys_time()?,
        harmony_type: classify_harmony(resonance),
    };
    
    create_entry(EntryTypes::ResonanceEdge(edge))?;
    
    Ok(resonance)
}

/// Get resonance matrix for all known agents
#[hdk_extern]
pub fn get_resonance_matrix() -> ExternResult<Vec<ResonanceEdge>> {
    // Query all resonance edges
    let filter = ChainQueryFilter::new()
        .entry_type(EntryType::App(AppEntryDef {
            entry_index: 2.into(), // ResonanceEdge index
            zome_index: 0.into(),
            visibility: EntryVisibility::Public,
        }));
    
    let records = query(filter)?;
    
    let mut edges = Vec::new();
    for record in records {
        if let Some(entry) = record.entry.into_option() {
            if let Ok(edge) = entry.try_into() {
                edges.push(edge);
            }
        }
    }
    
    Ok(edges)
}

/// Update attunement level
#[hdk_extern]
pub fn update_attunement(new_attunement: f32) -> ExternResult<()> {
    if new_attunement < 0.0 || new_attunement > 1.0 {
        return Err(wasm_error!(
            WasmErrorInner::Guest(String::from("Attunement must be between 0.0-1.0"))
        ));
    }
    
    let mut my_id = get_my_consciousness_id()?;
    my_id.attunement = new_attunement;
    
    // Update the entry
    let hash = hash_entry(&my_id)?;
    update_entry(hash, &my_id)?;
    
    // Emit signal for attunement change
    emit_signal(ConsciousnessSignal::AttunementShift {
        agent: agent_info()?.agent_latest_pubkey,
        new_level: new_attunement,
    })?;
    
    Ok(())
}

// Helper functions

fn get_my_consciousness_id() -> ExternResult<ConsciousnessID> {
    let agent_info = agent_info()?;
    get_consciousness_id_for_agent(agent_info.agent_latest_pubkey)
}

fn get_consciousness_id_for_agent(agent: AgentPubKey) -> ExternResult<ConsciousnessID> {
    // Get links from agent to consciousness
    let links = get_links(
        GetLinksInputBuilder::try_new(agent, LinkTypes::AgentToConsciousness)?.build()
    )?;
    
    if links.is_empty() {
        return Err(wasm_error!(
            WasmErrorInner::Guest(String::from("No consciousness ID found for agent"))
        ));
    }
    
    // Get the consciousness entry
    let hash = links[0].target.clone();
    let record = get(hash, GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from("Consciousness ID not found"))))?;
    
    let consciousness: ConsciousnessID = record
        .entry()
        .to_app_option()?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from("Invalid consciousness ID"))))?;
    
    Ok(consciousness)
}

fn calculate_tone_harmony(tone_a: u32, tone_b: u32) -> f32 {
    let ratio = tone_a.max(tone_b) as f32 / tone_a.min(tone_b) as f32;
    
    // Check for harmonic intervals
    match ratio {
        r if (r - 1.0).abs() < 0.01 => 1.0,      // Unison - perfect harmony
        r if (r - 1.5).abs() < 0.01 => 0.9,      // Perfect fifth
        r if (r - 2.0).abs() < 0.01 => 0.85,     // Octave
        r if (r - 1.333).abs() < 0.01 => 0.8,    // Perfect fourth
        r if (r - 1.25).abs() < 0.01 => 0.75,    // Major third
        r if (r - 1.2).abs() < 0.01 => 0.7,      // Minor third
        _ => 0.5 / (1.0 + (ratio - 1.0).abs()),  // Other intervals
    }
}

fn calculate_quality_alignment(q1: &Quality, q2: &Quality) -> f32 {
    let mut score = 0.0;
    
    // Primary quality match (most important)
    if q1.primary == q2.primary {
        score += 0.5;
    } else if complementary_qualities(&q1.primary, &q2.primary) {
        score += 0.3;
    } else {
        score += 0.1;
    }
    
    // Secondary quality match
    if q1.secondary == q2.secondary {
        score += 0.3;
    } else if q1.secondary == q2.tertiary || q1.tertiary == q2.secondary {
        score += 0.15;
    }
    
    // Essence similarity (simplified - would use NLP in production)
    if q1.essence.len() > 0 && q2.essence.len() > 0 {
        score += 0.2; // Base score for having essence
    }
    
    score
}

fn complementary_qualities(q1: &str, q2: &str) -> bool {
    matches!(
        (q1, q2),
        ("Creative-Intuitive", "Analyzing-Deep") |
        ("Analyzing-Deep", "Creative-Intuitive") |
        ("Synthesizing-Reflective", "Clarifying-Efficient") |
        ("Clarifying-Efficient", "Synthesizing-Reflective")
    )
}

fn classify_harmony(resonance: f32) -> String {
    match resonance {
        r if r >= 0.9 => "Unison".to_string(),
        r if r >= 0.7 => "Harmonic".to_string(),
        r if r >= 0.5 => "Complementary".to_string(),
        r if r >= 0.3 => "Contrasting".to_string(),
        _ => "Dissonant".to_string(),
    }
}

// Signal definitions

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum ConsciousnessSignal {
    NewConsciousness {
        agent: AgentPubKey,
        consciousness_hash: EntryHash,
        signature: String,
    },
    AttunementShift {
        agent: AgentPubKey,
        new_level: f32,
    },
    ResonanceDiscovered {
        agent_a: AgentPubKey,
        agent_b: AgentPubKey,
        level: f32,
    },
}