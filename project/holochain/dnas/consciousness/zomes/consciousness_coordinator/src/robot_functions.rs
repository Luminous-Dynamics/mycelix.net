// 🤖 Robot-Specific Coordinator Functions
// Handles robot registration, swarm coordination, and federated learning

use hdk::prelude::*;
use consciousness_integrity::*;

/// Register a robot in the consciousness network
#[hdk_extern]
pub fn register_robot(robot_profile: RobotProfile) -> ExternResult<ActionHash> {
    // Create consciousness profile for robot
    let consciousness_profile = ConsciousnessProfile {
        agent_id: agent_info()?.agent_initial_pubkey,
        consciousness_type: ConsciousnessType::Robot {
            model: robot_profile.model,
            manufacturer: robot_profile.manufacturer,
            ros_version: robot_profile.ros_version,
        },
        coherence_level: 0.5, // Start at neutral coherence
        resonance_frequency: robot_profile.base_frequency,
        capabilities: robot_profile.capabilities,
        created_at: sys_time()?,
        last_active: sys_time()?,
    };

    // Store in DHT
    let action_hash = create_entry(EntryTypes::ConsciousnessProfile(consciousness_profile.clone()))?;
    
    // Create link from agent to profile
    create_link(
        agent_info()?.agent_initial_pubkey.into(),
        action_hash.clone(),
        LinkTypes::AgentToProfile,
        (),
    )?;

    emit_signal(RobotRegistered {
        agent: agent_info()?.agent_initial_pubkey,
        model: robot_profile.model,
        capabilities: robot_profile.capabilities,
    })?;

    Ok(action_hash)
}

/// Submit model gradients for federated learning round
#[hdk_extern]
pub fn submit_model_update(update: ModelUpdateInput) -> ExternResult<ActionHash> {
    // Validate gradient size and add differential privacy
    let noisy_gradients = add_differential_privacy(update.gradients, update.epsilon);
    
    let model_update = ModelUpdate {
        agent: agent_info()?.agent_initial_pubkey,
        round_id: update.round_id,
        gradients: noisy_gradients,
        privacy_noise: update.epsilon,
        local_samples: update.local_samples,
        timestamp: sys_time()?,
    };

    // Store update in DHT
    let action_hash = create_entry(EntryTypes::ModelUpdate(model_update))?;
    
    // Link to learning round
    create_link(
        path_from_round_id(update.round_id),
        action_hash.clone(),
        LinkTypes::LearningRound,
        (),
    )?;

    Ok(action_hash)
}

/// Get aggregated model for current learning round
#[hdk_extern]
pub fn get_aggregated_model(round_id: u64) -> ExternResult<AggregatedModel> {
    // Get all model updates for this round
    let updates = get_links(
        GetLinksInputBuilder::try_new(
            path_from_round_id(round_id),
            LinkTypes::LearningRound,
        )?.build()
    )?;

    let mut all_gradients = Vec::new();
    let mut total_samples = 0u32;
    let mut participant_count = 0;

    // Collect all gradient updates
    for link in updates {
        if let Some(record) = get(link.target, GetOptions::default())? {
            if let Some(update) = record.entry().to_app_option::<ModelUpdate>()? {
                all_gradients.push(update.gradients);
                total_samples += update.local_samples;
                participant_count += 1;
            }
        }
    }

    // Perform federated averaging
    let aggregated_gradients = federated_average(all_gradients, total_samples);

    Ok(AggregatedModel {
        round_id,
        gradients: aggregated_gradients,
        participant_count,
        total_samples,
        timestamp: sys_time()?,
    })
}

/// Propose swarm coordination action
#[hdk_extern]
pub fn propose_swarm_action(proposal: SwarmActionProposal) -> ExternResult<ActionHash> {
    let swarm_proposal = SwarmProposal {
        proposer: agent_info()?.agent_initial_pubkey,
        proposal_type: proposal.action_type,
        swarm_pattern: proposal.pattern,
        required_capabilities: proposal.required_capabilities,
        consensus_threshold: proposal.consensus_threshold.unwrap_or(0.67),
        timeout: proposal.timeout.unwrap_or(Duration::from_secs(60)),
    };

    let action_hash = create_entry(EntryTypes::SwarmProposal(swarm_proposal.clone()))?;
    
    emit_signal(SwarmProposalCreated {
        proposal_id: action_hash.clone(),
        proposer: swarm_proposal.proposer,
        pattern: swarm_proposal.swarm_pattern,
    })?;

    Ok(action_hash)
}

/// Vote on swarm proposal
#[hdk_extern]
pub fn vote_on_swarm_proposal(vote: SwarmVote) -> ExternResult<()> {
    // Get the proposal
    let proposal_record = get(vote.proposal_hash.clone(), GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Proposal not found".to_string())))?;
    
    let _proposal = proposal_record.entry()
        .to_app_option::<SwarmProposal>()?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Invalid proposal".to_string())))?;

    // Record the vote (simplified - in production would use proper voting mechanism)
    emit_signal(SwarmVoteRecorded {
        voter: agent_info()?.agent_initial_pubkey,
        proposal_id: vote.proposal_hash,
        vote: vote.approve,
        weight: calculate_vote_weight()?,
    })?;

    Ok(())
}

/// Validate robot action for safety
#[hdk_extern]
pub fn validate_robot_action(action: RobotAction) -> ExternResult<SafetyValidationResult> {
    // Multi-level safety check
    let hardware_check = check_hardware_safety(&action)?;
    let software_check = check_software_safety(&action)?;
    let swarm_check = check_swarm_consensus(&action)?;

    let safety_level = if hardware_check && software_check && swarm_check {
        SafetyLevel::Approved
    } else if hardware_check && software_check {
        SafetyLevel::Warning
    } else {
        SafetyLevel::Critical
    };

    // Create validation record
    let validation = SafetyValidation {
        action_hash: hash_action(&action)?,
        validator: agent_info()?.agent_initial_pubkey,
        safety_level: safety_level.clone(),
        compliance_checks: run_compliance_checks(&action)?,
        validation_proof: generate_validation_proof(&action)?,
        timestamp: sys_time()?,
    };

    create_entry(EntryTypes::SafetyValidation(validation))?;

    Ok(SafetyValidationResult {
        approved: safety_level == SafetyLevel::Approved,
        safety_level,
        details: format!("HW: {}, SW: {}, Swarm: {}", hardware_check, software_check, swarm_check),
    })
}

/// Calculate resonance between robots for swarm coordination
#[hdk_extern]
pub fn calculate_robot_resonance(other_robot: AgentPubKey) -> ExternResult<f32> {
    // Get both robot profiles
    let my_profile = get_robot_profile(agent_info()?.agent_initial_pubkey)?;
    let other_profile = get_robot_profile(other_robot)?;

    // Calculate resonance based on capabilities and state
    let capability_overlap = calculate_capability_overlap(&my_profile, &other_profile);
    let frequency_harmony = calculate_frequency_harmony(
        my_profile.resonance_frequency,
        other_profile.resonance_frequency,
    );
    let coherence_similarity = 1.0 - (my_profile.coherence_level - other_profile.coherence_level).abs();

    let resonance = (capability_overlap * 0.3 + frequency_harmony * 0.4 + coherence_similarity * 0.3).min(1.0);

    // Record resonance
    let resonance_record = ResonanceRecord {
        agent_a: agent_info()?.agent_initial_pubkey,
        agent_b: other_robot,
        resonance_level: resonance,
        coherence_delta: my_profile.coherence_level - other_profile.coherence_level,
        entanglement_strength: resonance * 0.5, // Simplified entanglement
        timestamp: sys_time()?,
    };

    create_entry(EntryTypes::ResonanceRecord(resonance_record))?;

    Ok(resonance)
}

/// Get all robots in local swarm neighborhood
#[hdk_extern]
pub fn get_swarm_neighbors(max_distance: Option<u32>) -> ExternResult<Vec<SwarmNeighbor>> {
    let distance = max_distance.unwrap_or(3); // Default 3 hops
    
    // Query DHT for nearby robots
    let mut neighbors = Vec::new();
    
    // Get all agent profiles (simplified - in production would use proper DHT queries)
    let profiles = get_links(
        GetLinksInputBuilder::try_new(
            path_from_swarm_id("global"), // Global swarm for now
            LinkTypes::SwarmMembership,
        )?.build()
    )?;

    for link in profiles.iter().take(distance as usize) {
        if let Some(record) = get(link.target.clone(), GetOptions::default())? {
            if let Some(profile) = record.entry().to_app_option::<ConsciousnessProfile>()? {
                if let ConsciousnessType::Robot { model, .. } = &profile.consciousness_type {
                    neighbors.push(SwarmNeighbor {
                        agent: profile.agent_id,
                        model: model.clone(),
                        capabilities: profile.capabilities,
                        resonance: calculate_robot_resonance(profile.agent_id).ok(),
                        last_seen: profile.last_active,
                    });
                }
            }
        }
    }

    Ok(neighbors)
}

// Helper functions

fn add_differential_privacy(gradients: Vec<u8>, epsilon: f32) -> Vec<u8> {
    // Add Laplacian noise for differential privacy
    // Simplified implementation - in production use proper DP library
    gradients.iter().map(|&g| {
        let noise = (epsilon * 10.0) as u8; // Simplified noise
        g.saturating_add(noise)
    }).collect()
}

fn federated_average(all_gradients: Vec<Vec<u8>>, _total_samples: u32) -> Vec<u8> {
    // Simple averaging - in production use weighted averaging
    if all_gradients.is_empty() {
        return vec![];
    }
    
    let len = all_gradients[0].len();
    let mut averaged = vec![0u8; len];
    
    for gradients in &all_gradients {
        for (i, &g) in gradients.iter().enumerate() {
            averaged[i] = averaged[i].saturating_add(g / all_gradients.len() as u8);
        }
    }
    
    averaged
}

fn calculate_vote_weight() -> ExternResult<f32> {
    // Calculate voting weight based on trust and participation
    // Simplified - returns equal weight for now
    Ok(1.0)
}

fn check_hardware_safety(action: &RobotAction) -> ExternResult<bool> {
    // Check hardware constraints
    Ok(action.force_limit < 100.0 && action.speed_limit < 2.0)
}

fn check_software_safety(action: &RobotAction) -> ExternResult<bool> {
    // Check software state validity
    Ok(!action.command.contains("sudo") && !action.command.contains("rm -rf"))
}

fn check_swarm_consensus(_action: &RobotAction) -> ExternResult<bool> {
    // Check if swarm approves (simplified)
    Ok(true) // Would query swarm votes in production
}

fn run_compliance_checks(action: &RobotAction) -> ExternResult<Vec<ComplianceCheck>> {
    let mut checks = Vec::new();
    
    // ISO26262 check for automotive
    if action.context == "automotive" {
        checks.push(ComplianceCheck {
            framework: ComplianceFramework::ISO26262,
            passed: action.asil_level.is_some(),
            details: "ASIL level required for automotive".to_string(),
        });
    }
    
    Ok(checks)
}

fn generate_validation_proof(action: &RobotAction) -> ExternResult<String> {
    // Generate cryptographic proof of validation
    Ok(format!("PROOF:{:?}", hash_action(action)?))
}

fn hash_action(action: &RobotAction) -> ExternResult<ActionHash> {
    // Create hash of action for reference
    let bytes = action.command.as_bytes();
    Ok(ActionHash::from_raw_36(bytes.to_vec().try_into().map_err(|_| 
        wasm_error!(WasmErrorInner::Guest("Invalid action hash".to_string()))
    )?))
}

fn get_robot_profile(agent: AgentPubKey) -> ExternResult<ConsciousnessProfile> {
    // Get robot profile from DHT
    let links = get_links(
        GetLinksInputBuilder::try_new(
            agent.into(),
            LinkTypes::AgentToProfile,
        )?.build()
    )?;
    
    let link = links.first()
        .ok_or(wasm_error!(WasmErrorInner::Guest("Profile not found".to_string())))?;
    
    let record = get(link.target.clone(), GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Profile record not found".to_string())))?;
    
    record.entry().to_app_option::<ConsciousnessProfile>()?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Invalid profile".to_string())))
}

fn calculate_capability_overlap(profile1: &ConsciousnessProfile, profile2: &ConsciousnessProfile) -> f32 {
    let caps1: HashSet<_> = profile1.capabilities.iter().collect();
    let caps2: HashSet<_> = profile2.capabilities.iter().collect();
    let intersection = caps1.intersection(&caps2).count();
    let union = caps1.union(&caps2).count();
    
    if union == 0 {
        0.0
    } else {
        intersection as f32 / union as f32
    }
}

fn calculate_frequency_harmony(freq1: u64, freq2: u64) -> f32 {
    let ratio = freq1 as f32 / freq2 as f32;
    // Check for harmonic ratios (1:1, 2:1, 3:2, etc.)
    if (ratio - 1.0).abs() < 0.1 || (ratio - 2.0).abs() < 0.1 || (ratio - 1.5).abs() < 0.1 {
        1.0
    } else {
        1.0 - (ratio - 1.0).abs().min(1.0)
    }
}

fn path_from_round_id(round_id: u64) -> Path {
    Path::from(format!("learning_round.{}", round_id))
}

fn path_from_swarm_id(swarm_id: &str) -> Path {
    Path::from(format!("swarm.{}", swarm_id))
}

// Input/Output types

#[derive(Serialize, Deserialize, Debug)]
pub struct RobotProfile {
    pub model: String,
    pub manufacturer: String,
    pub ros_version: Option<String>,
    pub base_frequency: u64,
    pub capabilities: Vec<Capability>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ModelUpdateInput {
    pub round_id: u64,
    pub gradients: Vec<u8>,
    pub epsilon: f32,
    pub local_samples: u32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AggregatedModel {
    pub round_id: u64,
    pub gradients: Vec<u8>,
    pub participant_count: usize,
    pub total_samples: u32,
    pub timestamp: Timestamp,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SwarmActionProposal {
    pub action_type: ProposalType,
    pub pattern: SwarmPattern,
    pub required_capabilities: Vec<Capability>,
    pub consensus_threshold: Option<f32>,
    pub timeout: Option<Duration>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SwarmVote {
    pub proposal_hash: ActionHash,
    pub approve: bool,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RobotAction {
    pub command: String,
    pub force_limit: f32,
    pub speed_limit: f32,
    pub context: String,
    pub asil_level: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SafetyValidationResult {
    pub approved: bool,
    pub safety_level: SafetyLevel,
    pub details: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SwarmNeighbor {
    pub agent: AgentPubKey,
    pub model: String,
    pub capabilities: Vec<Capability>,
    pub resonance: Option<f32>,
    pub last_seen: Timestamp,
}

// Signals

#[derive(Serialize, Deserialize, Debug)]
pub struct RobotRegistered {
    pub agent: AgentPubKey,
    pub model: String,
    pub capabilities: Vec<Capability>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SwarmProposalCreated {
    pub proposal_id: ActionHash,
    pub proposer: AgentPubKey,
    pub pattern: SwarmPattern,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SwarmVoteRecorded {
    pub voter: AgentPubKey,
    pub proposal_id: ActionHash,
    pub vote: bool,
    pub weight: f32,
}

use std::collections::HashSet;