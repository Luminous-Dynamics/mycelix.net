use hdk::prelude::*;
use serde::{Deserialize, Serialize};

/// HIPI Message Entry - Core structure for universal communication
#[hdk_entry_helper]
#[derive(Clone)]
pub struct HipiMessage {
    pub content: String,
    pub sender: AgentPubKey,
    pub timestamp: Timestamp,
    pub message_type: MessageType,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum MessageType {
    Broadcast,
    Direct { recipient: AgentPubKey },
    Group { group_id: String },
}

/// Resonance Signature Entry - For peer discovery
#[hdk_entry_helper]
#[derive(Clone)]
pub struct ResonanceSignature {
    pub signature: u64,
    pub agent: AgentPubKey,
    pub timestamp: Timestamp,
}

/// Network Metrics Entry
#[hdk_entry_helper]
#[derive(Clone)]
pub struct NetworkMetrics {
    pub latency_ms: f32,
    pub bandwidth_kbps: f32,
    pub packet_loss: f32,
    pub jitter_ms: f32,
    pub coherence: f32,
    pub timestamp: Timestamp,
}

#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}

/// Send a HIPI message
#[hdk_extern]
pub fn send_hipi_message(message: HipiMessage) -> ExternResult<ActionHash> {
    create_entry(&message)
}

/// Update resonance signature
#[hdk_extern]
pub fn update_resonance_signature(signature: u64) -> ExternResult<ActionHash> {
    let resonance = ResonanceSignature {
        signature,
        agent: agent_info()?.agent_latest_pubkey,
        timestamp: sys_time()?,
    };
    create_entry(&resonance)
}

/// Get messages by type
#[hdk_extern]
pub fn get_messages_by_type(message_type: MessageType) -> ExternResult<Vec<HipiMessage>> {
    let messages = get_all_entries::<HipiMessage>()?;
    
    Ok(messages
        .into_iter()
        .filter(|msg| matches!(&msg.message_type, message_type))
        .collect())
}

/// Find resonating peers based on signature similarity
#[hdk_extern]
pub fn find_resonating_peers(threshold: f32) -> ExternResult<Vec<AgentPubKey>> {
    let my_signature = get_latest_signature()?;
    let all_signatures = get_all_entries::<ResonanceSignature>()?;
    
    let mut resonating_peers = Vec::new();
    
    for sig in all_signatures {
        if sig.agent != agent_info()?.agent_latest_pubkey {
            let match_score = calculate_resonance(my_signature, sig.signature);
            if match_score > threshold {
                resonating_peers.push(sig.agent);
            }
        }
    }
    
    Ok(resonating_peers)
}

/// Record network metrics
#[hdk_extern]
pub fn record_network_metrics(metrics: NetworkMetrics) -> ExternResult<ActionHash> {
    create_entry(&metrics)
}

/// Get network coherence (average of recent coherence values)
#[hdk_extern]
pub fn get_network_coherence() -> ExternResult<f32> {
    let metrics = get_all_entries::<NetworkMetrics>()?;
    
    if metrics.is_empty() {
        return Ok(0.0);
    }
    
    let total: f32 = metrics.iter().map(|m| m.coherence).sum();
    Ok(total / metrics.len() as f32)
}

// Helper functions

fn get_latest_signature() -> ExternResult<u64> {
    let signatures = get_all_entries::<ResonanceSignature>()?;
    
    signatures
        .into_iter()
        .filter(|s| s.agent == agent_info()?.agent_latest_pubkey)
        .max_by_key(|s| s.timestamp)
        .map(|s| s.signature)
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("No signature found".to_string())))
}

fn get_all_entries<T: TryFrom<SerializedBytes>>() -> ExternResult<Vec<T>> {
    // In a real implementation, this would query the DHT
    // For now, return empty vec as placeholder
    Ok(Vec::new())
}

fn calculate_resonance(sig1: u64, sig2: u64) -> f32 {
    // Calculate similarity between two signatures
    let diff = (sig1 as i64 - sig2 as i64).abs();
    let max_diff = u64::MAX as f64;
    1.0 - (diff as f64 / max_diff) as f32
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_resonance_calculation() {
        assert_eq!(calculate_resonance(100, 100), 1.0);
        assert!(calculate_resonance(100, 200) < 1.0);
        assert!(calculate_resonance(100, 200) > 0.0);
    }
}