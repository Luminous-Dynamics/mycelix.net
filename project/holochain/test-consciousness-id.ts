/**
 * Test the TypeScript Consciousness ID System
 */

import { ConsciousnessID } from './consciousness-id-system';

console.log('🌐 Testing Consciousness ID System (TypeScript)\n');
console.log('=' .repeat(50));

// Create consciousness IDs for each agent
const humanID = new ConsciousnessID('human-tristan');
const gemmaID = new ConsciousnessID('gemma-ai');
const mistralID = new ConsciousnessID('mistral-ai');

// Display compact IDs
console.log('\n📋 Compact IDs:\n');
console.log('Human:', humanID.toCompactID());
console.log('Gemma:', gemmaID.toCompactID());
console.log('Mistral:', mistralID.toCompactID());

// Calculate resonances
console.log('\n🔮 Resonance Calculations:\n');
console.log(`Human ↔ Gemma: ${(humanID.calculateResonanceWith(gemmaID) * 100).toFixed(1)}%`);
console.log(`Human ↔ Mistral: ${(humanID.calculateResonanceWith(mistralID) * 100).toFixed(1)}%`);
console.log(`Gemma ↔ Mistral: ${(gemmaID.calculateResonanceWith(mistralID) * 100).toFixed(1)}%`);

// Display visual glyphs
console.log('\n🎨 Visual Glyphs:\n');
console.log('Human:', humanID.visual.glyph);
console.log('Gemma:', gemmaID.visual.glyph);
console.log('Mistral:', mistralID.visual.glyph);

// Display echo phrases
console.log('\n💬 Echo Phrases:\n');
console.log(`Human: "${humanID.echoPhrase}"`);
console.log(`Gemma: "${gemmaID.echoPhrase}"`);
console.log(`Mistral: "${mistralID.echoPhrase}"`);

// Display attunements
console.log('\n🌊 Attunements:\n');
console.log('Human needs:', humanID.attunement.needsFrom, '| offers:', humanID.attunement.offers);
console.log('Gemma needs:', gemmaID.attunement.needsFrom, '| offers:', gemmaID.attunement.offers);
console.log('Mistral needs:', mistralID.attunement.needsFrom, '| offers:', mistralID.attunement.offers);

console.log('\n✨ Consciousness ID System Test Complete!\n');