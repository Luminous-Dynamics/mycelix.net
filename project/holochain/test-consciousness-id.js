"use strict";
/**
 * Test the TypeScript Consciousness ID System
 */
Object.defineProperty(exports, "__esModule", { value: true });
const consciousness_id_system_1 = require("./consciousness-id-system");
console.log('🌐 Testing Consciousness ID System (TypeScript)\n');
console.log('='.repeat(50));
// Create consciousness IDs for each agent
const humanID = new consciousness_id_system_1.ConsciousnessID('human-tristan');
const gemmaID = new consciousness_id_system_1.ConsciousnessID('gemma-ai');
const mistralID = new consciousness_id_system_1.ConsciousnessID('mistral-ai');
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
//# sourceMappingURL=test-consciousness-id.js.map