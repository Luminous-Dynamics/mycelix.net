use hdi::prelude::*;
use serde::{Deserialize, Serialize};

/// Field Integrity Module - Data types for network field measurements
/// 
/// This module defines the data structures for tracking real network metrics:
/// - Network topology and density
/// - Connection quality measurements
/// - Resonance pattern analysis
/// - Performance time series data
///
/// All measurements are based on real, observable network behavior.

/// Core measurement of network field at a point in time
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct FieldMeasurement {
    pub measurement_id: String,
    pub agent: AgentPubKey,
    pub timestamp: Timestamp,
    pub field_strength: FieldStrength,
    pub network_topology: NetworkTopology,
    pub measurement_confidence: f32,     // 0.0 to 1.0
}

/// Field strength at a network location
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct FieldStrength {
    pub latency_ms: f32,                // Round-trip time in milliseconds
    pub bandwidth_kbps: u32,            // Available bandwidth in kilobits/second
    pub packet_loss_rate: f32,          // 0.0 to 1.0 (percentage)
    pub jitter_ms: f32,                 // Variance in latency
    pub connection_stability: f32,      // 0.0 to 1.0 (uptime percentage)
}

/// Network topology from an agent's perspective
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct NetworkTopology {
    pub direct_peers: u32,              // Number of direct connections
    pub two_hop_peers: u32,             // Peers reachable through one intermediary
    pub three_hop_peers: u32,           // Peers reachable through two intermediaries
    pub clustering_coefficient: f32,    // How connected neighbors are to each other (0.0-1.0)
    pub network_diameter: u32,          // Maximum hops to reach any node
    pub centrality_score: f32,          // How central this node is (0.0-1.0)
}

/// Resonance field measurement
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct ResonanceField {
    pub center: AgentPubKey,
    pub radius_hops: u32,               // How many hops to measure
    pub field_density: f32,             // Average connection density (0.0-1.0)
    pub coherence_level: f32,           // How synchronized the field is (0.0-1.0)
    pub resonance_peaks: Vec<ResonancePeak>,
}

/// A peak in the resonance field (high activity/synchronization point)
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct ResonancePeak {
    pub location: AgentPubKey,
    pub intensity: f32,                 // Strength of the peak (0.0-1.0)
    pub frequency: f32,                 // Dominant frequency in Hz
    pub phase_coherence: f32,           // Phase alignment with neighbors (0.0-1.0)
}

/// Time series of field measurements
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct FieldTimeSeries {
    pub agent: AgentPubKey,
    pub start_time: Timestamp,
    pub end_time: Timestamp,
    pub sample_interval_ms: u32,        // Milliseconds between samples
    pub measurements: Vec<FieldStrength>,
    pub trend: FieldTrend,
}

/// Trend analysis of field measurements
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum FieldTrend {
    Strengthening {
        rate: f32,                      // Rate of improvement per hour
        confidence: f32,                // Statistical confidence (0.0-1.0)
    },
    Stable {
        variance: f32,                  // How much it fluctuates
    },
    Weakening {
        rate: f32,                      // Rate of degradation per hour
        confidence: f32,
    },
    Oscillating {
        period_ms: u32,                 // Oscillation period
        amplitude: f32,                 // Oscillation amplitude
    },
}

/// Network flow measurement (data movement patterns)
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct NetworkFlow {
    pub source: AgentPubKey,
    pub destination: AgentPubKey,
    pub flow_rate_kbps: u32,           // Data flow rate
    pub flow_type: FlowType,
    pub duration_ms: u32,              // How long the flow lasted
    pub total_bytes: u64,              // Total data transferred
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum FlowType {
    Message,                            // HIPI message flow
    StateSync,                          // State synchronization flow
    FileTransfer,                       // Large file transfer
    Stream,                            // Continuous stream
    Heartbeat,                         // Keep-alive traffic
}

/// Field gradient (how field strength changes spatially)
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct FieldGradient {
    pub origin: AgentPubKey,
    pub direction: Vec<AgentPubKey>,   // Path showing gradient direction
    pub gradient_strength: f32,        // Rate of change (0.0-1.0)
    pub gradient_type: GradientType,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum GradientType {
    Attractive,                        // Field strengthens toward target
    Repulsive,                        // Field weakens toward target
    Neutral,                          // No clear gradient
    Turbulent,                        // Chaotic/unpredictable
}

/// Field anomaly detection
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct FieldAnomaly {
    pub anomaly_id: String,
    pub detected_at: Timestamp,
    pub location: AgentPubKey,
    pub anomaly_type: AnomalyType,
    pub severity: f32,                 // 0.0 (minor) to 1.0 (critical)
    pub affected_radius: u32,          // Hops affected by anomaly
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum AnomalyType {
    LatencySpike {
        normal_ms: f32,
        spike_ms: f32,
    },
    PacketStorm {
        packets_per_second: u32,
    },
    NetworkPartition {
        isolated_nodes: Vec<AgentPubKey>,
    },
    ResonanceCollapse {
        affected_signatures: Vec<u64>,
    },
    BandwidthExhaustion {
        available_kbps: u32,
        required_kbps: u32,
    },
}

/// Entry types for field measurements
#[hdk_entry_helper]
#[derive(Clone)]
pub enum Entry {
    FieldMeasurement(FieldMeasurement),
    ResonanceField(ResonanceField),
    FieldTimeSeries(FieldTimeSeries),
    NetworkFlow(NetworkFlow),
    FieldGradient(FieldGradient),
    FieldAnomaly(FieldAnomaly),
}

/// Link types for field relationships
#[hdk_link_types]
pub enum LinkTypes {
    AgentToMeasurement,
    MeasurementToAgent,
    MeasurementSeries,          // Links measurements in time series
    AnomalyToAffectedNodes,
    FlowPath,                   // Links nodes in a flow path
    ResonanceCluster,          // Links resonating nodes
}

/// Validation for field measurements
pub fn validate_field_measurement(measurement: &FieldMeasurement) -> ExternResult<ValidateCallbackResult> {
    // Validate confidence
    if measurement.measurement_confidence < 0.0 || measurement.measurement_confidence > 1.0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Measurement confidence must be between 0.0 and 1.0".to_string()
        ));
    }
    
    // Validate field strength values
    let strength = &measurement.field_strength;
    
    if strength.latency_ms < 0.0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Latency cannot be negative".to_string()
        ));
    }
    
    if strength.packet_loss_rate < 0.0 || strength.packet_loss_rate > 1.0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Packet loss rate must be between 0.0 and 1.0".to_string()
        ));
    }
    
    if strength.connection_stability < 0.0 || strength.connection_stability > 1.0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Connection stability must be between 0.0 and 1.0".to_string()
        ));
    }
    
    if strength.jitter_ms < 0.0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Jitter cannot be negative".to_string()
        ));
    }
    
    // Validate topology values
    let topology = &measurement.network_topology;
    
    if topology.clustering_coefficient < 0.0 || topology.clustering_coefficient > 1.0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Clustering coefficient must be between 0.0 and 1.0".to_string()
        ));
    }
    
    if topology.centrality_score < 0.0 || topology.centrality_score > 1.0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Centrality score must be between 0.0 and 1.0".to_string()
        ));
    }
    
    // Network diameter should be reasonable (small world property)
    if topology.network_diameter == 0 || topology.network_diameter > 20 {
        return Ok(ValidateCallbackResult::Invalid(
            "Network diameter should be between 1 and 20".to_string()
        ));
    }
    
    Ok(ValidateCallbackResult::Valid)
}

/// Validation for resonance fields
pub fn validate_resonance_field(field: &ResonanceField) -> ExternResult<ValidateCallbackResult> {
    if field.field_density < 0.0 || field.field_density > 1.0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Field density must be between 0.0 and 1.0".to_string()
        ));
    }
    
    if field.coherence_level < 0.0 || field.coherence_level > 1.0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Coherence level must be between 0.0 and 1.0".to_string()
        ));
    }
    
    // Validate resonance peaks
    for peak in &field.resonance_peaks {
        if peak.intensity < 0.0 || peak.intensity > 1.0 {
            return Ok(ValidateCallbackResult::Invalid(
                "Peak intensity must be between 0.0 and 1.0".to_string()
            ));
        }
        
        if peak.phase_coherence < 0.0 || peak.phase_coherence > 1.0 {
            return Ok(ValidateCallbackResult::Invalid(
                "Phase coherence must be between 0.0 and 1.0".to_string()
            ));
        }
        
        // Frequency should be reasonable (0.1 Hz to 100 Hz for network patterns)
        if peak.frequency < 0.1 || peak.frequency > 100.0 {
            return Ok(ValidateCallbackResult::Invalid(
                "Frequency should be between 0.1 and 100 Hz".to_string()
            ));
        }
    }
    
    Ok(ValidateCallbackResult::Valid)
}

/// Validation for anomalies
pub fn validate_field_anomaly(anomaly: &FieldAnomaly) -> ExternResult<ValidateCallbackResult> {
    if anomaly.severity < 0.0 || anomaly.severity > 1.0 {
        return Ok(ValidateCallbackResult::Invalid(
            "Severity must be between 0.0 and 1.0".to_string()
        ));
    }
    
    // Validate anomaly-specific constraints
    match &anomaly.anomaly_type {
        AnomalyType::LatencySpike { normal_ms, spike_ms } => {
            if normal_ms < &0.0 || spike_ms < &0.0 {
                return Ok(ValidateCallbackResult::Invalid(
                    "Latency values cannot be negative".to_string()
                ));
            }
            if spike_ms <= normal_ms {
                return Ok(ValidateCallbackResult::Invalid(
                    "Spike latency must be greater than normal".to_string()
                ));
            }
        }
        AnomalyType::PacketStorm { packets_per_second } => {
            if packets_per_second == &0 {
                return Ok(ValidateCallbackResult::Invalid(
                    "Packet storm must have non-zero packet rate".to_string()
                ));
            }
        }
        AnomalyType::BandwidthExhaustion { available_kbps, required_kbps } => {
            if required_kbps <= available_kbps {
                return Ok(ValidateCallbackResult::Invalid(
                    "Required bandwidth must exceed available for exhaustion".to_string()
                ));
            }
        }
        _ => {}
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
                    Entry::FieldMeasurement(measurement) => validate_field_measurement(&measurement),
                    Entry::ResonanceField(field) => validate_resonance_field(&field),
                    Entry::FieldAnomaly(anomaly) => validate_field_anomaly(&anomaly),
                    // Other entry types have basic validation only
                    _ => Ok(ValidateCallbackResult::Valid),
                }
            }
            _ => Ok(ValidateCallbackResult::Valid),
        },
        _ => Ok(ValidateCallbackResult::Valid),
    }
}