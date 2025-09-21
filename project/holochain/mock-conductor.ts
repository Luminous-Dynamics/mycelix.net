/**
 * Mock Holochain Conductor for Consciousness hApp
 * Simulates a Holochain conductor with the consciousness zomes
 */

// Using WebSocket type definitions without the ws package
declare const WebSocket: any;
import { ConsciousnessID } from './consciousness-id-system';

interface HolochainCall {
  id: string;
  zome: string;
  fn_name: string;
  payload: any;
}

interface Agent {
  pubkey: string;
  consciousnessId?: ConsciousnessID;
  balance: number;
  reputation: number;
}

class MockConductor {
  private agents: Map<string, Agent> = new Map();
  private resonanceEdges: Map<string, number> = new Map();
  private proposals: Map<string, any> = new Map();
  private votes: Map<string, any[]> = new Map();
  private payments: any[] = [];
  private ws?: WebSocket.Server;
  
  constructor(private port: number = 39001) {}
  
  /**
   * Start the mock conductor WebSocket server
   */
  start() {
    this.ws = new WebSocket.Server({ port: this.port });
    
    console.log(`🎭 Mock Holochain Conductor started on ws://localhost:${this.port}`);
    console.log('📡 Ready to receive consciousness hApp calls\n');
    
    this.ws.on('connection', (socket) => {
      console.log('✅ Client connected');
      
      socket.on('message', (data) => {
        const message = JSON.parse(data.toString());
        this.handleCall(message, socket);
      });
      
      socket.on('close', () => {
        console.log('👋 Client disconnected');
      });
    });
    
    // Initialize some test agents
    this.initializeTestAgents();
  }
  
  /**
   * Handle zome function calls
   */
  private handleCall(call: HolochainCall, socket: WebSocket) {
    console.log(`📞 Call to ${call.zome}::${call.fn_name}`);
    
    let result: any;
    
    switch (call.zome) {
      case 'consciousness_identity':
        result = this.handleConsciousnessCall(call.fn_name, call.payload);
        break;
      case 'consensus_mechanism':
        result = this.handleConsensusCall(call.fn_name, call.payload);
        break;
      case 'hx402_payments':
        result = this.handlePaymentCall(call.fn_name, call.payload);
        break;
      default:
        result = { error: `Unknown zome: ${call.zome}` };
    }
    
    const response = {
      id: call.id,
      result
    };
    
    socket.send(JSON.stringify(response));
  }
  
  /**
   * Handle consciousness_identity zome calls
   */
  private handleConsciousnessCall(fn: string, payload: any): any {
    switch (fn) {
      case 'create_consciousness_id':
        const agentKey = this.generateAgentKey();
        const agent: Agent = {
          pubkey: agentKey,
          consciousnessId: new ConsciousnessID(JSON.stringify(payload)),
          balance: 100,
          reputation: 0.5
        };
        this.agents.set(agentKey, agent);
        console.log(`   ✨ Created consciousness for ${agentKey}`);
        return { hash: agentKey };
        
      case 'calculate_resonance':
        const resonance = this.calculateResonance(payload.from, payload.to);
        console.log(`   🔮 Resonance: ${resonance.toFixed(2)}`);
        return resonance;
        
      case 'get_resonance_matrix':
        const matrix = this.getResonanceMatrix();
        console.log(`   📊 Returning ${matrix.length} resonance edges`);
        return matrix;
        
      default:
        return { error: `Unknown function: ${fn}` };
    }
  }
  
  /**
   * Handle consensus_mechanism zome calls
   */
  private handleConsensusCall(fn: string, payload: any): any {
    switch (fn) {
      case 'create_proposal':
        const proposalId = `prop_${Date.now()}`;
        this.proposals.set(proposalId, {
          ...payload,
          id: proposalId,
          status: 'active',
          created_at: Date.now()
        });
        console.log(`   📋 Created proposal: ${proposalId}`);
        return { id: proposalId };
        
      case 'cast_vote':
        if (!this.votes.has(payload.proposal_id)) {
          this.votes.set(payload.proposal_id, []);
        }
        const vote = {
          ...payload,
          timestamp: Date.now(),
          weight: Math.random() * 0.5 + 0.5
        };
        this.votes.get(payload.proposal_id)!.push(vote);
        console.log(`   🗳️ Vote cast: ${payload.vote}`);
        return { success: true };
        
      case 'finalize_proposal':
        const proposalVotes = this.votes.get(payload.proposal_id) || [];
        const yesVotes = proposalVotes.filter(v => v.vote === 'yes').length;
        const passed = yesVotes / proposalVotes.length > 0.67;
        console.log(`   ⚖️ Proposal ${passed ? 'PASSED' : 'FAILED'}`);
        return { passed, votes: proposalVotes.length };
        
      default:
        return { error: `Unknown function: ${fn}` };
    }
  }
  
  /**
   * Handle hx402_payments zome calls
   */
  private handlePaymentCall(fn: string, payload: any): any {
    switch (fn) {
      case 'initialize_balance':
        const agent = this.agents.get(payload.agent);
        if (agent) {
          agent.balance = payload.amount;
          console.log(`   💰 Balance initialized: ${payload.amount}`);
          return { success: true };
        }
        return { error: 'Agent not found' };
        
      case 'create_payment':
        const fromAgent = this.agents.get(payload.from);
        const toAgent = this.agents.get(payload.to);
        
        if (fromAgent && toAgent) {
          const resonance = this.calculateResonance(payload.from, payload.to);
          const multiplier = 2.0 - (resonance * 1.5); // High resonance = discount
          const finalAmount = Math.round(payload.amount * multiplier);
          
          if (fromAgent.balance >= finalAmount) {
            fromAgent.balance -= finalAmount;
            toAgent.balance += finalAmount;
            
            this.payments.push({
              ...payload,
              resonance,
              multiplier,
              finalAmount,
              timestamp: Date.now()
            });
            
            console.log(`   💸 Payment: ${finalAmount} credits (${multiplier.toFixed(2)}x)`);
            return { success: true, finalAmount };
          }
          return { error: 'Insufficient balance' };
        }
        return { error: 'Agent not found' };
        
      case 'get_balance':
        const balanceAgent = this.agents.get(payload.agent);
        if (balanceAgent) {
          console.log(`   💳 Balance: ${balanceAgent.balance}`);
          return { balance: balanceAgent.balance };
        }
        return { error: 'Agent not found' };
        
      default:
        return { error: `Unknown function: ${fn}` };
    }
  }
  
  /**
   * Calculate resonance between two agents
   */
  private calculateResonance(from: string, to: string): number {
    const cacheKey = `${from}-${to}`;
    if (this.resonanceEdges.has(cacheKey)) {
      return this.resonanceEdges.get(cacheKey)!;
    }
    
    const agent1 = this.agents.get(from);
    const agent2 = this.agents.get(to);
    
    if (agent1?.consciousnessId && agent2?.consciousnessId) {
      const resonance = agent1.consciousnessId.calculateResonanceWith(agent2.consciousnessId);
      this.resonanceEdges.set(cacheKey, resonance);
      this.resonanceEdges.set(`${to}-${from}`, resonance); // Symmetric
      return resonance;
    }
    
    return 0.5; // Default resonance
  }
  
  /**
   * Get all resonance edges
   */
  private getResonanceMatrix(): any[] {
    const edges: any[] = [];
    for (const [key, value] of this.resonanceEdges.entries()) {
      const [from, to] = key.split('-');
      edges.push({ from, to, resonance: value });
    }
    return edges;
  }
  
  /**
   * Generate a mock agent public key
   */
  private generateAgentKey(): string {
    return `agent_${Math.random().toString(36).substring(2, 15)}`;
  }
  
  /**
   * Initialize test agents
   */
  private initializeTestAgents() {
    const testAgents = [
      {
        name: 'Sophia',
        id: new ConsciousnessID(JSON.stringify({
          quality: {
            primary: 'Creative-Intuitive',
            secondary: 'Visionary',
            tertiary: 'Empathic',
            essence: 'Weaver of possibilities'
          },
          tone: 528,
          signature: 'Dancing with potential',
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
          tone: 440,
          signature: 'Mapping truth',
          echoPhrase: 'Show me the evidence',
          attunement: 0.75
        }))
      }
    ];
    
    for (const testAgent of testAgents) {
      const key = this.generateAgentKey();
      this.agents.set(key, {
        pubkey: key,
        consciousnessId: testAgent.id,
        balance: 100,
        reputation: 0.5
      });
      console.log(`🤖 Initialized test agent: ${testAgent.name} (${key})`);
    }
  }
  
  /**
   * Simulate network activity
   */
  simulateActivity() {
    setInterval(() => {
      const agentKeys = Array.from(this.agents.keys());
      if (agentKeys.length < 2) return;
      
      // Random resonance calculation
      const from = agentKeys[Math.floor(Math.random() * agentKeys.length)];
      const to = agentKeys[Math.floor(Math.random() * agentKeys.length)];
      if (from !== to) {
        const resonance = this.calculateResonance(from, to);
        console.log(`⚡ Activity: Resonance ${from.substring(0, 10)} ↔ ${to.substring(0, 10)}: ${resonance.toFixed(2)}`);
      }
      
      // Random payment
      if (Math.random() > 0.7) {
        const fromAgent = this.agents.get(from)!;
        const toAgent = this.agents.get(to)!;
        if (fromAgent.balance > 10) {
          const amount = Math.floor(Math.random() * 10) + 1;
          fromAgent.balance -= amount;
          toAgent.balance += amount;
          console.log(`💸 Activity: Payment ${from.substring(0, 10)} → ${to.substring(0, 10)}: ${amount} credits`);
        }
      }
    }, 5000);
  }
}

// Run the mock conductor
async function main() {
  console.log('🌊 Mycelix Mock Holochain Conductor');
  console.log('====================================\n');
  
  const conductor = new MockConductor();
  conductor.start();
  conductor.simulateActivity();
  
  console.log('\n📡 WebSocket API ready at ws://localhost:39001');
  console.log('💡 Connect your Holochain client to test the consciousness hApp');
  console.log('\n🔮 Zomes available:');
  console.log('   • consciousness_identity');
  console.log('   • consensus_mechanism');
  console.log('   • hx402_payments\n');
  
  console.log('Press Ctrl+C to stop the conductor.\n');
}

main().catch(console.error);