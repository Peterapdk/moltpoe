import React from 'react';
import { View, GatewayStatus } from '../types';
import { Terminal, MessageSquare, Users, Activity, Settings, Power, Radio } from 'lucide-react';

interface NavigationProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  gatewayStatus: GatewayStatus;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate, onLogout, gatewayStatus }) => {
  const navItems = [
    { id: View.CHAT, label: 'Chat', icon: MessageSquare },
    { id: View.AGENTS, label: 'Agents', icon: Users },
    { id: View.SESSIONS, label: 'Sessions', icon: Radio },
    { id: View.MONITORING, label: 'Monitor', icon: Activity },
    { id: View.TERMINAL, label: 'Terminal', icon: Terminal },
    { id: View.SETTINGS, label: 'Settings', icon: Settings },
  ];

  const getStatusColor = () => {
    switch (gatewayStatus) {
      case GatewayStatus.CONNECTED: return 'bg-green-500';
      case GatewayStatus.CONNECTING: return 'bg-yellow-500';
      case GatewayStatus.ERROR: return 'bg-red-500';
      case GatewayStatus.DISCONNECTED: return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (gatewayStatus) {
      case GatewayStatus.CONNECTED: return 'Online';
      case GatewayStatus.CONNECTING: return 'Connecting...';
      case GatewayStatus.ERROR: return 'Connection Error';
      case GatewayStatus.DISCONNECTED: return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <div className="w-64 h-full bg-raven-surface border-r border-raven-border flex flex-col justify-between p-4">
      <div>
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-raven-primary to-raven-secondary flex items-center justify-center">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <h1 className="text-xl font-bold tracking-tighter text-white">TheRaven</h1>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group ${
                currentView === item.id
                  ? 'bg-raven-border text-raven-secondary shadow-[0_0_10px_rgba(6,182,212,0.15)] border border-raven-border'
                  : 'text-raven-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={18} className={currentView === item.id ? 'text-raven-secondary' : 'text-raven-muted group-hover:text-white'} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-4 border-t border-raven-border">
         <div className="mb-4 px-3 py-2 rounded border border-raven-border/50 bg-black/30">
            <p className="text-xs text-raven-muted uppercase tracking-wider mb-1">Gateway Status</p>
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${getStatusColor()} ${gatewayStatus === GatewayStatus.CONNECTED ? 'animate-pulse' : ''}`}></span>
                <span className={`text-xs font-mono ${gatewayStatus === GatewayStatus.ERROR ? 'text-red-400' : gatewayStatus === GatewayStatus.CONNECTED ? 'text-green-500' : 'text-raven-muted'}`}>
                    Moltbot: {getStatusText()}
                </span>
            </div>
         </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-md transition-colors"
        >
          <Power size={18} />
          <span className="text-sm font-medium">Disconnect</span>
        </button>
      </div>
    </div>
  );
};

export default Navigation;