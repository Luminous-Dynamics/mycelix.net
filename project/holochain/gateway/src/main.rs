use axum::{
    extract::{ws::WebSocket, State, WebSocketUpgrade},
    response::Response,
    routing::get,
    Router,
};
use dashmap::DashMap;
use holochain_client::{AgentPubKey, AppWebsocket, ConductorApiError};
use serde::{Deserialize, Serialize};
use std::{net::SocketAddr, sync::Arc, time::Duration};
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;
use tracing::{error, info, warn};
use uuid::Uuid;

mod resonance;
mod crdt_sync;
mod holochain_bridge;
mod types;

use crate::types::*;

/// Application state shared across all connections
#[derive(Clone)]
struct AppState {
    /// Connection to Holochain conductor
    holo_client: Arc<RwLock<AppWebsocket>>,
    
    /// Active WebSocket connections
    connections: Arc<DashMap<Uuid, PeerConnection>>,
    
    /// CRDT synchronization engine
    crdt_engine: Arc<crdt_sync::CrdtEngine>,
    
    /// Resonance matching engine
    resonance_matcher: Arc<resonance::ResonanceMatcher>,
}

/// Represents a connected peer
struct PeerConnection {
    id: Uuid,
    agent_key: Option<AgentPubKey>,
    resonance_signature: Option<u64>,
    last_heartbeat: chrono::DateTime<chrono::Utc>,
    metrics: ConnectionMetrics,
}

/// Real network metrics for a connection
#[derive(Default, Clone)]
struct ConnectionMetrics {
    latency_ms: f32,
    bandwidth_kbps: u32,
    packet_loss_rate: f32,
    messages_per_hour: f32,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();
    
    info!("🍄 Mycelix Gateway starting...");
    
    // Connect to Holochain conductor
    let holo_client = match holochain_bridge::connect_to_conductor().await {
        Ok(client) => Arc::new(RwLock::new(client)),
        Err(e) => {
            error!("Failed to connect to Holochain conductor: {}", e);
            std::process::exit(1);
        }
    };
    
    // Initialize CRDT engine for distributed state
    let crdt_engine = Arc::new(crdt_sync::CrdtEngine::new());
    
    // Initialize resonance matcher
    let resonance_matcher = Arc::new(resonance::ResonanceMatcher::new());
    
    // Create shared state
    let app_state = AppState {
        holo_client,
        connections: Arc::new(DashMap::new()),
        crdt_engine,
        resonance_matcher,
    };
    
    // Spawn background tasks
    tokio::spawn(heartbeat_monitor(app_state.clone()));
    tokio::spawn(resonance_discovery(app_state.clone()));
    
    // Build router
    let app = Router::new()
        .route("/ws", get(websocket_handler))
        .route("/health", get(health_check))
        .route("/metrics", get(network_metrics))
        .layer(CorsLayer::permissive())
        .with_state(app_state);
    
    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 8765));
    info!("🌐 Gateway listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

/// WebSocket connection handler
async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

/// Handle individual WebSocket connection
async fn handle_socket(mut socket: WebSocket, state: AppState) {
    let peer_id = Uuid::new_v4();
    info!("New connection: {}", peer_id);
    
    // Register connection
    state.connections.insert(
        peer_id,
        PeerConnection {
            id: peer_id,
            agent_key: None,
            resonance_signature: None,
            last_heartbeat: chrono::Utc::now(),
            metrics: ConnectionMetrics::default(),
        },
    );
    
    // Message handling loop
    while let Some(msg) = socket.recv().await {
        match msg {
            Ok(axum::extract::ws::Message::Text(text)) => {
                if let Ok(message) = serde_json::from_str::<ClientMessage>(&text) {
                    handle_client_message(peer_id, message, &state).await;
                }
            }
            Ok(axum::extract::ws::Message::Binary(data)) => {
                // Handle CRDT sync messages
                state.crdt_engine.handle_sync_message(&data).await;
            }
            Ok(axum::extract::ws::Message::Close(_)) => {
                break;
            }
            _ => {}
        }
    }
    
    // Cleanup on disconnect
    state.connections.remove(&peer_id);
    info!("Connection closed: {}", peer_id);
}

/// Handle messages from clients
async fn handle_client_message(
    peer_id: Uuid,
    message: ClientMessage,
    state: &AppState,
) {
    match message {
        ClientMessage::Authenticate { agent_key } => {
            // Update peer with agent key
            if let Some(mut peer) = state.connections.get_mut(&peer_id) {
                peer.agent_key = Some(agent_key);
            }
        }
        
        ClientMessage::SendHipi { content, target } => {
            // Forward to Holochain
            let holo_client = state.holo_client.read().await;
            match holochain_bridge::send_hipi_message(&holo_client, content, target).await {
                Ok(hash) => {
                    info!("HIPI message sent: {:?}", hash);
                }
                Err(e) => {
                    error!("Failed to send HIPI message: {}", e);
                }
            }
        }
        
        ClientMessage::UpdateResonance { signature } => {
            // Update resonance signature
            if let Some(mut peer) = state.connections.get_mut(&peer_id) {
                peer.resonance_signature = Some(signature);
                
                // Trigger resonance matching
                let matches = state.resonance_matcher
                    .find_matches(signature, 0.8)
                    .await;
                    
                info!("Found {} resonance matches for peer {}", matches.len(), peer_id);
            }
        }
        
        ClientMessage::MeasureField => {
            // Perform network field measurement
            let metrics = measure_network_field(state).await;
            info!("Field measurement: {:?}", metrics);
        }
        
        ClientMessage::SyncState { state_type, data } => {
            // Handle CRDT state synchronization
            state.crdt_engine.merge_state(&state_type, &data).await;
        }
    }
}

/// Monitor connection heartbeats
async fn heartbeat_monitor(state: AppState) {
    let mut interval = tokio::time::interval(Duration::from_secs(30));
    
    loop {
        interval.tick().await;
        
        let now = chrono::Utc::now();
        let timeout = chrono::Duration::seconds(60);
        
        // Remove stale connections
        let stale_peers: Vec<Uuid> = state
            .connections
            .iter()
            .filter(|entry| now - entry.last_heartbeat > timeout)
            .map(|entry| *entry.key())
            .collect();
        
        for peer_id in stale_peers {
            warn!("Removing stale connection: {}", peer_id);
            state.connections.remove(&peer_id);
        }
    }
}

/// Periodic resonance discovery
async fn resonance_discovery(state: AppState) {
    let mut interval = tokio::time::interval(Duration::from_secs(60));
    
    loop {
        interval.tick().await;
        
        // Calculate network-wide resonance patterns
        let signatures: Vec<u64> = state
            .connections
            .iter()
            .filter_map(|entry| entry.resonance_signature)
            .collect();
        
        if !signatures.is_empty() {
            let coherence = resonance::calculate_network_coherence(&signatures);
            info!("Network resonance coherence: {:.2}%", coherence * 100.0);
        }
    }
}

/// Measure network field metrics
async fn measure_network_field(state: &AppState) -> FieldMetrics {
    let connection_count = state.connections.len();
    
    // Calculate average metrics
    let mut total_latency = 0.0;
    let mut total_bandwidth = 0;
    let mut count = 0;
    
    for entry in state.connections.iter() {
        total_latency += entry.metrics.latency_ms;
        total_bandwidth += entry.metrics.bandwidth_kbps;
        count += 1;
    }
    
    FieldMetrics {
        active_connections: connection_count,
        avg_latency_ms: if count > 0 { total_latency / count as f32 } else { 0.0 },
        avg_bandwidth_kbps: if count > 0 { total_bandwidth / count as u32 } else { 0 },
        network_coherence: 0.0, // Calculated elsewhere
    }
}

/// Health check endpoint
async fn health_check() -> &'static str {
    "🍄 Mycelix Gateway Healthy"
}

/// Network metrics endpoint
async fn network_metrics(State(state): State<AppState>) -> String {
    let metrics = measure_network_field(&state).await;
    serde_json::to_string(&metrics).unwrap_or_default()
}

// Message types
#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
enum ClientMessage {
    Authenticate {
        agent_key: AgentPubKey,
    },
    SendHipi {
        content: String,
        target: MessageTarget,
    },
    UpdateResonance {
        signature: u64,
    },
    MeasureField,
    SyncState {
        state_type: String,
        data: Vec<u8>,
    },
}

#[derive(Serialize, Deserialize)]
enum MessageTarget {
    Agent(AgentPubKey),
    Broadcast,
    ResonanceGroup(u64),
}

#[derive(Serialize, Deserialize)]
struct FieldMetrics {
    active_connections: usize,
    avg_latency_ms: f32,
    avg_bandwidth_kbps: u32,
    network_coherence: f32,
}