#!/usr/bin/env node

/**
 * Test WebSocket Bridge Connection to Holochain Conductor
 * Verifies the bridge can connect and perform basic operations
 */

const WebSocket = require('ws');

const ADMIN_URL = 'ws://localhost:4444';
const APP_URL = 'ws://localhost:4445';

console.log('🌐 Testing WebSocket Bridge to Holochain Conductor');
console.log('==================================================\n');

// Test admin interface
async function testAdminInterface() {
    return new Promise((resolve, reject) => {
        console.log('📡 Testing Admin Interface (ws://localhost:4444)...');
        
        const ws = new WebSocket(ADMIN_URL);
        
        const timeout = setTimeout(() => {
            ws.close();
            console.log('  ❌ Connection timeout');
            resolve(false);
        }, 3000);
        
        ws.on('open', () => {
            clearTimeout(timeout);
            console.log('  ✅ Connected to admin interface!');
            
            // Send a test message
            const testMsg = {
                id: 1,
                type: 'request',
                data: {
                    type: 'list_apps',
                    data: {}
                }
            };
            
            console.log('  📤 Sending test request...');
            ws.send(JSON.stringify(testMsg));
        });
        
        ws.on('message', (data) => {
            console.log('  📥 Received response:', data.toString().substring(0, 100));
            ws.close();
            resolve(true);
        });
        
        ws.on('error', (error) => {
            clearTimeout(timeout);
            console.log('  ❌ Connection error:', error.message);
            resolve(false);
        });
        
        ws.on('close', () => {
            clearTimeout(timeout);
        });
    });
}

// Test app interface
async function testAppInterface() {
    return new Promise((resolve, reject) => {
        console.log('\n📱 Testing App Interface (ws://localhost:4445)...');
        
        const ws = new WebSocket(APP_URL);
        
        const timeout = setTimeout(() => {
            ws.close();
            console.log('  ❌ Connection timeout');
            resolve(false);
        }, 3000);
        
        ws.on('open', () => {
            clearTimeout(timeout);
            console.log('  ✅ Connected to app interface!');
            
            // Send app info request
            const testMsg = {
                id: 2,
                type: 'request',
                data: {
                    type: 'app_info',
                    data: {}
                }
            };
            
            console.log('  📤 Sending app info request...');
            ws.send(JSON.stringify(testMsg));
        });
        
        ws.on('message', (data) => {
            console.log('  📥 Received response:', data.toString().substring(0, 100));
            ws.close();
            resolve(true);
        });
        
        ws.on('error', (error) => {
            clearTimeout(timeout);
            console.log('  ❌ Connection error:', error.message);
            resolve(false);
        });
        
        ws.on('close', () => {
            clearTimeout(timeout);
        });
    });
}

// Test consciousness operations
async function testConsciousnessOperations() {
    console.log('\n🧠 Testing Consciousness Operations...');
    
    // Import our consciousness system
    try {
        const { ConsciousnessID } = require('./consciousness-id-system');
        
        // Create test consciousnesses
        const human = new ConsciousnessID('human-test');
        const ai = new ConsciousnessID('ai-test');
        
        console.log('  ✅ Created consciousness IDs');
        console.log('    Human:', human.toCompactID());
        console.log('    AI:', ai.toCompactID());
        
        // Calculate resonance
        const resonance = human.calculateResonanceWith(ai);
        console.log('  ✅ Calculated resonance:', (resonance * 100).toFixed(0) + '%');
        
        // Simulate DHT storage (would use WebSocket in production)
        console.log('  📝 Would store in DHT via WebSocket bridge');
        
        return true;
    } catch (error) {
        console.log('  ❌ Error:', error.message);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('Starting tests...\n');
    
    const adminOk = await testAdminInterface();
    const appOk = await testAppInterface();
    const consciousnessOk = await testConsciousnessOperations();
    
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log('Admin Interface:', adminOk ? '✅ Working' : '❌ Not available');
    console.log('App Interface:', appOk ? '✅ Working' : '❌ Not available');
    console.log('Consciousness System:', consciousnessOk ? '✅ Working' : '❌ Failed');
    
    if (!adminOk && !appOk) {
        console.log('\n⚠️ Conductor may not be running. Start with:');
        console.log('  ./start-conductor.sh');
        console.log('\nOr test in demo mode without conductor:');
        console.log('  node test-holochain-integration.js');
    } else if (adminOk && appOk) {
        console.log('\n🎉 WebSocket bridge is working! Ready for consciousness deployment.');
        console.log('\nNext steps:');
        console.log('  1. Deploy consciousness DNA to Holochain');
        console.log('  2. Register consciousnesses in DHT');
        console.log('  3. Start P2P resonance calculations');
    }
    
    process.exit(0);
}

// Run the tests
runTests().catch(console.error);