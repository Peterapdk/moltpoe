export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

export interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'offline';
  role: string;
  model: string;
}

export interface Session {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'terminated';
  device: string;
  lastActive: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: string;
  message: string;
}

export enum View {
  CHAT = 'CHAT',
  AGENTS = 'AGENTS',
  SESSIONS = 'SESSIONS',
  MONITORING = 'MONITORING',
  TERMINAL = 'TERMINAL',
  SETTINGS = 'SETTINGS'
}

export interface UsageMetric {
  time: string;
  tokens: number;
  latency: number;
}

export enum GatewayStatus {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR'
}