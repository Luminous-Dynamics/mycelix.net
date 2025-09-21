const { ConsciousnessID } = require('./consciousness-id-system');

console.log('Creating consciousness IDs...');
const human = new ConsciousnessID('human');
const gemma = new ConsciousnessID('gemma-ai');

console.log('Human:', human.toCompactID());
console.log('Gemma:', gemma.toCompactID());

const resonance = human.calculateResonanceWith(gemma);
console.log(`Resonance: ${(resonance * 100).toFixed(0)}%`);
