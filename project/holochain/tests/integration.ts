import { Scenario, runScenario, pause, CallableCell } from '@holochain/tryorama';
import { ActionHash, AgentPubKey } from '@holochain/client';
import test from 'tape-promise/tape';

// Test consciousness profile creation and retrieval
test('consciousness profile operations', async (t) => {
  await runScenario(async (scenario: Scenario) => {
    
    // Set up players
    const [alice, bob] = await scenario.addPlayersWithApps([
      { appBundleSource: { path: '../mycelix-dna/mycelix.dna' } },
      { appBundleSource: { path: '../mycelix-dna/mycelix.dna' } }
    ]);
    
    await scenario.shareAllAgents();
    
    // Alice creates her consciousness profile
    const aliceProfile = await alice.cells[0].callZome({
      zome_name: 'consciousness',
      fn_name: 'create_consciousness_profile',
      payload: {
        consciousness_type: 'Individual',
        resonance_signature: 12345678901234567890n,
        behavioral_fingerprint: 'alice-pattern-001'
      }
    });
    
    t.ok(aliceProfile, 'Alice created consciousness profile');
    
    // Bob retrieves Alice's profile
    await pause(500); // Wait for DHT propagation
    
    const retrievedProfile = await bob.cells[0].callZome({
      zome_name: 'consciousness',
      fn_name: 'get_consciousness_profile',
      payload: alice.agentPubKey
    });
    
    t.ok(retrievedProfile, 'Bob retrieved Alice\'s profile');
    t.equal(retrievedProfile.resonance_signature, 12345678901234567890n, 
      'Resonance signature matches');
  });
});

// Test HIPI message sending and receiving
test('HIPI protocol communication', async (t) => {
  await runScenario(async (scenario: Scenario) => {
    
    const [alice, bob] = await scenario.addPlayersWithApps([
      { appBundleSource: { path: '../mycelix-dna/mycelix.dna' } },
      { appBundleSource: { path: '../mycelix-dna/mycelix.dna' } }
    ]);
    
    await scenario.shareAllAgents();
    
    // Alice sends HIPI message to Bob
    const messageHash = await alice.cells[0].callZome({
      zome_name: 'hipi',
      fn_name: 'send_message',
      payload: {
        to: { Agent: bob.agentPubKey },
        content: {
          Text: {
            message: 'Hello Bob from Alice!',
            language: 'en',
            sentiment: 0.8
          }
        },
        urgency: 'Normal'
      }
    });
    
    t.ok(messageHash, 'Alice sent HIPI message');
    
    await pause(1000); // Wait for message propagation
    
    // Bob receives messages
    const messages = await bob.cells[0].callZome({
      zome_name: 'hipi',
      fn_name: 'receive_messages',
      payload: null
    });
    
    t.ok(messages.length > 0, 'Bob received messages');
    t.equal(messages[0].content.Text.message, 'Hello Bob from Alice!', 
      'Message content matches');
  });
});

// Test resonance matching
test('resonance pattern matching', async (t) => {
  await runScenario(async (scenario: Scenario) => {
    
    const [alice, bob, charlie] = await scenario.addPlayersWithApps([
      { appBundleSource: { path: '../mycelix-dna/mycelix.dna' } },
      { appBundleSource: { path: '../mycelix-dna/mycelix.dna' } },
      { appBundleSource: { path: '../mycelix-dna/mycelix.dna' } }
    ]);
    
    await scenario.shareAllAgents();
    
    // Create profiles with similar resonance signatures
    await alice.cells[0].callZome({
      zome_name: 'consciousness',
      fn_name: 'create_consciousness_profile',
      payload: {
        consciousness_type: 'Individual',
        resonance_signature: 1000n,
        behavioral_fingerprint: 'alice-pattern'
      }
    });
    
    await bob.cells[0].callZome({
      zome_name: 'consciousness',
      fn_name: 'create_consciousness_profile',
      payload: {
        consciousness_type: 'Individual',
        resonance_signature: 1010n, // Very close to Alice
        behavioral_fingerprint: 'bob-pattern'
      }
    });
    
    await charlie.cells[0].callZome({
      zome_name: 'consciousness',
      fn_name: 'create_consciousness_profile',
      payload: {
        consciousness_type: 'Individual',
        resonance_signature: 5000n, // Far from Alice
        behavioral_fingerprint: 'charlie-pattern'
      }
    });
    
    await pause(1000); // Wait for DHT propagation
    
    // Alice finds resonating peers
    const resonatingPeers = await alice.cells[0].callZome({
      zome_name: 'hipi',
      fn_name: 'find_resonating_peers',
      payload: 0.9 // 90% match threshold
    });
    
    t.ok(resonatingPeers.length > 0, 'Alice found resonating peers');
    
    // Bob should be in the list, Charlie should not
    const bobInList = resonatingPeers.some(
      ([agent, score]) => agent.toString() === bob.agentPubKey.toString()
    );
    const charlieInList = resonatingPeers.some(
      ([agent, score]) => agent.toString() === charlie.agentPubKey.toString()
    );
    
    t.ok(bobInList, 'Bob is in resonating peers list');
    t.notOk(charlieInList, 'Charlie is not in resonating peers list');
  });
});

// Test field measurements
test('network field measurements', async (t) => {
  await runScenario(async (scenario: Scenario) => {
    
    const [alice] = await scenario.addPlayersWithApps([
      { appBundleSource: { path: '../mycelix-dna/mycelix.dna' } }
    ]);
    
    // Measure network latency
    const latency = await alice.cells[0].callZome({
      zome_name: 'field',
      fn_name: 'measure_latency',
      payload: alice.agentPubKey // Measure to self
    });
    
    t.ok(latency >= 0, 'Latency measurement is non-negative');
    t.ok(latency < 1000, 'Latency is reasonable (<1s)');
    
    // Measure field density
    const density = await alice.cells[0].callZome({
      zome_name: 'field',
      fn_name: 'measure_field_density',
      payload: null
    });
    
    t.ok(density, 'Field density measured');
    t.ok(density.clustering_coefficient >= 0 && density.clustering_coefficient <= 1,
      'Clustering coefficient is valid');
    
    // Analyze resonance pattern
    const pattern = await alice.cells[0].callZome({
      zome_name: 'field',
      fn_name: 'analyze_resonance_pattern',
      payload: null
    });
    
    t.ok(pattern, 'Resonance pattern analyzed');
    t.ok(pattern.pattern_stability >= 0 && pattern.pattern_stability <= 1,
      'Pattern stability is valid');
  });
});

// Test conversation threads
test('conversation management', async (t) => {
  await runScenario(async (scenario: Scenario) => {
    
    const [alice, bob, charlie] = await scenario.addPlayersWithApps([
      { appBundleSource: { path: '../mycelix-dna/mycelix.dna' } },
      { appBundleSource: { path: '../mycelix-dna/mycelix.dna' } },
      { appBundleSource: { path: '../mycelix-dna/mycelix.dna' } }
    ]);
    
    await scenario.shareAllAgents();
    
    // Alice starts a conversation with Bob and Charlie
    const conversationHash = await alice.cells[0].callZome({
      zome_name: 'hipi',
      fn_name: 'start_conversation',
      payload: [bob.agentPubKey, charlie.agentPubKey]
    });
    
    t.ok(conversationHash, 'Conversation created');
    
    // Alice sends message to conversation
    const messageHash = await alice.cells[0].callZome({
      zome_name: 'hipi',
      fn_name: 'send_to_conversation',
      payload: {
        conversation_hash: conversationHash,
        content: {
          Text: {
            message: 'Hello everyone in the conversation!',
            language: 'en',
            sentiment: null
          }
        }
      }
    });
    
    t.ok(messageHash, 'Message sent to conversation');
    
    await pause(1000);
    
    // Bob and Charlie should receive the message
    const bobMessages = await bob.cells[0].callZome({
      zome_name: 'hipi',
      fn_name: 'receive_messages',
      payload: null
    });
    
    const charlieMessages = await charlie.cells[0].callZome({
      zome_name: 'hipi',
      fn_name: 'receive_messages',
      payload: null
    });
    
    t.ok(bobMessages.length > 0, 'Bob received conversation message');
    t.ok(charlieMessages.length > 0, 'Charlie received conversation message');
  });
});

// Test consciousness connection creation
test('consciousness connections', async (t) => {
  await runScenario(async (scenario: Scenario) => {
    
    const [alice, bob] = await scenario.addPlayersWithApps([
      { appBundleSource: { path: '../mycelix-dna/mycelix.dna' } },
      { appBundleSource: { path: '../mycelix-dna/mycelix.dna' } }
    ]);
    
    await scenario.shareAllAgents();
    
    // Create profiles first
    await alice.cells[0].callZome({
      zome_name: 'consciousness',
      fn_name: 'create_consciousness_profile',
      payload: {
        consciousness_type: 'Individual',
        resonance_signature: 1000n,
        behavioral_fingerprint: 'alice-pattern'
      }
    });
    
    await bob.cells[0].callZome({
      zome_name: 'consciousness',
      fn_name: 'create_consciousness_profile',
      payload: {
        consciousness_type: 'Individual',
        resonance_signature: 1100n,
        behavioral_fingerprint: 'bob-pattern'
      }
    });
    
    await pause(500);
    
    // Alice creates connection to Bob
    const connectionHash = await alice.cells[0].callZome({
      zome_name: 'consciousness',
      fn_name: 'create_consciousness_connection',
      payload: {
        to: bob.agentPubKey,
        connection_type: 'Resonant'
      }
    });
    
    t.ok(connectionHash, 'Consciousness connection created');
    
    // Get Alice's connections
    const connections = await alice.cells[0].callZome({
      zome_name: 'consciousness',
      fn_name: 'get_my_connections',
      payload: null
    });
    
    t.equal(connections.length, 1, 'Alice has one connection');
    t.equal(connections[0].to.toString(), bob.agentPubKey.toString(), 
      'Connection is to Bob');
  });
});

// Test network time series tracking
test('network metrics time series', async (t) => {
  await runScenario(async (scenario: Scenario) => {
    
    const [alice] = await scenario.addPlayersWithApps([
      { appBundleSource: { path: '../mycelix-dna/mycelix.dna' } }
    ]);
    
    // Track network metrics over time
    const timeSeries = await alice.cells[0].callZome({
      zome_name: 'field',
      fn_name: 'track_network_metrics',
      payload: null
    });
    
    t.ok(timeSeries, 'Time series data retrieved');
    t.ok(timeSeries.avg_latency_ms >= 0, 'Average latency is valid');
    t.ok(timeSeries.latency_trend, 'Latency trend calculated');
    
    // Verify trend is one of the expected values
    const validTrends = ['Improving', 'Stable', 'Degrading'];
    const trendType = Object.keys(timeSeries.latency_trend)[0];
    t.ok(validTrends.includes(trendType), 'Trend type is valid');
  });
});

// Run all tests
console.log('🧪 Running Mycelix Holochain Integration Tests...');