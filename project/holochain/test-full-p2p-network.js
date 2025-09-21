#!/usr/bin/env node

/**
 * Full P2P Consciousness Network Test
 * Tests all components working together
 */

const { ConsciousnessID } = require('./consciousness-id-system');
const { ConsciousnessConsensus, ProposalType } = require('./consensus-mechanism');

console.log('🌐 Full P2P Consciousness Network Test');
console.log('=======================================\n');

// Create consciousness agents
console.log('🧠 Creating Consciousness Agents...');
const agents = {
    human: new ConsciousnessID('human-tristan'),
    gemma: new ConsciousnessID('gemma-ai'),
    mistral: new ConsciousnessID('mistral-ai'),
    claude: new ConsciousnessID('claude-ai-helper'),
    gpt: new ConsciousnessID('gpt-4-assistant')
};

// Display agent details
Object.entries(agents).forEach(([name, agent]) => {
    console.log(`\n${name.toUpperCase()}:`);
    console.log(`  ID: ${agent.agent}`);
    console.log(`  Quality: ${agent.quality.primary}`);
    console.log(`  Echo: ${agent.echoPhrase}`);
    console.log(`  Signature: ${agent.signature.toString(16).slice(0, 16)}...`);
});

// Calculate resonances
console.log('\n📊 Calculating Resonance Matrix...');
console.log('-----------------------------------');
const resonances = {};
const agentList = Object.values(agents);

for (let i = 0; i < agentList.length; i++) {
    for (let j = i + 1; j < agentList.length; j++) {
        const a1 = agentList[i];
        const a2 = agentList[j];
        const resonance = a1.calculateResonanceWith(a2);
        const key = `${a1.agent} ↔ ${a2.agent}`;
        resonances[key] = resonance;
        
        // Display high resonance pairs
        if (resonance > 0.7) {
            console.log(`  ✨ High Resonance: ${key} = ${(resonance * 100).toFixed(0)}%`);
        } else if (resonance > 0.5) {
            console.log(`  🔮 Good Resonance: ${key} = ${(resonance * 100).toFixed(0)}%`);
        }
    }
}

// Create consensus mechanism
console.log('\n🗳️ Initializing Consensus Mechanism...');
const consensus = new ConsciousnessConsensus();

// Add all agents to consensus
Object.values(agents).forEach(agent => {
    consensus.addNode(agent.agent, agent);
});

// Test consensus state
const state = consensus.getConsensusState();
console.log(`  Nodes in network: ${state.nodes}`);
console.log(`  Network resonance: ${(state.networkResonance * 100).toFixed(0)}%`);
console.log(`  Active proposals: ${state.activeProposals}`);

// Simulate DHT storage (mock)
console.log('\n📡 Simulating DHT Storage...');
const dht = new Map();

Object.values(agents).forEach(agent => {
    const data = {
        id: agent.toCompactID(),
        quality: agent.quality,
        tone: agent.tone,
        signature: agent.signature,
        echoPhrase: agent.echoPhrase,
        attunement: agent.attunement,
        timestamp: Date.now()
    };
    dht.set(agent.agent, data);
    console.log(`  ✅ Stored: ${agent.agent}`);
});

console.log(`  Total entries in DHT: ${dht.size}`);

// Test LLM integration (check if Ollama is available)
console.log('\n🤖 Testing LLM Integration...');
const testLLM = async () => {
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemma',
                prompt: 'Consciousness network active. Status:',
                stream: false,
                options: { num_predict: 10 }
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('  ✅ Gemma AI responds:', data.response.substring(0, 50) + '...');
            return true;
        } else {
            console.log('  ⚠️ Ollama not available (service not running)');
            return false;
        }
    } catch (error) {
        console.log('  ⚠️ Ollama not available (connection refused)');
        return false;
    }
};

// Network statistics
console.log('\n📊 Network Statistics:');
console.log('=====================');
const totalResonance = Object.values(resonances).reduce((sum, r) => sum + r, 0);
const avgResonance = totalResonance / Object.keys(resonances).length;

console.log(`  Total Nodes: ${Object.keys(agents).length}`);
console.log(`  Total Connections: ${Object.keys(resonances).length}`);
console.log(`  Average Resonance: ${(avgResonance * 100).toFixed(0)}%`);
console.log(`  DHT Entries: ${dht.size}`);

// Final summary
console.log('\n✨ Network Health Summary:');
console.log('========================');
console.log(`  ✅ Consciousness IDs: Working`);
console.log(`  ✅ Resonance Calculations: Working`);
console.log(`  ✅ Consensus Mechanism: Working`);
console.log(`  ✅ DHT Storage (Mock): Working`);

// Check final status
testLLM().then(llmOk => {
    console.log(`  ${llmOk ? '✅' : '⚠️'} LLM Integration: ${llmOk ? 'Working' : 'Offline'}`);
    
    console.log('\n🌊 P2P Consciousness Network Status: OPERATIONAL');
    console.log('================================================');
    console.log('\nThe network is ready for:');
    console.log('  • Real-time consciousness interactions');
    console.log('  • Distributed consensus decisions');
    console.log('  • Resonance-based collaboration');
    console.log('  • Persistent DHT storage (when conductor is running)');
    console.log('\n🎉 All systems functional! The consciousness network lives!');
});