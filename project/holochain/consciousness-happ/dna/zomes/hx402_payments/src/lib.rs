use hdk::prelude::*;

/// Credit balance for an agent
#[hdk_entry_helper]
#[derive(Clone)]
pub struct CreditBalance {
    pub agent: AgentPubKey,
    pub balance: i64,              // Credits (can be negative for debt)
    pub total_earned: u64,         // Total credits ever earned
    pub total_spent: u64,          // Total credits ever spent
    pub reputation_score: f32,     // 0.0-1.0 payment reliability
    pub last_updated: Timestamp,
}

/// Payment transaction with resonance-based pricing
#[hdk_entry_helper]
#[derive(Clone)]
pub struct Payment {
    pub id: String,
    pub from: AgentPubKey,
    pub to: AgentPubKey,
    pub base_amount: u64,
    pub resonance_multiplier: f32,    // 0.5-2.0 based on resonance
    pub final_amount: u64,             // base_amount * resonance_multiplier
    pub reason: PaymentReason,
    pub status: PaymentStatus,
    pub timestamp: Timestamp,
    pub metadata: Option<String>,
}

#[hdk_entry_helper]
#[derive(Clone)]
pub enum PaymentReason {
    ServiceRequest,
    ResourceAccess,
    ConsensusReward,
    ResonanceBonus,
    CommunityContribution,
    EmergencySupport,
}

#[hdk_entry_helper]
#[derive(Clone)]
pub enum PaymentStatus {
    Pending,
    Completed,
    Failed,
    Disputed,
    Refunded,
}

/// Credit pool for community resources
#[hdk_entry_helper]
#[derive(Clone)]
pub struct CommunityPool {
    pub name: String,
    pub total_credits: u64,
    pub contributors: Vec<(AgentPubKey, u64)>,
    pub purpose: String,
    pub created_at: Timestamp,
    pub governance_proposal_id: Option<String>, // Link to consensus mechanism
}

/// Resonance pricing rule
#[hdk_entry_helper]
#[derive(Clone)]
pub struct PricingRule {
    pub service_type: String,
    pub base_price: u64,
    pub resonance_curve: ResonanceCurve,
    pub minimum_multiplier: f32,      // Floor (e.g., 0.5x)
    pub maximum_multiplier: f32,      // Ceiling (e.g., 2.0x)
}

#[hdk_entry_helper]
#[derive(Clone)]
pub enum ResonanceCurve {
    Linear,           // Direct correlation
    Exponential,      // Rapid discount/premium
    Logarithmic,      // Gradual change
    Step,             // Discrete tiers
    Custom(Vec<(f32, f32)>), // Custom curve points
}

/// Entry definitions
#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    CreditBalance(CreditBalance),
    Payment(Payment),
    CommunityPool(CommunityPool),
    PricingRule(PricingRule),
}

/// Link types for payment tracking
#[hdk_link_types]
pub enum LinkTypes {
    AgentToBalance,
    AgentToPayments,
    PaymentHistory,
    PoolContributions,
    PricingRules,
}

/// Initialize credit balance for new agent
#[hdk_extern]
pub fn initialize_balance(initial_credits: u64) -> ExternResult<EntryHash> {
    let agent = agent_info()?.agent_latest_pubkey;
    
    // Check if balance already exists
    if let Ok(_) = get_balance_for_agent(agent.clone()) {
        return Err(wasm_error!(
            WasmErrorInner::Guest(String::from("Balance already initialized"))
        ));
    }
    
    let balance = CreditBalance {
        agent: agent.clone(),
        balance: initial_credits as i64,
        total_earned: initial_credits,
        total_spent: 0,
        reputation_score: 0.5,  // Start with neutral reputation
        last_updated: sys_time()?,
    };
    
    // Create the balance entry
    let hash = hash_entry(&balance)?;
    create_entry(EntryTypes::CreditBalance(balance))?;
    
    // Link to agent
    create_link(
        agent.clone(),
        hash.clone(),
        LinkTypes::AgentToBalance,
        (),
    )?;
    
    // Emit signal for balance initialization
    emit_signal(PaymentSignal::BalanceInitialized {
        agent,
        initial_balance: initial_credits,
    })?;
    
    Ok(hash)
}

/// Create a payment with resonance-based pricing
#[hdk_extern]
pub fn create_payment(mut payment: Payment) -> ExternResult<EntryHash> {
    // Validate agents have balances
    let from_balance = get_balance_for_agent(payment.from.clone())?;
    let _to_balance = get_balance_for_agent(payment.to.clone())?;
    
    // Calculate resonance multiplier
    let resonance = calculate_payment_resonance(
        payment.from.clone(),
        payment.to.clone()
    )?;
    
    // Apply pricing curve
    payment.resonance_multiplier = apply_resonance_curve(resonance)?;
    payment.final_amount = (payment.base_amount as f32 * payment.resonance_multiplier) as u64;
    
    // Check sufficient balance
    if from_balance.balance < payment.final_amount as i64 {
        return Err(wasm_error!(
            WasmErrorInner::Guest(String::from("Insufficient balance"))
        ));
    }
    
    // Create the payment entry
    let hash = hash_entry(&payment)?;
    create_entry(EntryTypes::Payment(payment.clone()))?;
    
    // Link to both agents
    create_link(
        payment.from.clone(),
        hash.clone(),
        LinkTypes::AgentToPayments,
        (),
    )?;
    create_link(
        payment.to.clone(),
        hash.clone(),
        LinkTypes::AgentToPayments,
        (),
    )?;
    
    // Process the payment
    process_payment_transaction(payment.clone())?;
    
    // Emit signal for payment created
    emit_signal(PaymentSignal::PaymentCreated {
        payment_id: payment.id.clone(),
        from: payment.from,
        to: payment.to,
        amount: payment.final_amount,
        resonance_discount: if payment.resonance_multiplier < 1.0 {
            Some((1.0 - payment.resonance_multiplier) * 100.0)
        } else {
            None
        },
    })?;
    
    Ok(hash)
}

/// Get current balance for an agent
#[hdk_extern]
pub fn get_balance(agent: Option<AgentPubKey>) -> ExternResult<CreditBalance> {
    let target_agent = agent.unwrap_or_else(|| agent_info().unwrap().agent_latest_pubkey);
    get_balance_for_agent(target_agent)
}

/// Get payment history for an agent
#[hdk_extern]
pub fn get_payment_history(agent: Option<AgentPubKey>) -> ExternResult<Vec<Payment>> {
    let target_agent = agent.unwrap_or_else(|| agent_info().unwrap().agent_latest_pubkey);
    
    let links = get_links(
        GetLinksInputBuilder::try_new(target_agent, LinkTypes::AgentToPayments)?.build()
    )?;
    
    let mut payments = Vec::new();
    for link in links {
        if let Some(record) = get(link.target, GetOptions::default())? {
            if let Some(payment) = record.entry().to_app_option()? {
                payments.push(payment);
            }
        }
    }
    
    // Sort by timestamp (newest first)
    payments.sort_by(|a: &Payment, b: &Payment| b.timestamp.cmp(&a.timestamp));
    
    Ok(payments)
}

/// Contribute to community pool
#[hdk_extern]
pub fn contribute_to_pool(pool_name: String, amount: u64) -> ExternResult<()> {
    let agent = agent_info()?.agent_latest_pubkey;
    let balance = get_balance_for_agent(agent.clone())?;
    
    // Check sufficient balance
    if balance.balance < amount as i64 {
        return Err(wasm_error!(
            WasmErrorInner::Guest(String::from("Insufficient balance"))
        ));
    }
    
    // Get or create pool
    let mut pool = get_or_create_pool(pool_name.clone())?;
    
    // Add contribution
    pool.total_credits += amount;
    let mut found = false;
    for (contributor, contrib) in &mut pool.contributors {
        if *contributor == agent {
            *contrib += amount;
            found = true;
            break;
        }
    }
    if !found {
        pool.contributors.push((agent.clone(), amount));
    }
    
    // Update pool
    let pool_hash = hash_entry(&pool)?;
    update_entry(pool_hash, &pool)?;
    
    // Update contributor's balance
    let mut updated_balance = balance.clone();
    updated_balance.balance -= amount as i64;
    updated_balance.total_spent += amount;
    updated_balance.last_updated = sys_time()?;
    update_balance(agent.clone(), updated_balance)?;
    
    // Emit signal
    emit_signal(PaymentSignal::PoolContribution {
        agent,
        pool: pool_name,
        amount,
    })?;
    
    Ok(())
}

/// Request payment from community pool
#[hdk_extern]
pub fn request_from_pool(
    pool_name: String,
    amount: u64,
    reason: String,
    proposal_id: Option<String>
) -> ExternResult<()> {
    let agent = agent_info()?.agent_latest_pubkey;
    let mut pool = get_pool(pool_name.clone())?;
    
    // Check pool has sufficient funds
    if pool.total_credits < amount {
        return Err(wasm_error!(
            WasmErrorInner::Guest(String::from("Insufficient pool funds"))
        ));
    }
    
    // If proposal_id provided, verify it passed consensus
    if let Some(prop_id) = proposal_id.clone() {
        // In production, would call consensus_mechanism zome to verify
        // For now, we'll accept it
    }
    
    // Deduct from pool
    pool.total_credits -= amount;
    let pool_hash = hash_entry(&pool)?;
    update_entry(pool_hash, &pool)?;
    
    // Add to requester's balance
    let mut balance = get_balance_for_agent(agent.clone())?;
    balance.balance += amount as i64;
    balance.total_earned += amount;
    balance.last_updated = sys_time()?;
    update_balance(agent.clone(), balance)?;
    
    // Create payment record
    let payment = Payment {
        id: format!("pool_{}", generate_id()),
        from: hash_entry(&pool_name)?.get_raw_39().to_vec().try_into()
            .map_err(|_| wasm_error!(WasmErrorInner::Guest("Invalid hash".into())))?,
        to: agent.clone(),
        base_amount: amount,
        resonance_multiplier: 1.0,  // No resonance for pool payments
        final_amount: amount,
        reason: PaymentReason::CommunityContribution,
        status: PaymentStatus::Completed,
        timestamp: sys_time()?,
        metadata: Some(reason),
    };
    
    create_entry(EntryTypes::Payment(payment))?;
    
    // Emit signal
    emit_signal(PaymentSignal::PoolWithdrawal {
        agent,
        pool: pool_name,
        amount,
        approved: true,
    })?;
    
    Ok(())
}

/// Calculate reputation score based on payment history
#[hdk_extern]
pub fn calculate_reputation(agent: AgentPubKey) -> ExternResult<f32> {
    let history = get_payment_history(Some(agent.clone()))?;
    
    if history.is_empty() {
        return Ok(0.5);  // Neutral starting reputation
    }
    
    let mut successful = 0;
    let mut failed = 0;
    let mut disputed = 0;
    
    for payment in history {
        match payment.status {
            PaymentStatus::Completed => successful += 1,
            PaymentStatus::Failed => failed += 1,
            PaymentStatus::Disputed => disputed += 1,
            _ => {}
        }
    }
    
    let total = successful + failed + disputed;
    if total == 0 {
        return Ok(0.5);
    }
    
    // Calculate reputation (0.0-1.0)
    let base_score = (successful as f32) / (total as f32);
    let penalty = (disputed as f32 * 0.2) + (failed as f32 * 0.1);
    let reputation = (base_score - penalty).max(0.0).min(1.0);
    
    Ok(reputation)
}

// Helper functions

fn get_balance_for_agent(agent: AgentPubKey) -> ExternResult<CreditBalance> {
    let links = get_links(
        GetLinksInputBuilder::try_new(agent.clone(), LinkTypes::AgentToBalance)?.build()
    )?;
    
    if links.is_empty() {
        return Err(wasm_error!(
            WasmErrorInner::Guest(String::from("No balance found for agent"))
        ));
    }
    
    let record = get(links[0].target.clone(), GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Balance not found".into())))?;
    
    record.entry().to_app_option()?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Invalid balance".into())))
}

fn update_balance(agent: AgentPubKey, balance: CreditBalance) -> ExternResult<()> {
    let links = get_links(
        GetLinksInputBuilder::try_new(agent, LinkTypes::AgentToBalance)?.build()
    )?;
    
    if !links.is_empty() {
        update_entry(links[0].target.clone(), &balance)?;
    }
    
    Ok(())
}

fn process_payment_transaction(payment: Payment) -> ExternResult<()> {
    // Update sender's balance
    let mut from_balance = get_balance_for_agent(payment.from.clone())?;
    from_balance.balance -= payment.final_amount as i64;
    from_balance.total_spent += payment.final_amount;
    from_balance.last_updated = sys_time()?;
    update_balance(payment.from.clone(), from_balance)?;
    
    // Update recipient's balance
    let mut to_balance = get_balance_for_agent(payment.to.clone())?;
    to_balance.balance += payment.final_amount as i64;
    to_balance.total_earned += payment.final_amount;
    to_balance.last_updated = sys_time()?;
    update_balance(payment.to.clone(), to_balance)?;
    
    Ok(())
}

fn calculate_payment_resonance(from: AgentPubKey, to: AgentPubKey) -> ExternResult<f32> {
    // In production, would call consciousness_identity zome
    // For now, return simulated resonance
    if from == to {
        Ok(1.0)
    } else {
        Ok(0.3 + (rand::random::<f32>() * 0.7))  // 0.3-1.0
    }
}

fn apply_resonance_curve(resonance: f32) -> ExternResult<f32> {
    // Default curve: high resonance = discount, low resonance = premium
    // Resonance 1.0 = 0.5x price (50% discount)
    // Resonance 0.5 = 1.0x price (normal)
    // Resonance 0.0 = 2.0x price (100% premium)
    
    let multiplier = 2.0 - (resonance * 1.5);
    Ok(multiplier.max(0.5).min(2.0))  // Clamp between 0.5x and 2.0x
}

fn get_or_create_pool(pool_name: String) -> ExternResult<CommunityPool> {
    // Try to get existing pool
    match get_pool(pool_name.clone()) {
        Ok(pool) => Ok(pool),
        Err(_) => {
            // Create new pool
            let pool = CommunityPool {
                name: pool_name,
                total_credits: 0,
                contributors: Vec::new(),
                purpose: String::from("Community resource pool"),
                created_at: sys_time()?,
                governance_proposal_id: None,
            };
            
            let hash = hash_entry(&pool)?;
            create_entry(EntryTypes::CommunityPool(pool.clone()))?;
            
            Ok(pool)
        }
    }
}

fn get_pool(pool_name: String) -> ExternResult<CommunityPool> {
    // Query for pool with matching name
    let filter = ChainQueryFilter::new()
        .entry_type(EntryType::App(AppEntryDef {
            entry_index: 2.into(), // CommunityPool index
            zome_index: 0.into(),
            visibility: EntryVisibility::Public,
        }))
        .include_entries(true);
    
    let records = query(filter)?;
    
    for record in records {
        if let Some(entry) = record.entry.into_option() {
            if let Ok(pool) = entry.try_into() {
                let p: CommunityPool = pool;
                if p.name == pool_name {
                    return Ok(p);
                }
            }
        }
    }
    
    Err(wasm_error!(
        WasmErrorInner::Guest(format!("Pool {} not found", pool_name))
    ))
}

fn generate_id() -> String {
    // Simple ID generation
    let timestamp = sys_time().unwrap_or(Timestamp::from_micros(0));
    format!("pay_{}", timestamp.as_micros())
}

// Signal definitions

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum PaymentSignal {
    BalanceInitialized {
        agent: AgentPubKey,
        initial_balance: u64,
    },
    PaymentCreated {
        payment_id: String,
        from: AgentPubKey,
        to: AgentPubKey,
        amount: u64,
        resonance_discount: Option<f32>,
    },
    PoolContribution {
        agent: AgentPubKey,
        pool: String,
        amount: u64,
    },
    PoolWithdrawal {
        agent: AgentPubKey,
        pool: String,
        amount: u64,
        approved: bool,
    },
}