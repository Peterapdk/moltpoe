import React, { useState, useEffect } from 'react';
import { Session, GatewayStatus } from '../types';
import { moltbotSocket } from '../services/moltbotSocket';
import { Smartphone, Monitor, Trash2, Clock, Shield, Wifi, WifiOff } from 'lucide-react';

const SessionManager: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 1. Immediate check on mount
    const initialStatus = moltbotSocket.getStatus();
    const initialConnected = initialStatus === GatewayStatus.CONNECTED;
    setIsConnected(initialConnected);

    if (initialConnected) {
      console.log('[SessionManager] Gateway active on mount, fetching sessions...');
      moltbotSocket.sendMessage({ type: 'get_sessions' });
    }

    // 2. Subscribe to status changes for future updates
    const unsubStatus = moltbotSocket.onStatusChange((status) => {
      const isNowConnected = status === GatewayStatus.CONNECTED;
      setIsConnected(isNowConnected);
      
      if (isNowConnected) {
        console.log('[SessionManager] Gateway reconnected, fetching sessions...');
        moltbotSocket.sendMessage({ type: 'get_sessions' });
      }
    });

    // 3. Listen for session data
    const unsubMessage = moltbotSocket.onMessage((data: any) => {
      if (data.type === 'sessions_update' && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      }
    });

    return () => {
      unsubStatus();
      unsubMessage();
    };
  }, []);

  const handleTerminate = (id: string) => {
    if (isConnected) {
      moltbotSocket.sendMessage({ type: 'terminate_session', sessionId: id });
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Session Control</h2>
          <p className="text-raven-muted font-mono text-sm">Monitor and manage active connections to the Moltbot instance.</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isConnected ? 'bg-green-950/20 border-green-900/50 text-green-400' : 'bg-red-950/20 border-red-900/50 text-red-400'}`}>
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="text-xs font-mono uppercase">{isConnected ? 'Live Sync' : 'Offline Mode'}</span>
        </div>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="group flex items-center justify-between p-4 bg-black border border-raven-border rounded-xl hover:border-raven-primary/50 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                session.status === 'active' ? 'bg-raven-primary/10 text-raven-primary' : 
                session.status === 'terminated' ? 'bg-red-900/10 text-red-500' : 'bg-raven-border/50 text-raven-muted'
              }`}>
                {session.device.includes('iPhone') || session.device.includes('Mobile') ? <Smartphone size={20} /> : <Monitor size={20} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">{session.name}</h3>
                  {session.status === 'active' && (
                    <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs font-mono text-raven-muted">
                  <span className="flex items-center gap-1"><Shield size={10} /> {session.id}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {session.lastActive}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <div className={`px-2 py-1 rounded text-xs font-mono border ${
                  session.status === 'active' ? 'border-green-500/30 text-green-400 bg-green-500/5' :
                  session.status === 'idle' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5' :
                  'border-red-500/30 text-red-500 bg-red-500/5'
               }`}>
                  {session.status.toUpperCase()}
               </div>
               
               {session.status !== 'terminated' && (
                 <button 
                   onClick={() => handleTerminate(session.id)}
                   className="p-2 text-raven-muted hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-900/50"
                   title="Terminate Session"
                 >
                   <Trash2 size={16} />
                 </button>
               )}
            </div>
          </div>
        ))}
        
        {sessions.length === 0 && (
            <div className="text-center py-12 border border-dashed border-raven-border rounded-xl">
                <p className="text-raven-muted font-mono">{isConnected ? 'Waiting for session data...' : 'No active sessions detected (Offline).'}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default SessionManager;