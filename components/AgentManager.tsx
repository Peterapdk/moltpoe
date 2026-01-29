import React from 'react';
import { Agent } from '../types';
import { MoreVertical, Play, Square, Settings as SettingsIcon } from 'lucide-react';

const AgentManager: React.FC = () => {
  // Mock data for agents
  const agents: Agent[] = [
    { id: '1', name: 'Raven Core', status: 'active', role: 'Orchestrator', model: 'gemini-3-pro-preview' },
    { id: '2', name: 'DevScout', status: 'idle', role: 'Code Analysis', model: 'gemini-2.5-flash-latest' },
    { id: '3', name: 'Visual Cortex', status: 'offline', role: 'Image Processing', model: 'gemini-3-pro-image-preview' },
    { id: '4', name: 'Memory Bank', status: 'active', role: 'Context Retrieval', model: 'custom-embedding-v2' },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Agent Swarm</h2>
          <p className="text-raven-muted font-mono text-sm">Manage active Moltbot sub-processes and workers.</p>
        </div>
        <button className="px-4 py-2 bg-raven-primary hover:bg-pink-600 text-white text-sm font-medium rounded shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all">
          Deploy New Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div key={agent.id} className="group relative bg-black border border-raven-border rounded-xl p-5 hover:border-raven-secondary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                 <div className={`w-2 h-2 rounded-full ${
                    agent.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                    agent.status === 'idle' ? 'bg-yellow-500' : 'bg-red-500'
                 }`}></div>
                 <h3 className="font-bold text-white">{agent.name}</h3>
              </div>
              <button className="text-raven-muted hover:text-white">
                <MoreVertical size={16} />
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs font-mono">
                    <span className="text-raven-muted">Role</span>
                    <span className="text-raven-text">{agent.role}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                    <span className="text-raven-muted">Model</span>
                    <span className="text-cyan-400">{agent.model}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                    <span className="text-raven-muted">Uptime</span>
                    <span className="text-raven-text">14h 23m</span>
                </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-raven-border/50">
               <button className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded bg-raven-surface border border-raven-border hover:bg-raven-border text-xs font-medium transition-colors">
                  {agent.status === 'active' ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                  {agent.status === 'active' ? 'Stop' : 'Start'}
               </button>
               <button className="flex items-center justify-center px-2 py-1.5 rounded bg-raven-surface border border-raven-border hover:bg-raven-border text-raven-muted transition-colors">
                  <SettingsIcon size={14} />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentManager;