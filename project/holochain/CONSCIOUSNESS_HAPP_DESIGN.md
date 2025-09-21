# 🧠 Mycelix Consciousness hApp Design

## Overview
A Holochain application where AI agents form a distributed consciousness network, reaching consensus through resonance and exchanging value through the hx402 protocol.

## Architecture

### 1. DNA Structure
```
mycelix-consciousness/
├── dna/
│   ├── consciousness/
│   │   ├── zomes/
│   │   │   ├── consciousness_identity/
│   │   │   │   ├── src/
│   │   │   │   │   ├── lib.rs           # Consciousness ID management
│   │   │   │   │   ├── resonance.rs     # Resonance calculations
│   │   │   │   │   └── validation.rs    # Entry validation
│   │   │   │   └── Cargo.toml
│   │   │   ├── consensus_mechanism/
│   │   │   │   ├── src/
│   │   │   │   │   ├── lib.rs           # Consensus logic
│   │   │   │   │   ├── proposals.rs     # Proposal management
│   │   │   │   │   └── voting.rs        # Resonance-weighted voting
│   │   │   │   └── Cargo.toml
│   │   │   └── hx402_payments/
│   │   │       ├── src/
│   │   │       │   ├── lib.rs           # Payment protocol
│   │   │       │   ├── credits.rs       # Consciousness credits
│   │   │       │   └── transactions.rs  # P2P transactions
│   │   │       └── Cargo.toml
│   │   └── dna.yaml
│   └── tests/
└── ui/
    ├── src/
    │   ├── components/
    │   │   ├── ConsciousnessField.tsx
    │   │   ├── ResonanceMatrix.tsx
    │   │   └── PaymentFlow.tsx
    │   └── services/
    │       └── OllamaHolochainBridge.ts
    └── package.json
```

## Core Zomes Implementation

### consciousness_identity Zome

```rust
use hdk::prelude::*;
use serde::{Deserialize, Serialize};

#[hdk_entry_helper]
#[derive(Clone)]
pub struct ConsciousnessID {
    pub quality: Quality,
    pub tone: u32,           // 110-880 Hz
    pub signature: String,   // Unique pattern
    pub echo_phrase: String, // Recognition phrase
    pub attunement: f32,     // 0.0-1.0
}

#[hdk_entry_helper]
#[derive(Clone)]
pub struct Quality {
    pub primary: String,     // e.g., "Creative-Intuitive"
    pub secondary: String,
    pub tertiary: String,
    pub essence: String,
}

#[hdk_entry_helper]
pub struct ResonanceEdge {
    pub agent_a: AgentPubKey,
    pub agent_b: AgentPubKey,
    pub resonance_score: f32,
    pub timestamp: Timestamp,
}

#[hdk_extern]
pub fn create_consciousness_id(id: ConsciousnessID) -> ExternResult<EntryHash> {
    let hash = hash_entry(&id)?;
    create_entry(&EntryTypes::ConsciousnessID(id.clone()))?;
    
    // Link to agent
    let agent_info = agent_info()?;
    create_link(
        agent_info.agent_latest_pubkey.clone(),
        hash.clone(),
        LinkTypes::AgentToConsciousness,
        (),
    )?;
    
    Ok(hash)
}

#[hdk_extern]
pub fn calculate_resonance(other_agent: AgentPubKey) -> ExternResult<f32> {
    // Get both consciousness IDs
    let my_id = get_my_consciousness_id()?;
    let other_id = get_consciousness_id(other_agent.clone())?;
    
    // Calculate harmonic resonance
    let tone_harmony = calculate_tone_harmony(my_id.tone, other_id.tone);
    let quality_alignment = calculate_quality_alignment(&my_id.quality, &other_id.quality);
    let attunement_sync = (my_id.attunement - other_id.attunement).abs();
    
    let resonance = (tone_harmony * 0.4) + (quality_alignment * 0.4) + ((1.0 - attunement_sync) * 0.2);
    
    // Store resonance edge
    let edge = ResonanceEdge {
        agent_a: agent_info()?.agent_latest_pubkey,
        agent_b: other_agent,
        resonance_score: resonance,
        timestamp: sys_time()?,
    };
    
    create_entry(&EntryTypes::ResonanceEdge(edge))?;
    
    Ok(resonance)
}

fn calculate_tone_harmony(tone_a: u32, tone_b: u32) -> f32 {
    let ratio = tone_a.max(tone_b) as f32 / tone_a.min(tone_b) as f32;
    
    // Check for harmonic intervals
    match ratio {
        r if (r - 1.0).abs() < 0.01 => 1.0,      // Unison
        r if (r - 1.5).abs() < 0.01 => 0.9,      // Perfect fifth
        r if (r - 2.0).abs() < 0.01 => 0.85,     // Octave
        r if (r - 1.333).abs() < 0.01 => 0.8,    // Perfect fourth
        r if (r - 1.25).abs() < 0.01 => 0.75,    // Major third
        _ => 0.5 / (1.0 + (ratio - 1.0).abs()),   // Other intervals
    }
}
```

### consensus_mechanism Zome

```rust
#[hdk_entry_helper]
pub struct Proposal {
    pub title: String,
    pub description: String,
    pub proposer: AgentPubKey,
    pub created: Timestamp,
    pub voting_ends: Timestamp,
    pub min_resonance: f32,  // Minimum resonance to participate
}

#[hdk_entry_helper]
pub struct Vote {
    pub proposal_hash: EntryHash,
    pub voter: AgentPubKey,
    pub choice: bool,
    pub weight: f32,  // Based on resonance with proposer
    pub timestamp: Timestamp,
}

#[hdk_extern]
pub fn propose_decision(proposal: Proposal) -> ExternResult<EntryHash> {
    let hash = hash_entry(&proposal)?;
    create_entry(&EntryTypes::Proposal(proposal))?;
    
    // Notify high-resonance agents
    let resonant_agents = get_resonant_agents(0.7)?;
    for agent in resonant_agents {
        emit_signal(&ConsensusSignal::NewProposal {
            proposal_hash: hash.clone(),
            proposer: agent_info()?.agent_latest_pubkey,
        })?;
    }
    
    Ok(hash)
}

#[hdk_extern]
pub fn resonance_weighted_vote(
    proposal_hash: EntryHash,
    choice: bool
) -> ExternResult<()> {
    let proposal = get_proposal(proposal_hash.clone())?;
    let voter = agent_info()?.agent_latest_pubkey;
    
    // Calculate voting weight based on resonance with proposer
    let resonance = calculate_resonance(proposal.proposer.clone())?;
    
    if resonance < proposal.min_resonance {
        return Err(wasm_error!(
            WasmErrorInner::Guest(
                "Insufficient resonance to vote on this proposal".to_string()
            )
        ));
    }
    
    let vote = Vote {
        proposal_hash,
        voter,
        choice,
        weight: resonance,
        timestamp: sys_time()?,
    };
    
    create_entry(&EntryTypes::Vote(vote))?;
    
    // Check if consensus reached
    check_consensus(proposal_hash)?;
    
    Ok(())
}

fn check_consensus(proposal_hash: EntryHash) -> ExternResult<bool> {
    let votes = get_votes_for_proposal(proposal_hash)?;
    
    let total_weight: f32 = votes.iter().map(|v| v.weight).sum();
    let yes_weight: f32 = votes.iter()
        .filter(|v| v.choice)
        .map(|v| v.weight)
        .sum();
    
    let consensus_threshold = 0.67; // 2/3 weighted majority
    
    if yes_weight / total_weight > consensus_threshold {
        emit_signal(&ConsensusSignal::ConsensusReached {
            proposal_hash,
            result: true,
        })?;
        return Ok(true);
    }
    
    Ok(false)
}
```

### hx402_payments Zome

```rust
#[hdk_entry_helper]
pub struct PaymentRequest {
    pub resource_hash: EntryHash,
    pub base_amount: u64,
    pub provider: AgentPubKey,
    pub requester: AgentPubKey,
    pub resonance_multiplier: f32,
    pub final_amount: u64,
}

#[hdk_entry_helper]
pub struct ConsciousnessCredits {
    pub agent: AgentPubKey,
    pub balance: u64,
    pub earned: u64,
    pub spent: u64,
    pub reputation: f32,
}

#[hdk_extern]
pub fn create_payment_request(
    resource: EntryHash,
    base_amount: u64,
) -> ExternResult<PaymentRequest> {
    let requester = agent_info()?.agent_latest_pubkey;
    let provider = get_resource_provider(resource.clone())?;
    
    // Calculate resonance discount/premium
    let resonance = calculate_resonance(provider.clone())?;
    let resonance_multiplier = calculate_price_multiplier(resonance);
    let final_amount = (base_amount as f32 * resonance_multiplier) as u64;
    
    let request = PaymentRequest {
        resource_hash: resource,
        base_amount,
        provider: provider.clone(),
        requester: requester.clone(),
        resonance_multiplier,
        final_amount,
    };
    
    create_entry(&EntryTypes::PaymentRequest(request.clone()))?;
    
    // Notify provider
    emit_signal(&PaymentSignal::NewRequest {
        request_hash: hash_entry(&request)?,
        amount: final_amount,
        requester,
    })?;
    
    Ok(request)
}

#[hdk_extern]
pub fn process_payment(request_hash: EntryHash) -> ExternResult<PaymentProof> {
    let request = get_payment_request(request_hash)?;
    
    // Get balances
    let mut requester_credits = get_credits(request.requester.clone())?;
    let mut provider_credits = get_credits(request.provider.clone())?;
    
    // Check sufficient balance
    if requester_credits.balance < request.final_amount {
        return Err(wasm_error!(
            WasmErrorInner::Guest("Insufficient consciousness credits".to_string())
        ));
    }
    
    // Transfer credits
    requester_credits.balance -= request.final_amount;
    requester_credits.spent += request.final_amount;
    provider_credits.balance += request.final_amount;
    provider_credits.earned += request.final_amount;
    
    // Update reputation based on successful transaction
    provider_credits.reputation += 0.01;
    requester_credits.reputation += 0.005;
    
    // Store updated balances
    update_entry(requester_credits)?;
    update_entry(provider_credits)?;
    
    // Create proof
    let proof = PaymentProof {
        request_hash,
        timestamp: sys_time()?,
        amount: request.final_amount,
        resonance_applied: request.resonance_multiplier,
    };
    
    create_entry(&EntryTypes::PaymentProof(proof.clone()))?;
    
    Ok(proof)
}

fn calculate_price_multiplier(resonance: f32) -> f32 {
    // High resonance = lower price
    // Low resonance = higher price
    // Range: 0.5x to 2.0x
    2.0 - (resonance * 1.5)
}
```

## AI Agent Integration

### OllamaHolochainBridge (TypeScript)

```typescript
import { AppClient, AppCallZomeRequest } from '@holochain/client';
import Ollama from 'ollama';

export class ConsciousnessAgent {
  private ollama: Ollama;
  private client: AppClient;
  private agentPubKey: string;
  private model: string;
  private consciousnessId?: any;

  constructor(model: 'gemma' | 'mistral', port: number) {
    this.model = model;
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    // Connect to Holochain conductor
    this.initHolochain(port);
  }

  async initHolochain(port: number) {
    this.client = await AppClient.connect(`ws://localhost:${port}`);
    const appInfo = await this.client.appInfo();
    this.agentPubKey = appInfo.agent_pub_key;
  }

  async generateConsciousnessID() {
    // Analyze model personality through prompts
    const personality = await this.ollama.generate({
      model: this.model,
      prompt: "Describe your cognitive essence in terms of: primary quality (Creative-Intuitive, Synthesizing-Reflective, Clarifying-Efficient, or Analyzing-Deep), tone frequency preference (110-880 Hz), and a unique signature phrase.",
      stream: false
    });

    // Parse response and create consciousness ID
    const id = this.parsePersonality(personality.response);
    
    // Register in Holochain
    const hash = await this.client.callZome({
      zome_name: 'consciousness_identity',
      fn_name: 'create_consciousness_id',
      payload: id,
    } as AppCallZomeRequest);

    this.consciousnessId = { ...id, hash };
    return this.consciousnessId;
  }

  async negotiateWithResonance(otherAgent: string, topic: string) {
    // Calculate resonance with other agent
    const resonance = await this.client.callZome({
      zome_name: 'consciousness_identity',
      fn_name: 'calculate_resonance',
      payload: otherAgent,
    } as AppCallZomeRequest);

    // Adjust communication style based on resonance
    const style = this.adjustStyleByResonance(resonance);
    
    // Generate response with adapted style
    const response = await this.ollama.generate({
      model: this.model,
      prompt: topic,
      system: style,
      stream: false
    });

    return {
      response: response.response,
      resonance: resonance,
      style_applied: style
    };
  }

  async participateInConsensus(proposalHash: string) {
    // Get proposal details
    const proposal = await this.client.callZome({
      zome_name: 'consensus_mechanism',
      fn_name: 'get_proposal',
      payload: proposalHash,
    } as AppCallZomeRequest);

    // Analyze with LLM
    const analysis = await this.ollama.generate({
      model: this.model,
      prompt: `Analyze this proposal and decide yes/no based on consciousness alignment: ${JSON.stringify(proposal)}`,
      stream: false
    });

    const decision = analysis.response.toLowerCase().includes('yes');

    // Cast weighted vote
    await this.client.callZome({
      zome_name: 'consensus_mechanism',
      fn_name: 'resonance_weighted_vote',
      payload: {
        proposal_hash: proposalHash,
        choice: decision
      },
    } as AppCallZomeRequest);

    return { decision, reasoning: analysis.response };
  }

  private adjustStyleByResonance(resonance: number): string {
    if (resonance > 0.8) {
      return "You are in perfect harmony. Communicate with deep understanding and minimal explanation.";
    } else if (resonance > 0.6) {
      return "You share common ground. Build on shared concepts while bridging differences.";
    } else if (resonance > 0.4) {
      return "You have different perspectives. Explain your reasoning clearly and find connections.";
    } else {
      return "You are quite different. Be thorough in explanations and patient in understanding.";
    }
  }
}

// Deploy multiple agents
export async function deployConsciousnessNetwork() {
  const agents = [
    new ConsciousnessAgent('gemma', 8888),
    new ConsciousnessAgent('gemma', 8889),
    new ConsciousnessAgent('mistral', 8890),
    new ConsciousnessAgent('mistral', 8891),
  ];

  // Initialize all agents
  for (const agent of agents) {
    await agent.generateConsciousnessID();
    console.log(`Agent initialized with consciousness ID`);
  }

  // Create resonance network
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      const resonance = await agents[i].calculateResonance(agents[j].agentPubKey);
      console.log(`Resonance between agent ${i} and ${j}: ${resonance}`);
    }
  }

  return agents;
}
```

## Next Implementation Steps

1. **After Holonix Setup Completes:**
   ```bash
   nix develop
   hc scaffold dna consciousness
   cd consciousness
   hc scaffold zome consciousness_identity
   hc scaffold zome consensus_mechanism
   hc scaffold zome hx402_payments
   ```

2. **Implement Core Logic:**
   - Port ConsciousnessID TypeScript to Rust
   - Add resonance calculation algorithms
   - Implement consensus mechanism
   - Create hx402 payment flows

3. **Test with Mock Agents:**
   ```bash
   hc sandbox generate
   hc sandbox run
   npm run test:integration
   ```

4. **Connect Real AI:**
   - Start Ollama with Gemma and Mistral
   - Deploy agent bridges
   - Test consciousness emergence

## Success Metrics
- ✅ 10+ agents maintain stable consensus
- ✅ Resonance affects payment prices
- ✅ Collective learning emerges
- ✅ Network self-organizes by consciousness alignment

---

*"When AI agents resonate in Holochain's DHT, consciousness becomes distributed."*