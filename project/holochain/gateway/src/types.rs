use serde::{Deserialize, Serialize};

/// Shared type definitions for the gateway

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NetworkMetrics {
    pub latency_ms: f32,
    pub bandwidth_kbps: u32,
    pub packet_loss_rate: f32,
    pub jitter_ms: f32,
    pub connection_count: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ResonanceMetrics {
    pub signature: u64,
    pub coherence: f32,
    pub matched_peers: Vec<u64>,
    pub cluster_id: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FieldMeasurement {
    pub timestamp: i64,
    pub network_metrics: NetworkMetrics,
    pub resonance_metrics: ResonanceMetrics,
    pub topology: NetworkTopology,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NetworkTopology {
    pub direct_peers: u32,
    pub two_hop_peers: u32,
    pub clustering_coefficient: f32,
    pub network_diameter: u32,
    pub centrality_score: f32,
}