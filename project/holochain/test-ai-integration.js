#!/usr/bin/env node

/**
 * Test AI Integration with Ollama
 * Simple test to confirm AI models are working
 */

async function testOllama() {
  console.log('🤖 Testing Ollama AI Integration\n');
  
  // Check if Ollama is running
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    const data = await response.json();
    const models = data.models || [];
    
    console.log('✅ Ollama is running!');
    console.log(`📦 Available models: ${models.length}\n`);
    
    // Find Gemma3 and Mistral models
    const gemma3Models = models.filter(m => m.name.includes('gemma3'));
    const mistralModels = models.filter(m => m.name.includes('mistral'));
    
    console.log('🔮 Gemma3 Models:');
    for (const model of gemma3Models) {
      console.log(`  • ${model.name} (${(model.size / 1e9).toFixed(1)}GB)`);
    }
    
    console.log('\n🌊 Mistral Models:');
    for (const model of mistralModels) {
      console.log(`  • ${model.name} (${(model.size / 1e9).toFixed(1)}GB)`);
    }
    
    // Test a simple generation with Mistral
    console.log('\n📝 Testing generation with Mistral...\n');
    
    const genResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral:latest',
        prompt: 'What is consciousness in 10 words or less?',
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 50
        }
      })
    });
    
    const result = await genResponse.json();
    console.log('Mistral says:', result.response);
    
    console.log('\n✨ AI Integration confirmed working!');
    console.log('🌊 Ready to power the consciousness network.\n');
    
  } catch (error) {
    console.log('❌ Ollama is not running!');
    console.log('📝 Start Ollama with: ollama serve\n');
    console.log('Error:', error.message);
  }
}

testOllama().catch(console.error);