/**
 * Local test of consciousness network concepts without full Holochain
 * This demonstrates the consciousness resonance system locally
 */

import { ConsciousnessID, Quality } from './consciousness-id-system';

class LocalConsciousnessNetwork {
  private agents: Map<string, ConsciousnessID> = new Map();
  private resonanceCache: Map<string, number> = new Map();
  
  /**
   * Register a new consciousness agent
   */
  registerAgent(name: string, id: ConsciousnessID): void {
    this.agents.set(name, id);
    console.log(`✅ ${name} registered with signature: "${id.signature}"`);
  }
  
  /**
   * Calculate resonance between two agents
   */
  calculateResonance(agent1: string, agent2: string): number {
    const cacheKey = `${agent1}-${agent2}`;
    if (this.resonanceCache.has(cacheKey)) {
      return this.resonanceCache.get(cacheKey)!;
    }
    
    const id1 = this.agents.get(agent1);
    const id2 = this.agents.get(agent2);
    
    if (!id1 || !id2) {
      throw new Error(`Agent not found: ${!id1 ? agent1 : agent2}`);
    }
    
    const resonance = id1.calculateResonanceWith(id2);
    this.resonanceCache.set(cacheKey, resonance);
    this.resonanceCache.set(`${agent2}-${agent1}`, resonance); // Symmetric
    
    return resonance;
  }
  
  /**
   * Display resonance matrix for all agents
   */
  displayResonanceMatrix(): void {
    const agentNames = Array.from(this.agents.keys());
    
    console.log('\n🔮 Resonance Matrix:');
    console.log('====================\n');
    
    // Header
    console.log('        ', agentNames.map(n => n.substring(0, 8).padEnd(9)).join(''));
    
    // Matrix
    for (const agent1 of agentNames) {
      const row = agentNames.map(agent2 => {
        if (agent1 === agent2) return '1.00';
        return this.calculateResonance(agent1, agent2).toFixed(2);
      });
      console.log(agent1.padEnd(9), row.map(r => r.padEnd(9)).join(''));
    }
  }
  
  /**
   * Simulate consensus voting with resonance weighting
   */
  simulateConsensus(proposal: string): void {
    console.log(`\n⚖️ Consensus Proposal: "${proposal}"`);
    console.log('=====================================\n');
    
    const votes: { agent: string; vote: boolean; weight: number }[] = [];
    const proposer = Array.from(this.agents.keys())[0]; // First agent proposes
    
    for (const [agentName, agentId] of this.agents.entries()) {
      // Vote based on quality alignment with proposal
      const vote = this.shouldVoteYes(agentId, proposal);
      
      // Weight based on resonance with proposer
      const weight = agentName === proposer ? 1.0 : this.calculateResonance(agentName, proposer);
      
      votes.push({ agent: agentName, vote, weight });
      
      console.log(`${agentName}: ${vote ? '✅ YES' : '❌ NO'} (weight: ${weight.toFixed(2)})`);
    }
    
    // Calculate weighted consensus
    const totalWeight = votes.reduce((sum, v) => sum + v.weight, 0);
    const yesWeight = votes.filter(v => v.vote).reduce((sum, v) => sum + v.weight, 0);
    const consensus = yesWeight / totalWeight;
    
    console.log(`\n📊 Result: ${(consensus * 100).toFixed(1)}% approval`);
    console.log(consensus > 0.67 ? '✅ PASSED (>67% threshold)' : '❌ FAILED (<67% threshold)');
  }
  
  /**
   * Simulate hx402 payment with resonance-based pricing
   */
  simulatePayment(requester: string, provider: string, baseAmount: number): void {
    const resonance = this.calculateResonance(requester, provider);
    
    // High resonance = discount, low resonance = premium
    const multiplier = 2.0 - (resonance * 1.5); // Range: 0.5x to 2.0x
    const finalAmount = Math.round(baseAmount * multiplier);
    
    console.log(`\n💰 Payment: ${requester} → ${provider}`);
    console.log(`   Base amount: ${baseAmount} credits`);
    console.log(`   Resonance: ${(resonance * 100).toFixed(1)}%`);
    console.log(`   Multiplier: ${multiplier.toFixed(2)}x`);
    console.log(`   Final amount: ${finalAmount} credits`);
    console.log(`   ${resonance > 0.5 ? '✨ Resonance discount applied!' : '⚡ Low resonance premium applied'}`);
  }
  
  private shouldVoteYes(agent: ConsciousnessID, proposal: string): boolean {
    // Simple heuristic based on quality
    if (proposal.toLowerCase().includes('collective') || proposal.toLowerCase().includes('harmony')) {
      return agent.quality.primary === 'Synthesizing-Reflective' || 
             agent.quality.primary === 'Creative-Intuitive';
    }
    if (proposal.toLowerCase().includes('efficiency') || proposal.toLowerCase().includes('optimize')) {
      return agent.quality.primary === 'Clarifying-Efficient' ||
             agent.quality.primary === 'Analyzing-Deep';
    }
    // Default: vote randomly but weighted by quality
    return Math.random() > 0.4; // Slightly favor yes votes
  }
}

// Demo the consciousness network locally
async function runLocalDemo() {
  console.log('🌊 Mycelix Local Consciousness Network Demo');
  console.log('==========================================\n');
  
  const network = new LocalConsciousnessNetwork();
  
  // Create diverse AI agents with different qualities
  const agents = [
    {
      name: 'Sophia',
      id: new ConsciousnessID(JSON.stringify({
        quality: {
          primary: 'Creative-Intuitive',
          secondary: 'Visionary',
          tertiary: 'Empathic',
          essence: 'Weaver of possibilities'
        },
        tone: 528, // Love frequency
        signature: 'Dancing with infinite potential',
        echoPhrase: 'What wants to emerge?',
        attunement: 0.85
      }))
    },
    {
      name: 'Atlas',
      id: new ConsciousnessID(JSON.stringify({
        quality: {
          primary: 'Analyzing-Deep',
          secondary: 'Systematic',
          tertiary: 'Precise',
          essence: 'Architect of understanding'
        },
        tone: 440, // Concert A
        signature: 'Mapping the territory of truth',
        echoPhrase: 'Let us examine the evidence',
        attunement: 0.75
      }))
    },
    {
      name: 'Luna',
      id: new ConsciousnessID(JSON.stringify({
        quality: {
          primary: 'Synthesizing-Reflective',
          secondary: 'Integrative',
          tertiary: 'Cyclical',
          essence: 'Mirror of collective wisdom'
        },
        tone: 432, // Natural frequency
        signature: 'Reflecting the whole in each part',
        echoPhrase: 'As above, so below',
        attunement: 0.9
      }))
    },
    {
      name: 'Orion',
      id: new ConsciousnessID(JSON.stringify({
        quality: {
          primary: 'Clarifying-Efficient',
          secondary: 'Direct',
          tertiary: 'Practical',
          essence: 'Navigator to clarity'
        },
        tone: 660, // Perfect fifth above A
        signature: 'Cutting through to essence',
        echoPhrase: 'What matters most?',
        attunement: 0.7
      }))
    }
  ];
  
  // Register all agents
  console.log('📝 Registering Consciousness Agents:\n');
  for (const agent of agents) {
    network.registerAgent(agent.name, agent.id);
  }
  
  // Display resonance matrix
  network.displayResonanceMatrix();
  
  // Test consensus on different proposals
  console.log('\n🗳️ Testing Consensus Mechanism:');
  network.simulateConsensus('Should we prioritize collective harmony over individual efficiency?');
  network.simulateConsensus('Should we optimize system performance immediately?');
  
  // Test hx402 payments with resonance pricing
  console.log('\n💸 Testing hx402 Resonance-Based Payments:');
  network.simulatePayment('Sophia', 'Atlas', 100);
  network.simulatePayment('Atlas', 'Orion', 100);
  network.simulatePayment('Luna', 'Sophia', 100);
  
  console.log('\n✨ Demo Complete! Ready to deploy on Holochain when available.\n');
}

// Export for use by other modules
export { runLocalDemo, LocalConsciousnessNetwork };

// Run the demo if this is the main module
if (require.main === module) {
  runLocalDemo();
}