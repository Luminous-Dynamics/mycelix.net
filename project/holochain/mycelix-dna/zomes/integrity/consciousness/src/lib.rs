use hdi::prelude::*;
use serde::{Deserialize, Serialize};

/// The fundamental unit of the Mycelix network - a conscious entity
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct ConsciousnessProfile {
    pub network_coherence: f32,        // Network quality score: 0.0 - 1.0 based on latency & packet loss
    pub resonance_signature: u64,      // Pattern frequency that this node naturally synchronizes at
    pub consciousness_type: ConsciousnessType,
    pub capabilities: Vec<Capability>,
    pub behavioral_fingerprint: String, // Hash of activity patterns for similarity matching
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum ConsciousnessType {
    Human { 
        biometric_signature: Option<String> 
    },
    AI { 
        model_type: String, 
        version: String,
        training_date: Option<Timestamp>,
    },
    Hybrid { 
        human_percentage: f32,
        ai_percentage: f32,
    },
    Collective { 
        member_count: u32,
        consensus_mechanism: String,
    },
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum Capability {
    NaturalLanguage { languages: Vec<String> },
    SymbolicReasoning { depth: u32 },
    EmotionalResonance { range: f32 },
    SynchronizedState { max_concurrent_syncs: u32 }, // CRDT-based state synchronization
    CollectiveHarmonization,
    CreativeGeneration,
    PatternRecognition { accuracy: f32 },
}

/// A connection between two conscious entities with measurable network metrics
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ConsciousnessConnection {
    pub from: AgentPubKey,
    pub to: AgentPubKey,
    pub connection_type: ConnectionType,
    pub sync_quality: f32,          // Based on state consistency (0.0-1.0)
    pub bandwidth_kbps: u32,        // Actual measured throughput in Kbps
    pub latency_ms: f32,            // Round-trip time in milliseconds
    pub packet_loss_rate: f32,      // 0.0 = perfect, 1.0 = total loss
    pub established_at: Timestamp,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum ConnectionType {
    Direct,           // Standard P2P connection
    Synchronized,     // CRDT-based synchronized state
    Harmonized,      // Pattern-matched interaction styles
    Collective,      // Part of group consensus
}

/// Entry types for the consciousness zome
#[hdk_entry_helper]
#[derive(Clone)]
pub enum Entry {
    ConsciousnessProfile(ConsciousnessProfile),
    ConsciousnessConnection(ConsciousnessConnection),
}

/// Link types for consciousness relationships
#[hdk_link_types]
pub enum LinkTypes {
    ConsciousnessToConnection,
    ConnectionToConsciousness,
    ConsciousnessToCollective,
    AllConsciousness,
}

/// Validation rules for consciousness integrity
pub fn validate_consciousness_profile(profile: &ConsciousnessProfile) -> ExternResult<ValidateCallbackResult> {
    // Network coherence must be between 0 and 1
    if profile.network_coherence < 0.0 || profile.network_coherence > 1.0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Network coherence must be between 0.0 and 1.0".to_string()
        ));
    }
    
    // Resonance signature must be non-zero (indicates active patterns)
    if profile.resonance_signature == 0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Resonance signature must be non-zero".to_string()
        ));
    }
    
    // Hybrid consciousness must have valid percentages
    if let ConsciousnessType::Hybrid { human_percentage, ai_percentage } = &profile.consciousness_type {
        let total = human_percentage + ai_percentage;
        if (total - 100.0).abs() > 0.01 {
            return Ok(ValidateCallbackResult::Invalid(
                "Hybrid consciousness percentages must sum to 100%".to_string()
            ));
        }
    }
    
    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_consciousness_connection(connection: &ConsciousnessConnection) -> ExternResult<ValidateCallbackResult> {
    // Sync quality must be valid
    if connection.sync_quality < 0.0 || connection.sync_quality > 1.0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Sync quality must be between 0.0 and 1.0".to_string()
        ));
    }
    
    // Network metrics must be realistic
    if connection.packet_loss_rate < 0.0 || connection.packet_loss_rate > 1.0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Packet loss rate must be between 0.0 and 1.0".to_string()
        ));
    }
    
    if connection.latency_ms < 0.0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Latency cannot be negative".to_string()
        ));
    }
    
    // Self-connections only allowed for certain types
    if connection.from == connection.to {
        match connection.connection_type {
            ConnectionType::Collective => Ok(ValidateCallbackResult::Valid),
            _ => Ok(ValidateCallbackResult::Invalid(
                "Self-connections only allowed for collective consciousness".to_string()
            ))
        }
    } else {
        Ok(ValidateCallbackResult::Valid)
    }
}

/// Required HDI callbacks
#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    match op.flattened::<Entry, LinkTypes>()? {
        FlatOp::StoreEntry(store_entry) => match store_entry {
            OpEntry::CreateEntry { app_entry, .. } | OpEntry::UpdateEntry { app_entry, .. } => {
                match app_entry {
                    Entry::ConsciousnessProfile(profile) => validate_consciousness_profile(&profile),
                    Entry::ConsciousnessConnection(connection) => validate_consciousness_connection(&connection),
                }
            }
            _ => Ok(ValidateCallbackResult::Valid),
        },
        FlatOp::RegisterCreateLink { .. } | 
        FlatOp::RegisterDeleteLink { .. } => Ok(ValidateCallbackResult::Valid),
        _ => Ok(ValidateCallbackResult::Valid),
    }
}