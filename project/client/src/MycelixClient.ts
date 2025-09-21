/**
 * MycelixClient - TypeScript client for connecting to Holochain via Rust gateway
 * 
 * This client provides:
 * - WebSocket connection to Rust gateway
 * - Type-safe message passing
 * - CRDT state synchronization
 * - Resonance pattern matching
 * - Real-time field measurements
 */

import { EventEmitter } from 'events';

// Types matching our Rust gateway
export interface NetworkMetrics {
  latency_ms: number;
  bandwidth_kbps: number;
  packet_loss_rate: number;
  jitter_ms: number;
  connection_count: number;
}

export interface ResonanceMatch {
  signature: bigint;
  match_score: number;
  predicted_sync_ms: number;
}

export interface FieldMeasurement {
  timestamp: number;
  network_metrics: NetworkMetrics;
  resonance_metrics: {
    signature: bigint;
    coherence: number;
    matched_peers: bigint[];
  };
  topology: {
    direct_peers: number;
    two_hop_peers: number;
    clustering_coefficient: number;
    network_diameter: number;
    centrality_score: number;
  };
}

export type MessageTarget =
  | { type: 'Agent'; agent_key: string }
  | { type: 'Broadcast' }
  | { type: 'ResonanceGroup'; resonance: bigint };

// Client message types
interface ClientMessage {
  type: string;
  [key: string]: any;
}

interface AuthenticateMessage extends ClientMessage {
  type: 'Authenticate';
  agent_key: string;
}

interface SendHipiMessage extends ClientMessage {
  type: 'SendHipi';
  content: string;
  target: MessageTarget;
}

interface UpdateResonanceMessage extends ClientMessage {
  type: 'UpdateResonance';
  signature: bigint;
}

interface MeasureFieldMessage extends ClientMessage {
  type: 'MeasureField';
}

interface SyncStateMessage extends ClientMessage {
  type: 'SyncState';
  state_type: string;
  data: Uint8Array;
}

// Server response types
export interface ServerResponse {
  type: string;
  [key: string]: any;
}

export interface HipiReceived extends ServerResponse {
  type: 'HipiReceived';
  from: string;
  content: string;
  timestamp: number;
}

export interface FieldUpdate extends ServerResponse {
  type: 'FieldUpdate';
  measurement: FieldMeasurement;
}

export interface ResonanceMatches extends ServerResponse {
  type: 'ResonanceMatches';
  matches: ResonanceMatch[];
}

export interface StateUpdate extends ServerResponse {
  type: 'StateUpdate';
  state_type: string;
  data: Uint8Array;
}

/**
 * Main client class for Mycelix network interaction
 */
export class MycelixClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private agentKey: string | null = null;
  private resonanceSignature: bigint | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: ClientMessage[] = [];
  private isConnected = false;
  private lastActivity = Date.now();
  
  // Metrics tracking
  private metrics: NetworkMetrics = {
    latency_ms: 0,
    bandwidth_kbps: 0,
    packet_loss_rate: 0,
    jitter_ms: 0,
    connection_count: 0,
  };
  
  constructor(url: string = 'ws://localhost:8765/ws') {
    super();
    this.url = url;
  }
  
  /**
   * Connect to the Mycelix gateway
   */
  async connect(agentKey?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.isConnected) {
        resolve();
        return;
      }
      
      console.log('🍄 Connecting to Mycelix gateway...');
      
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('✅ Connected to Mycelix gateway');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Authenticate if agent key provided
        if (agentKey) {
          this.authenticate(agentKey);
        }
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Process queued messages
        this.processMessageQueue();
        
        this.emit('connected');
        resolve();
      };
      
      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.emit('error', error);
        reject(error);
      };
      
      this.ws.onclose = () => {
        console.log('🔌 Disconnected from gateway');
        this.isConnected = false;
        this.stopHeartbeat();
        this.emit('disconnected');
        
        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
    });
  }
  
  /**
   * Authenticate with Holochain agent key
   */
  authenticate(agentKey: string): void {
    this.agentKey = agentKey;
    this.send({
      type: 'Authenticate',
      agent_key: agentKey,
    });
    this.emit('authenticated', agentKey);
  }
  
  /**
   * Send a HIPI message through Holochain
   */
  sendHipiMessage(content: string, target: MessageTarget): void {
    this.send({
      type: 'SendHipi',
      content,
      target,
    });
  }
  
  /**
   * Update resonance signature for pattern matching
   */
  updateResonance(signature: bigint): void {
    this.resonanceSignature = signature;
    this.send({
      type: 'UpdateResonance',
      signature: signature.toString(), // Convert for JSON
    });
  }
  
  /**
   * Calculate resonance signature from activity pattern
   */
  calculateResonanceSignature(activityPattern: number[]): bigint {
    // Simple hash function to generate signature
    let signature = 0n;
    
    for (let i = 0; i < Math.min(activityPattern.length, 16); i++) {
      const normalized = Math.floor(activityPattern[i] * 15);
      signature |= BigInt(normalized) << BigInt(i * 4);
    }
    
    return signature;
  }
  
  /**
   * Request field measurement
   */
  measureField(): void {
    const startTime = Date.now();
    this.send({ type: 'MeasureField' });
    
    // Update local latency estimate
    this.once('field_update', () => {
      this.metrics.latency_ms = Date.now() - startTime;
    });
  }
  
  /**
   * Sync CRDT state with network
   */
  syncState(stateType: string, data: Uint8Array): void {
    this.send({
      type: 'SyncState',
      state_type: stateType,
      data: Array.from(data), // Convert for JSON
    });
  }
  
  /**
   * Get current network metrics
   */
  getMetrics(): NetworkMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get current resonance signature
   */
  getResonanceSignature(): bigint | null {
    return this.resonanceSignature;
  }
  
  /**
   * Disconnect from gateway
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
  
  // Private methods
  
  private send(message: ClientMessage): void {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message));
      this.lastActivity = Date.now();
    } else {
      // Queue message for later
      this.messageQueue.push(message);
    }
  }
  
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as ServerResponse;
      
      // Update activity timestamp
      this.lastActivity = Date.now();
      
      // Handle different message types
      switch (message.type) {
        case 'HipiReceived':
          this.emit('hipi_message', message as HipiReceived);
          break;
          
        case 'FieldUpdate':
          const fieldUpdate = message as FieldUpdate;
          this.metrics = fieldUpdate.measurement.network_metrics;
          this.emit('field_update', fieldUpdate);
          break;
          
        case 'ResonanceMatches':
          this.emit('resonance_matches', message as ResonanceMatches);
          break;
          
        case 'StateUpdate':
          this.emit('state_update', message as StateUpdate);
          break;
          
        case 'Heartbeat':
          // Heartbeat response - update latency
          if (message.timestamp) {
            this.metrics.latency_ms = Date.now() - message.timestamp;
          }
          break;
          
        default:
          this.emit('message', message);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }
  
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'Heartbeat',
          timestamp: Date.now(),
        });
      }
    }, 30000); // Every 30 seconds
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    console.log(`🔄 Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(this.agentKey || undefined).catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, this.reconnectDelay);
    
    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }
  
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }
}

/**
 * Utility function to create activity pattern from user behavior
 */
export function createActivityPattern(
  messagesPerHour: number,
  peakHours: number[],
  avgResponseTime: number
): number[] {
  const pattern: number[] = new Array(16).fill(0);
  
  // Encode activity level
  pattern[0] = Math.min(messagesPerHour / 100, 1);
  
  // Encode peak hours
  for (let i = 0; i < Math.min(peakHours.length, 8); i++) {
    pattern[i + 1] = peakHours[i] / 24;
  }
  
  // Encode response time
  pattern[9] = Math.min(avgResponseTime / 1000, 1);
  
  // Add some variation for uniqueness
  for (let i = 10; i < 16; i++) {
    pattern[i] = Math.random() * 0.5;
  }
  
  return pattern;
}