import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import ChatInterface from './components/ChatInterface';
import AgentManager from './components/AgentManager';
import SessionManager from './components/SessionManager';
import MonitoringDashboard from './components/MonitoringDashboard';
import Terminal from './components/Terminal';
import Settings from './components/Settings';
import { View, GatewayStatus } from './types';
import { Lock } from 'lucide-react';
import { moltbotSocket } from './services/moltbotSocket';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>(View.CHAT);
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>(GatewayStatus.DISCONNECTED);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // WebSocket initialization and cleanup
  useEffect(() => {
    // Subscribe to status changes
    const unsub = moltbotSocket.onStatusChange((status) => {
        setGatewayStatus(status);
    });

    if (isAuthenticated) {
        // Attempt connection when authenticated
        // In a real scenario, you might pass the token here or config
        moltbotSocket.connect();
    } else {
        // Disconnect on logout
        moltbotSocket.disconnect();
    }

    return () => {
        unsub();
    };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would verify against a backend
    // For this prototype, we accept non-empty credentials
    if (username && password) {
      setIsAuthenticated(true);
    } else {
      setError('Invalid credentials');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full h-screen bg-raven-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-raven-surface border border-raven-border rounded-2xl p-8 shadow-[0_0_50px_-10px_rgba(236,72,153,0.15)] relative overflow-hidden">
           {/* Decorative Top Line */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-raven-primary to-raven-secondary"></div>
           
           <div className="mb-8 text-center">
             <div className="w-12 h-12 bg-gradient-to-br from-raven-primary to-raven-secondary rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-pink-500/20">
               <Lock className="text-white" size={24} />
             </div>
             <h1 className="text-2xl font-bold text-white tracking-tight">TheRaven</h1>
             <p className="text-raven-muted text-sm mt-2">Secure Gateway for Moltbot</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-4">
             <div>
               <label className="block text-xs font-mono text-raven-muted mb-1.5 uppercase tracking-wider">Identity</label>
               <input 
                 type="text" 
                 value={username}
                 onChange={(e) => setUsername(e.target.value)}
                 className="w-full bg-black border border-raven-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-raven-secondary focus:ring-1 focus:ring-raven-secondary transition-all"
                 placeholder="username"
               />
             </div>
             <div>
               <label className="block text-xs font-mono text-raven-muted mb-1.5 uppercase tracking-wider">Access Key</label>
               <input 
                 type="password" 
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full bg-black border border-raven-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-raven-secondary focus:ring-1 focus:ring-raven-secondary transition-all"
                 placeholder="••••••••"
               />
             </div>
             
             {error && <p className="text-red-400 text-xs text-center">{error}</p>}

             <button 
               type="submit"
               className="w-full bg-white text-black font-bold py-2.5 rounded-lg hover:bg-gray-200 transition-colors mt-4"
             >
               Authenticate
             </button>
           </form>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case View.CHAT:
        return <ChatInterface />;
      case View.AGENTS:
        return <AgentManager />;
      case View.SESSIONS:
        return <SessionManager />;
      case View.MONITORING:
        return <MonitoringDashboard />;
      case View.TERMINAL:
        return <Terminal />;
      case View.SETTINGS:
        return <Settings />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-raven-bg text-raven-text overflow-hidden font-sans selection:bg-raven-primary selection:text-white">
      <Navigation 
        currentView={currentView} 
        onNavigate={setCurrentView}
        onLogout={() => setIsAuthenticated(false)}
        gatewayStatus={gatewayStatus} 
      />
      <main className="flex-1 h-full relative">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;