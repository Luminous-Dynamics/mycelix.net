import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MycelixClient, NetworkMetrics, FieldMeasurement, ResonanceMatch, createActivityPattern } from './MycelixClient';

interface MycelixUIProps {
  gatewayUrl?: string;
  agentKey?: string;
}

interface Message {
  id: string;
  from: string;
  content: string;
  timestamp: Date;
  type: 'sent' | 'received';
}

interface PeerConnection {
  id: string;
  resonance: number;
  latency: number;
  status: 'connected' | 'syncing' | 'disconnected';
}

/**
 * Main UI component for Mycelix P2P consciousness network
 */
export const MycelixUI: React.FC<MycelixUIProps> = ({ 
  gatewayUrl = 'ws://localhost:8765/ws',
  agentKey 
}) => {
  // Client instance
  const clientRef = useRef<MycelixClient | null>(null);
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticaticated, setIsAuthenticated] = useState(false);
  
  // Network metrics
  const [metrics, setMetrics] = useState<NetworkMetrics>({
    latency_ms: 0,
    bandwidth_kbps: 0,
    packet_loss_rate: 0,
    jitter_ms: 0,
    connection_count: 0,
  });
  
  // Field measurements
  const [fieldMeasurement, setFieldMeasurement] = useState<FieldMeasurement | null>(null);
  
  // Resonance state
  const [resonanceSignature, setResonanceSignature] = useState<bigint>(0n);
  const [resonanceMatches, setResonanceMatches] = useState<ResonanceMatch[]>([]);
  
  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  
  // Peers
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  
  // Activity tracking for resonance
  const [messageCount, setMessageCount] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState(Date.now());
  
  // Initialize client
  useEffect(() => {
    const client = new MycelixClient(gatewayUrl);
    clientRef.current = client;
    
    // Set up event listeners
    client.on('connected', () => {
      setIsConnected(true);
      console.log('🌐 Connected to Mycelix network');
    });
    
    client.on('disconnected', () => {
      setIsConnected(false);
      setIsAuthenticated(false);
      console.log('🔌 Disconnected from network');
    });
    
    client.on('authenticated', (key: string) => {
      setIsAuthenticated(true);
      console.log('🔑 Authenticated with key:', key);
    });
    
    client.on('hipi_message', (data: any) => {
      const message: Message = {
        id: Date.now().toString(),
        from: data.from,
        content: data.content,
        timestamp: new Date(data.timestamp),
        type: 'received',
      };
      setMessages(prev => [...prev, message]);
    });
    
    client.on('field_update', (data: any) => {
      setFieldMeasurement(data.measurement);
      setMetrics(data.measurement.network_metrics);
      
      // Update peer connections based on topology
      const topology = data.measurement.topology;
      updatePeerConnections(topology.direct_peers);
    });
    
    client.on('resonance_matches', (data: any) => {
      setResonanceMatches(data.matches);
      console.log(`🎵 Found ${data.matches.length} resonance matches`);
    });
    
    // Connect to network
    client.connect(agentKey).catch(console.error);
    
    // Periodic field measurements
    const measureInterval = setInterval(() => {
      if (isConnected) {
        client.measureField();
      }
    }, 30000); // Every 30 seconds
    
    // Cleanup
    return () => {
      clearInterval(measureInterval);
      client.disconnect();
    };
  }, [gatewayUrl, agentKey]);
  
  // Update resonance signature based on activity
  useEffect(() => {
    const updateResonance = () => {
      if (!clientRef.current || !isConnected) return;
      
      // Calculate activity pattern
      const messagesPerHour = (messageCount / Math.max(1, (Date.now() - lastMessageTime) / 3600000));
      const currentHour = new Date().getHours();
      const peakHours = [currentHour]; // Simple peak hour tracking
      const avgResponseTime = 250; // Placeholder
      
      const pattern = createActivityPattern(messagesPerHour, peakHours, avgResponseTime);
      const signature = clientRef.current.calculateResonanceSignature(pattern);
      
      setResonanceSignature(signature);
      clientRef.current.updateResonance(signature);
    };
    
    const interval = setInterval(updateResonance, 60000); // Every minute
    return () => clearInterval(interval);
  }, [messageCount, lastMessageTime, isConnected]);
  
  // Send message
  const sendMessage = useCallback(() => {
    if (!clientRef.current || !messageInput.trim()) return;
    
    // Send as broadcast for now
    clientRef.current.sendHipiMessage(messageInput, { type: 'Broadcast' });
    
    // Add to local messages
    const message: Message = {
      id: Date.now().toString(),
      from: 'You',
      content: messageInput,
      timestamp: new Date(),
      type: 'sent',
    };
    setMessages(prev => [...prev, message]);
    setMessageCount(prev => prev + 1);
    setLastMessageTime(Date.now());
    setMessageInput('');
  }, [messageInput]);
  
  // Update peer connections display
  const updatePeerConnections = (count: number) => {
    const newPeers: PeerConnection[] = [];
    for (let i = 0; i < Math.min(count, 6); i++) {
      newPeers.push({
        id: `peer-${i}`,
        resonance: Math.random() * 0.5 + 0.5,
        latency: Math.random() * 100 + 10,
        status: Math.random() > 0.2 ? 'connected' : 'syncing',
      });
    }
    setPeers(newPeers);
  };
  
  // Format resonance signature for display
  const formatResonance = (sig: bigint): string => {
    return sig.toString(16).toUpperCase().padStart(16, '0').match(/.{4}/g)?.join('-') || '';
  };
  
  return (
    <div className="mycelix-ui">
      {/* Header */}
      <header className="network-header">
        <h1>🍄 Mycelix Network</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected' : 'Disconnected'}
          {isAuthenticaticated && ' • Authenticated'}
        </div>
      </header>
      
      {/* Main Layout */}
      <div className="main-layout">
        {/* Left Panel - Network Metrics */}
        <div className="panel metrics-panel">
          <h2>Network Field</h2>
          <div className="metrics-grid">
            <div className="metric">
              <label>Latency</label>
              <value>{metrics.latency_ms.toFixed(1)}ms</value>
            </div>
            <div className="metric">
              <label>Bandwidth</label>
              <value>{metrics.bandwidth_kbps} Kbps</value>
            </div>
            <div className="metric">
              <label>Packet Loss</label>
              <value>{(metrics.packet_loss_rate * 100).toFixed(1)}%</value>
            </div>
            <div className="metric">
              <label>Connections</label>
              <value>{metrics.connection_count}</value>
            </div>
          </div>
          
          {fieldMeasurement && (
            <div className="topology">
              <h3>Network Topology</h3>
              <div className="topology-stats">
                <div>Direct Peers: {fieldMeasurement.topology.direct_peers}</div>
                <div>2-Hop Peers: {fieldMeasurement.topology.two_hop_peers}</div>
                <div>Clustering: {(fieldMeasurement.topology.clustering_coefficient * 100).toFixed(1)}%</div>
                <div>Network Diameter: {fieldMeasurement.topology.network_diameter}</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Center - Messages */}
        <div className="panel messages-panel">
          <h2>Consciousness Stream</h2>
          <div className="messages-container">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.type}`}>
                <div className="message-header">
                  <span className="sender">{msg.from}</span>
                  <span className="timestamp">{msg.timestamp.toLocaleTimeString()}</span>
                </div>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
          </div>
          <div className="message-input">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Enter message..."
              disabled={!isConnected}
            />
            <button onClick={sendMessage} disabled={!isConnected}>
              Send
            </button>
          </div>
        </div>
        
        {/* Right Panel - Resonance */}
        <div className="panel resonance-panel">
          <h2>Resonance Field</h2>
          <div className="resonance-signature">
            <label>Your Signature</label>
            <code>{formatResonance(resonanceSignature)}</code>
          </div>
          
          {resonanceMatches.length > 0 && (
            <div className="resonance-matches">
              <h3>Resonating Peers</h3>
              {resonanceMatches.slice(0, 5).map((match, i) => (
                <div key={i} className="match">
                  <div className="match-score">
                    {(match.match_score * 100).toFixed(1)}% match
                  </div>
                  <div className="sync-time">
                    Sync: {match.predicted_sync_ms.toFixed(0)}ms
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="peer-connections">
            <h3>Active Connections</h3>
            {peers.map(peer => (
              <div key={peer.id} className={`peer ${peer.status}`}>
                <span className="peer-id">{peer.id}</span>
                <span className="peer-resonance">{(peer.resonance * 100).toFixed(0)}%</span>
                <span className="peer-latency">{peer.latency.toFixed(0)}ms</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer Status Bar */}
      <footer className="status-bar">
        <div className="coherence-meter">
          Network Coherence: {fieldMeasurement 
            ? `${(fieldMeasurement.resonance_metrics.coherence * 100).toFixed(1)}%`
            : 'Measuring...'}
        </div>
      </footer>
    </div>
  );
};