use holochain_client::{
    AgentPubKey, AppWebsocket, ConductorApiError,
    ZomeCallTarget, AppInfo,
};
use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};

/// Connect to Holochain conductor
pub async fn connect_to_conductor() -> Result<AppWebsocket> {
    let conductor_url = std::env::var("HOLOCHAIN_CONDUCTOR_URL")
        .unwrap_or_else(|_| "ws://localhost:8888".to_string());
    
    let app_id = std::env::var("HOLOCHAIN_APP_ID")
        .unwrap_or_else(|_| "mycelix".to_string());
    
    let client = AppWebsocket::connect(conductor_url)
        .await
        .context("Failed to connect to Holochain conductor")?;
    
    // Get app info to verify connection
    let app_info = client.app_info(app_id.clone())
        .await
        .context("Failed to get app info")?;
    
    if let Some(info) = app_info {
        tracing::info!("Connected to Holochain app: {:?}", info.installed_app_id);
    } else {
        anyhow::bail!("App {} not found in conductor", app_id);
    }
    
    Ok(client)
}

/// Send HIPI message through Holochain
pub async fn send_hipi_message(
    client: &AppWebsocket,
    content: String,
    target: crate::MessageTarget,
) -> Result<holochain_types::prelude::ActionHash> {
    let payload = HipiMessagePayload {
        content: HipiContent::Text {
            message: content,
            language: "en".to_string(),
            sentiment: None,
        },
        target: match target {
            crate::MessageTarget::Agent(key) => MessageTarget::Agent(key),
            crate::MessageTarget::Broadcast => MessageTarget::Broadcast,
            crate::MessageTarget::ResonanceGroup(sig) => MessageTarget::ResonanceGroup(sig),
        },
        urgency: MessageUrgency::Normal,
    };
    
    let response = client
        .call_zome(
            "mycelix".into(),
            "hipi".into(),
            "send_message".into(),
            payload,
        )
        .await?;
    
    // Deserialize the ActionHash from response
    let hash: holochain_types::prelude::ActionHash = rmp_serde::from_slice(&response)
        .context("Failed to deserialize ActionHash")?;
    
    Ok(hash)
}

/// Get consciousness profile from Holochain
pub async fn get_consciousness_profile(
    client: &AppWebsocket,
    agent: AgentPubKey,
) -> Result<Option<ConsciousnessProfile>> {
    let response = client
        .call_zome(
            "mycelix".into(),
            "consciousness".into(),
            "get_consciousness_profile".into(),
            agent,
        )
        .await?;
    
    let profile: Option<ConsciousnessProfile> = rmp_serde::from_slice(&response)
        .context("Failed to deserialize ConsciousnessProfile")?;
    
    Ok(profile)
}

/// Measure network field through Holochain
pub async fn measure_field(
    client: &AppWebsocket,
) -> Result<FieldDensity> {
    let response = client
        .call_zome(
            "mycelix".into(),
            "field".into(),
            "measure_field_density".into(),
            (),
        )
        .await?;
    
    let density: FieldDensity = rmp_serde::from_slice(&response)
        .context("Failed to deserialize FieldDensity")?;
    
    Ok(density)
}

/// Find resonating peers
pub async fn find_resonating_peers(
    client: &AppWebsocket,
    tolerance: f32,
) -> Result<Vec<(AgentPubKey, f32)>> {
    let response = client
        .call_zome(
            "mycelix".into(),
            "hipi".into(),
            "find_resonating_peers".into(),
            tolerance,
        )
        .await?;
    
    let peers: Vec<(AgentPubKey, f32)> = rmp_serde::from_slice(&response)
        .context("Failed to deserialize resonating peers")?;
    
    Ok(peers)
}

// Type definitions matching the Holochain DNA

#[derive(Serialize, Deserialize)]
struct HipiMessagePayload {
    content: HipiContent,
    target: MessageTarget,
    urgency: MessageUrgency,
}

#[derive(Serialize, Deserialize)]
enum HipiContent {
    Text {
        message: String,
        language: String,
        sentiment: Option<f32>,
    },
    Data {
        format: DataFormat,
        payload: Vec<u8>,
        schema_hash: Option<String>,
    },
    Pattern {
        pattern_type: PatternType,
        values: Vec<f32>,
        dimensionality: u32,
    },
    Intent {
        action: String,
        parameters: Vec<Parameter>,
        confidence: f32,
    },
    StateSync {
        state_type: String,
        state_hash: String,
        diff_data: Option<Vec<u8>>,
    },
    ResonanceProbe {
        my_signature: u64,
        seeking_range: (u64, u64),
    },
}

#[derive(Serialize, Deserialize)]
enum DataFormat {
    Json,
    MessagePack,
    Protobuf,
    Raw,
}

#[derive(Serialize, Deserialize)]
enum PatternType {
    Embedding,
    Frequency,
    Temporal,
    Spatial,
    Semantic,
}

#[derive(Serialize, Deserialize)]
struct Parameter {
    name: String,
    value: ParameterValue,
}

#[derive(Serialize, Deserialize)]
enum ParameterValue {
    String(String),
    Number(f64),
    Boolean(bool),
    List(Vec<ParameterValue>),
}

#[derive(Serialize, Deserialize)]
enum MessageTarget {
    Agent(AgentPubKey),
    Broadcast,
    Collective(Vec<AgentPubKey>),
    ResonanceGroup(u64),
}

#[derive(Serialize, Deserialize)]
enum MessageUrgency {
    Low,
    Normal,
    High,
    Critical,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ConsciousnessProfile {
    pub network_coherence: f32,
    pub resonance_signature: u64,
    pub consciousness_type: ConsciousnessType,
    pub behavioral_fingerprint: String,
    pub trust_scores: Vec<(AgentPubKey, f32)>,
    pub field_strength: f32,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum ConsciousnessType {
    Individual,
    Collective,
    Hybrid,
    Emergent,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FieldDensity {
    pub location: AgentPubKey,
    pub direct_connections: u32,
    pub two_hop_connections: u32,
    pub clustering_coefficient: f32,
    pub avg_connection_quality: f32,
    pub network_diameter: u32,
}