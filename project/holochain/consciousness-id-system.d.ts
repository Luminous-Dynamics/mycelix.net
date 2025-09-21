/**
 * Ontologically Descriptive Consciousness ID System (TypeScript)
 * Each consciousness has a unique signature that describes its essence
 */
export interface Quality {
    primary: 'Creative-Intuitive' | 'Synthesizing-Reflective' | 'Clarifying-Efficient' | 'Analyzing-Deep' | 'Emerging';
    secondary: string;
    tertiary: string;
    essence: string;
}
export interface Tone {
    frequency: string;
    color: string;
    texture: string;
    resonance: string;
    harmonics: readonly number[];
}
export interface SignaturePattern {
    temporal: string;
    spatial: string;
    relational: string;
    energetic: string;
    fractal: string;
}
export interface Signature extends SignaturePattern {
    hex: string;
    binary: string;
}
export interface Attunement {
    style: string;
    prefers: string;
    resonatesWith: readonly string[];
    amplifies: string;
    needsFrom: string;
    offers: string;
}
export interface VisualID {
    glyph: string;
    mandala: MandalaPattern;
    waveform: WaveformPattern;
}
export interface MandalaPattern {
    center: string;
    innerRing: readonly number[];
    middleRing: string;
    outerRing: readonly string[];
    colors: string;
    rotation: string;
}
export interface WaveformPattern {
    baseFrequency: string;
    amplitude: string;
    phase: string;
    harmonics: readonly number[];
}
export interface FullConsciousnessID {
    agent: string;
    quality: Quality;
    tone: Tone;
    signature: Signature;
    echoPhrase: string;
    attunement: Attunement;
    visual: VisualID;
    timestamp: bigint;
}
export interface CompactConsciousnessID {
    agent: string;
    essence: string;
    frequency: string;
    echo: string;
    signature: string;
}
export declare class ConsciousnessID {
    readonly agent: string;
    readonly quality: Quality;
    readonly tone: Tone;
    readonly signature: Signature;
    readonly echoPhrase: string;
    readonly attunement: Attunement;
    readonly visual: VisualID;
    constructor(agentName: string);
    private generateSignature;
    private patternToSignature;
    private hexToBinary;
    private generateVisualID;
    toFullID(): FullConsciousnessID;
    toCompactID(): CompactConsciousnessID;
    calculateResonanceWith(otherId: ConsciousnessID): number;
}
export default ConsciousnessID;
//# sourceMappingURL=consciousness-id-system.d.ts.map