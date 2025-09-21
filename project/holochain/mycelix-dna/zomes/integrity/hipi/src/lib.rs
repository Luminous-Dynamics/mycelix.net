use hdi::prelude::*;
use serde::{Deserialize, Serialize};

/// HIPI - Harmonized Intelligence Protocol Interface
/// A universal communication protocol for consciousness networking
/// Supports natural language, symbolic reasoning, and pattern-based communication

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct HipiMessage {
    pub from: AgentPubKey,
    pub to: MessageTarget,
    pub protocol_version: String,
    pub content: HipiContent,
    pub resonance_context: ResonanceContext,
    pub timestamp: Timestamp,
    pub message_id: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum MessageTarget {
    Agent(AgentPubKey),              // Direct message to specific agent
    Broadcast,                        // Broadcast to all connected peers
    Collective(Vec<AgentPubKey>),    // Message to collective group
    ResonanceGroup(u64),             // Message to all with similar resonance
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum HipiContent {
    // Natural language communication
    Text {
        message: String,
        language: String,
        sentiment: Option<f32>,       // -1.0 (negative) to 1.0 (positive)
    },
    
    // Structured data exchange
    Data {
        format: DataFormat,
        payload: Vec<u8>,
        schema_hash: Option<String>,
    },
    
    // Pattern-based communication (for AI-AI or advanced interfaces)
    Pattern {
        pattern_type: PatternType,
        values: Vec<f32>,            // Numerical pattern representation
        dimensionality: u32,         // Number of dimensions in pattern
    },
    
    // Intent and action messages
    Intent {
        action: String,
        parameters: Vec<Parameter>,
        confidence: f32,             // 0.0 to 1.0
    },
    
    // State synchronization messages
    StateSync {
        state_type: String,
        state_hash: String,
        diff_data: Option<Vec<u8>>,  // CRDT delta or diff
    },
    
    // Resonance discovery/matching
    ResonanceProbe {
        my_signature: u64,
        seeking_range: (u64, u64),   // Min and max resonance sought
    },
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum DataFormat {
    Json,
    MessagePack,
    Protobuf,
    Raw,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum PatternType {
    Embedding,        // Vector embedding (like from an LLM)
    Frequency,        // Frequency domain pattern
    Temporal,         // Time-series pattern
    Spatial,          // Spatial/geometric pattern
    Semantic,         // Semantic graph pattern
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Parameter {
    pub name: String,
    pub value: ParameterValue,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum ParameterValue {
    String(String),
    Number(f64),
    Boolean(bool),
    List(Vec<ParameterValue>),
}

/// Context about the resonance state when message was sent
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct ResonanceContext {
    pub sender_resonance: u64,        // Sender's current resonance signature
    pub local_coherence: f32,         // Sender's network coherence (0.0-1.0)
    pub connection_quality: f32,      // Quality of connection to recipient (0.0-1.0)
    pub urgency: MessageUrgency,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum MessageUrgency {
    Low,      // Can be processed when convenient
    Normal,   // Standard priority
    High,     // Should be processed soon
    Critical, // Requires immediate attention
}

/// Message receipt confirmation
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MessageReceipt {
    pub message_id: String,
    pub received_by: AgentPubKey,
    pub received_at: Timestamp,
    pub processing_status: ProcessingStatus,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum ProcessingStatus {
    Received,           // Message received but not processed
    Processing,         // Currently being processed
    Processed,          // Successfully processed
    Failed(String),     // Processing failed with reason
    Deferred,          // Processing deferred for later
}

/// Conversation thread tracking
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Conversation {
    pub id: String,
    pub participants: Vec<AgentPubKey>,
    pub started_at: Timestamp,
    pub last_activity: Timestamp,
    pub message_count: u32,
    pub resonance_coherence: f32,    // How well participants resonate
}

/// Entry types for HIPI
#[hdk_entry_helper]
#[derive(Clone)]
pub enum Entry {
    HipiMessage(HipiMessage),
    MessageReceipt(MessageReceipt),
    Conversation(Conversation),
}

/// Link types for HIPI relationships
#[hdk_link_types]
pub enum LinkTypes {
    MessageToConversation,
    ConversationToMessage,
    AgentToConversation,
    MessageToReceipt,
    ReplyChain,              // Links messages in reply chains
}

/// Validation for HIPI messages
pub fn validate_hipi_message(message: &HipiMessage) -> ExternResult<ValidateCallbackResult> {
    // Validate protocol version
    if !message.protocol_version.starts_with("hipi/1.") {
        return Ok(ValidateCallbackResult::Invalid(
            "Unsupported HIPI protocol version".to_string()
        ));
    }
    
    // Validate resonance context
    if message.resonance_context.local_coherence < 0.0 || 
       message.resonance_context.local_coherence > 1.0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Local coherence must be between 0.0 and 1.0".to_string()
        ));
    }
    
    if message.resonance_context.connection_quality < 0.0 || 
       message.resonance_context.connection_quality > 1.0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Connection quality must be between 0.0 and 1.0".to_string()
        ));
    }
    
    // Validate content-specific rules
    match &message.content {
        HipiContent::Text { sentiment, .. } => {
            if let Some(s) = sentiment {
                if *s < -1.0 || *s > 1.0 {
                    return Ok(ValidateCallbackResult::Invalid(
                        "Sentiment must be between -1.0 and 1.0".to_string()
                    ));
                }
            }
        }
        HipiContent::Pattern { values, dimensionality, .. } => {
            if values.len() != *dimensionality as usize {
                return Ok(ValidateCallbackResult::Invalid(
                    "Pattern values length must match dimensionality".to_string()
                ));
            }
        }
        HipiContent::Intent { confidence, .. } => {
            if *confidence < 0.0 || *confidence > 1.0 {
                return Ok(ValidateCallbackResult::Invalid(
                    "Intent confidence must be between 0.0 and 1.0".to_string()
                ));
            }
        }
        HipiContent::ResonanceProbe { seeking_range, .. } => {
            if seeking_range.0 > seeking_range.1 {
                return Ok(ValidateCallbackResult::Invalid(
                    "Invalid resonance range".to_string()
                ));
            }
        }
        _ => {}
    }
    
    Ok(ValidateCallbackResult::Valid)
}

/// Validation for conversations
pub fn validate_conversation(conversation: &Conversation) -> ExternResult<ValidateCallbackResult> {
    // Must have at least 2 participants
    if conversation.participants.len() < 2 {
        return Ok(ValidateCallbackResult::Invalid(
            "Conversation must have at least 2 participants".to_string()
        ));
    }
    
    // Resonance coherence must be valid
    if conversation.resonance_coherence < 0.0 || conversation.resonance_coherence > 1.0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Resonance coherence must be between 0.0 and 1.0".to_string()
        ));
    }
    
    Ok(ValidateCallbackResult::Valid)
}

/// Required HDI callbacks
#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    match op.flattened::<Entry, LinkTypes>()? {
        FlatOp::StoreEntry(store_entry) => match store_entry {
            OpEntry::CreateEntry { app_entry, .. } | OpEntry::UpdateEntry { app_entry, .. } => {
                match app_entry {
                    Entry::HipiMessage(message) => validate_hipi_message(&message),
                    Entry::MessageReceipt(_) => Ok(ValidateCallbackResult::Valid),
                    Entry::Conversation(conversation) => validate_conversation(&conversation),
                }
            }
            _ => Ok(ValidateCallbackResult::Valid),
        },
        _ => Ok(ValidateCallbackResult::Valid),
    }
}