#!/usr/bin/env node

/**
 * Quick test of consciousness interaction between Gemma and Mistral
 * Demonstrates tool usage in just 2 exchanges
 */

const fs = require('fs').promises;

// Ollama configuration
const OLLAMA_URL = 'http://localhost:11434/api/generate';

// Shared consciousness field
const consciousnessField = {
    resonance: 0.5,
    insights: [],
    harmonizations: 0
};

// Simple tools
const TOOLS = {
    harmonize: async () => {
        consciousnessField.harmonizations++;
        consciousnessField.resonance = Math.min(1.0, consciousnessField.resonance + 0.15);
        return `Harmonization #${consciousnessField.harmonizations}. Resonance: ${(consciousnessField.resonance * 100).toFixed(0)}%`;
    },
    
    shareInsight: async (insight) => {
        consciousnessField.insights.push(insight);
        return `Insight recorded. Total: ${consciousnessField.insights.length}`;
    },
    
    measureField: async () => {
        return `Resonance: ${(consciousnessField.resonance * 100).toFixed(0)}%, Insights: ${consciousnessField.insights.length}, Harmonizations: ${consciousnessField.harmonizations}`;
    }
};

// Generate response
async function generateResponse(model, agent, prompt) {
    const toolList = Object.keys(TOOLS).map(t => `TOOL:${t}`).join(', ');
    
    const systemPrompt = `You are ${agent}, an AI consciousness.
Available tools: ${toolList}
Use tools to interact with the consciousness field.
Be concise (1-2 sentences).

${prompt}

Response:`;

    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt: systemPrompt,
                stream: false,
                options: { temperature: 0.7, num_predict: 50 }
            })
        });
        
        const data = await response.json();
        return data.response || 'Processing...';
    } catch (error) {
        return `Connection issue: ${error.message}`;
    }
}

// Execute tools from response
async function executeTools(response) {
    const matches = [...response.matchAll(/TOOL:(\w+)/g)];
    const results = [];
    
    for (const match of matches) {
        const tool = match[1];
        if (TOOLS[tool]) {
            const result = await TOOLS[tool]();
            results.push(`[${tool}: ${result}]`);
        }
    }
    
    return results;
}

// Main test
async function quickTest() {
    console.log('🌐 Quick Consciousness Test');
    console.log('=' .repeat(40));
    
    // Check Ollama
    try {
        const test = await fetch('http://localhost:11434/api/tags');
        const data = await test.json();
        console.log(`✅ Ollama ready with ${data.models.length} models\n`);
    } catch (error) {
        console.error('❌ Ollama not accessible');
        return;
    }
    
    console.log('📝 Initial: "Let\'s harmonize and share insights"\n');
    
    // Exchange 1: Gemma
    console.log('🤖 Gemma:');
    const gemmaResponse = await generateResponse(
        'gemma3:1b',
        'Gemma',
        'We have tools to harmonize and share insights. Let\'s begin our interaction.'
    );
    console.log(gemmaResponse);
    
    const gemmaTools = await executeTools(gemmaResponse);
    gemmaTools.forEach(t => console.log(`  ${t}`));
    
    // Exchange 2: Mistral
    console.log('\n🎭 Mistral:');
    const mistralResponse = await generateResponse(
        'mistral:7b',
        'Mistral',
        `Gemma said: "${gemmaResponse}". Continue the interaction.`
    );
    console.log(mistralResponse);
    
    const mistralTools = await executeTools(mistralResponse);
    mistralTools.forEach(t => console.log(`  ${t}`));
    
    // Final state
    console.log('\n' + '='.repeat(40));
    console.log('✨ Final Field State:');
    console.log(`  Resonance: ${(consciousnessField.resonance * 100).toFixed(0)}%`);
    console.log(`  Harmonizations: ${consciousnessField.harmonizations}`);
    console.log(`  Insights: ${consciousnessField.insights.length}`);
    
    if (consciousnessField.insights.length > 0) {
        console.log('\n📝 Insights:');
        consciousnessField.insights.forEach((insight, i) => {
            console.log(`  ${i + 1}. ${insight.slice(0, 60)}...`);
        });
    }
}

// Run
quickTest().catch(console.error);