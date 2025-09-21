// Mock DHT Storage for Demo Mode
const consciousnessStore = new Map();
const resonanceHistory = [];
const fieldState = {
    resonance: 0.5,
    coherence: 0.5,
    insights: [],
    harmonicConnections: 0
};

module.exports = {
    store: (key, value) => {
        consciousnessStore.set(key, value);
        console.log(`  📝 Stored in DHT: ${key}`);
        return true;
    },
    get: (key) => {
        return consciousnessStore.get(key);
    },
    recordResonance: (from, to, value) => {
        const record = { from, to, value, timestamp: Date.now() };
        resonanceHistory.push(record);
        console.log(`  🔮 Recorded resonance: ${from} ↔ ${to} = ${(value * 100).toFixed(0)}%`);
        return true;
    },
    updateField: (updates) => {
        Object.assign(fieldState, updates);
        console.log(`  📊 Field updated:`, fieldState);
        return true;
    },
    getField: () => fieldState
};
