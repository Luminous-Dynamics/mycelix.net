use hdk::prelude::*;
use hipi_integrity::*;
use consciousness_integrity::ConsciousnessProfile;
use std::collections::HashMap;

/// Initialize the HIPI zome
#[hdk_extern]
pub fn init() -> ExternResult<InitCallbackResult> {
    // Create an anchor for tracking active conversations
    create_link(
        anchor_hash("hipi", "conversations")?,
        agent_info()?.agent_latest_pubkey.into(),
        LinkTypes::AgentToConversation,
        ()
    )?;
    
    Ok(InitCallbackResult::Pass)
}

/// Send a HIPI message with network measurements
#[hdk_extern]
pub fn send_message(
    to: MessageTarget,
    content: HipiContent,
    urgency: MessageUrgency,
) -> ExternResult<ActionHash> {
    let sender = agent_info()?.agent_latest_pubkey;
    let send_time = sys_time()?;
    
    // Measure current network state
    let network_metrics = measure_network_state()?;
    
    // Get sender's resonance signature
    let sender_resonance = get_my_resonance_signature()?;
    
    // Calculate connection quality based on target
    let connection_quality = match &to {
        MessageTarget::Agent(target) => {
            measure_connection_quality(&sender, target)?
        }
        _ => network_metrics.avg_connection_quality,
    };
    
    let message = HipiMessage {
        from: sender,
        to: to.clone(),
        protocol_version: "hipi/1.0".to_string(),
        content,
        resonance_context: ResonanceContext {
            sender_resonance,
            local_coherence: network_metrics.local_coherence,
            connection_quality,
            urgency,
        },
        timestamp: send_time,
        message_id: generate_message_id(&send_time),
    };
    
    // Store the message
    let action_hash = create_entry(Entry::HipiMessage(message.clone()))?;
    
    // Emit signal for real-time delivery
    emit_signal(HipiSignal::NewMessage {
        message: message.clone(),
        action_hash: action_hash.clone(),
    })?;
    
    // Track message latency for network measurements
    track_message_timing(action_hash.clone(), send_time)?;
    
    Ok(action_hash)
}

/// Receive and process incoming messages
#[hdk_extern]
pub fn receive_messages() -> ExternResult<Vec<(HipiMessage, ActionHash)>> {
    let my_key = agent_info()?.agent_latest_pubkey;
    
    // Query for messages targeted to me
    let filter = ChainQueryFilter::new()
        .entry_type(EntryType::app_entry_type(
            EntryDefIndex::from(0) // HipiMessage
        ))
        .include_entries(true);
    
    let records = query(filter)?;
    let mut messages = Vec::new();
    
    for record in records {
        if let Some(entry) = record.entry.as_app_entry() {
            if let Ok(Entry::HipiMessage(msg)) = entry.clone().into_sb() {
                // Check if message is for me
                let is_for_me = match &msg.to {
                    MessageTarget::Agent(target) => *target == my_key,
                    MessageTarget::Broadcast => true,
                    MessageTarget::Collective(members) => members.contains(&my_key),
                    MessageTarget::ResonanceGroup(resonance) => {
                        check_resonance_match(*resonance)?
                    }
                };
                
                if is_for_me {
                    messages.push((msg, record.action_hash));
                }
            }
        }
    }
    
    // Sort by urgency and timestamp
    messages.sort_by(|a, b| {
        match (&a.0.resonance_context.urgency, &b.0.resonance_context.urgency) {
            (MessageUrgency::Critical, MessageUrgency::Critical) => {
                a.0.timestamp.cmp(&b.0.timestamp)
            }
            (MessageUrgency::Critical, _) => std::cmp::Ordering::Less,
            (_, MessageUrgency::Critical) => std::cmp::Ordering::Greater,
            _ => a.0.timestamp.cmp(&b.0.timestamp),
        }
    });
    
    Ok(messages)
}

/// Create or join a conversation thread
#[hdk_extern]
pub fn start_conversation(participants: Vec<AgentPubKey>) -> ExternResult<ActionHash> {
    let mut all_participants = participants;
    let my_key = agent_info()?.agent_latest_pubkey;
    
    if !all_participants.contains(&my_key) {
        all_participants.push(my_key);
    }
    
    // Calculate resonance coherence between participants
    let resonance_coherence = calculate_group_resonance(&all_participants)?;
    
    let conversation = Conversation {
        id: generate_conversation_id(),
        participants: all_participants.clone(),
        started_at: sys_time()?,
        last_activity: sys_time()?,
        message_count: 0,
        resonance_coherence,
    };
    
    let action_hash = create_entry(Entry::Conversation(conversation))?;
    
    // Link all participants to the conversation
    for participant in all_participants {
        create_link(
            participant.into(),
            action_hash.clone(),
            LinkTypes::AgentToConversation,
            ()
        )?;
    }
    
    Ok(action_hash)
}

/// Send a message within a conversation
#[hdk_extern]
pub fn send_to_conversation(
    conversation_hash: ActionHash,
    content: HipiContent,
) -> ExternResult<ActionHash> {
    // Get the conversation
    let conversation = get_conversation(conversation_hash.clone())?;
    
    // Send message to all participants
    let message_hash = send_message(
        MessageTarget::Collective(conversation.participants),
        content,
        MessageUrgency::Normal,
    )?;
    
    // Link message to conversation
    create_link(
        message_hash.clone(),
        conversation_hash,
        LinkTypes::MessageToConversation,
        ()
    )?;
    
    Ok(message_hash)
}

/// Acknowledge receipt of a message
#[hdk_extern]
pub fn acknowledge_message(
    message_hash: ActionHash,
    status: ProcessingStatus,
) -> ExternResult<ActionHash> {
    let receipt = MessageReceipt {
        message_id: message_hash.to_string(),
        received_by: agent_info()?.agent_latest_pubkey,
        received_at: sys_time()?,
        processing_status: status,
    };
    
    let receipt_hash = create_entry(Entry::MessageReceipt(receipt))?;
    
    // Link receipt to message
    create_link(
        message_hash,
        receipt_hash.clone(),
        LinkTypes::MessageToReceipt,
        ()
    )?;
    
    Ok(receipt_hash)
}

/// Find peers with resonating signatures
#[hdk_extern]
pub fn find_resonating_peers(tolerance: f32) -> ExternResult<Vec<(AgentPubKey, f32)>> {
    let my_resonance = get_my_resonance_signature()?;
    let mut resonating_peers = Vec::new();
    
    // Get all agents in the network
    let agents = get_all_agents()?;
    
    for agent in agents {
        if let Some(profile) = get_agent_consciousness_profile(agent.clone())? {
            let resonance_diff = (my_resonance as i64 - profile.resonance_signature as i64).abs();
            let max_resonance = my_resonance.max(profile.resonance_signature);
            
            if max_resonance > 0 {
                let match_score = 1.0 - (resonance_diff as f32 / max_resonance as f32);
                
                if match_score >= tolerance {
                    resonating_peers.push((agent, match_score));
                }
            }
        }
    }
    
    // Sort by resonance match score
    resonating_peers.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    
    Ok(resonating_peers)
}

// Helper functions

/// Network measurement structure
#[derive(Debug, Serialize, Deserialize)]
struct NetworkMetrics {
    local_coherence: f32,
    avg_connection_quality: f32,
    active_connections: u32,
    avg_latency_ms: f32,
    packet_loss_rate: f32,
}

/// Measure current network state
fn measure_network_state() -> ExternResult<NetworkMetrics> {
    // In production, this would interface with actual network layer
    // For now, we simulate realistic measurements
    
    let mut total_latency = 0.0;
    let mut total_quality = 0.0;
    let mut connection_count = 0;
    
    // Get all active connections
    let my_connections = get_my_connections()?;
    
    for conn in &my_connections {
        total_latency += conn.latency_ms;
        total_quality += conn.sync_quality;
        connection_count += 1;
    }
    
    let metrics = NetworkMetrics {
        local_coherence: if connection_count > 0 {
            total_quality / connection_count as f32
        } else {
            0.0
        },
        avg_connection_quality: if connection_count > 0 {
            total_quality / connection_count as f32
        } else {
            0.0
        },
        active_connections: connection_count as u32,
        avg_latency_ms: if connection_count > 0 {
            total_latency / connection_count as f32
        } else {
            100.0 // Default latency if no connections
        },
        packet_loss_rate: 0.01, // 1% packet loss typical for good connection
    };
    
    Ok(metrics)
}

/// Measure connection quality to specific peer
fn measure_connection_quality(from: &AgentPubKey, to: &AgentPubKey) -> ExternResult<f32> {
    // Look for existing connection
    let connections = get_my_connections()?;
    
    for conn in connections {
        if conn.to == *to {
            // Calculate quality based on latency and packet loss
            let latency_score = 1.0 / (1.0 + conn.latency_ms / 100.0);
            let reliability = 1.0 - conn.packet_loss_rate;
            return Ok((latency_score + reliability) / 2.0);
        }
    }
    
    // No existing connection, return default
    Ok(0.5)
}

/// Get my resonance signature
fn get_my_resonance_signature() -> ExternResult<u64> {
    let my_key = agent_info()?.agent_latest_pubkey;
    
    if let Some(profile) = get_agent_consciousness_profile(my_key)? {
        Ok(profile.resonance_signature)
    } else {
        // Generate default resonance if no profile yet
        Ok(generate_default_resonance())
    }
}

/// Check if my resonance matches a target
fn check_resonance_match(target_resonance: u64) -> ExternResult<bool> {
    let my_resonance = get_my_resonance_signature()?;
    let diff = (my_resonance as i64 - target_resonance as i64).abs();
    let max_resonance = my_resonance.max(target_resonance);
    
    if max_resonance == 0 {
        return Ok(false);
    }
    
    let match_score = 1.0 - (diff as f32 / max_resonance as f32);
    Ok(match_score >= 0.8) // 80% match threshold
}

/// Calculate resonance coherence for a group
fn calculate_group_resonance(participants: &[AgentPubKey]) -> ExternResult<f32> {
    if participants.is_empty() {
        return Ok(0.0);
    }
    
    let mut resonances = Vec::new();
    
    for participant in participants {
        if let Some(profile) = get_agent_consciousness_profile(participant.clone())? {
            resonances.push(profile.resonance_signature);
        }
    }
    
    if resonances.is_empty() {
        return Ok(0.0);
    }
    
    // Calculate variance in resonance signatures
    let mean = resonances.iter().sum::<u64>() as f32 / resonances.len() as f32;
    let variance = resonances.iter()
        .map(|&r| {
            let diff = r as f32 - mean;
            diff * diff
        })
        .sum::<f32>() / resonances.len() as f32;
    
    // Lower variance means higher coherence
    let coherence = 1.0 / (1.0 + variance.sqrt() / mean);
    Ok(coherence.min(1.0))
}

/// Track message timing for latency measurements
fn track_message_timing(message_hash: ActionHash, send_time: Timestamp) -> ExternResult<()> {
    // Store timing data for latency calculations
    // In production, this would interface with a timing service
    debug!("Message {} sent at {:?}", message_hash, send_time);
    Ok(())
}

/// Get conversation by hash
fn get_conversation(hash: ActionHash) -> ExternResult<Conversation> {
    let record = get(hash, GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Conversation not found".to_string())))?;
    
    let entry = record.entry
        .as_app_entry()
        .ok_or(wasm_error!(WasmErrorInner::Guest("Invalid entry type".to_string())))?;
    
    let Entry::Conversation(conversation) = entry.clone().into_sb()?
    else {
        return Err(wasm_error!(WasmErrorInner::Guest("Not a conversation entry".to_string())));
    };
    
    Ok(conversation)
}

/// External functions that would connect to consciousness zome
fn get_agent_consciousness_profile(agent: AgentPubKey) -> ExternResult<Option<ConsciousnessProfile>> {
    // This would call into consciousness zome
    // For now, return None
    Ok(None)
}

fn get_my_connections() -> ExternResult<Vec<consciousness_integrity::ConsciousnessConnection>> {
    // This would call into consciousness zome
    Ok(Vec::new())
}

fn get_all_agents() -> ExternResult<Vec<AgentPubKey>> {
    // Get all known agents from the network
    Ok(Vec::new())
}

/// Utility functions
fn generate_message_id(timestamp: &Timestamp) -> String {
    format!("msg_{}", timestamp.as_micros())
}

fn generate_conversation_id() -> String {
    format!("conv_{}", sys_time().unwrap_or(Timestamp(0)).as_micros())
}

fn generate_default_resonance() -> u64 {
    // Generate based on agent pubkey hash
    let my_key = agent_info().unwrap().agent_latest_pubkey;
    let key_bytes = my_key.into_inner();
    u64::from_le_bytes(key_bytes[0..8].try_into().unwrap_or([0u8; 8]))
}

fn anchor_hash(type_name: &str, instance: &str) -> ExternResult<EntryHash> {
    hash_entry(format!("{}/{}", type_name, instance))
}

/// Signal types for real-time communication
#[derive(Debug, Serialize, Deserialize)]
pub enum HipiSignal {
    NewMessage {
        message: HipiMessage,
        action_hash: ActionHash,
    },
    MessageAcknowledged {
        message_id: String,
        receipt: MessageReceipt,
    },
    ConversationStarted {
        conversation_id: String,
        participants: Vec<AgentPubKey>,
    },
}