import React from 'react';
import ReactDOM from 'react-dom/client';
import { MycelixUI } from './MycelixUI';
import './mycelix.css';

// Get configuration from environment or defaults
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'ws://localhost:8765/ws';
const AGENT_KEY = import.meta.env.VITE_AGENT_KEY || undefined;

// Initialize the Mycelix UI
const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <MycelixUI gatewayUrl={GATEWAY_URL} agentKey={AGENT_KEY} />
  </React.StrictMode>
);