import React, { useState, useEffect } from 'react';
import { GatewayStatus } from '../types';
import { moltbotSocket } from '../services/moltbotSocket';
import { Wifi, WifiOff, Server, ShieldCheck, Globe, AlertTriangle, Activity, Check, X, Key } from 'lucide-react';

const STORAGE_KEY_URL = 'raven_gateway_url';
const STORAGE_KEY_TOKEN = 'raven_gateway_token';
const DEFAULT_URL = 'ws://127.0.0.1:18789';

const Settings: React.FC = () => {
  // Initialize from localStorage or fallback to socket service default
  const [wsUrl, setWsUrl] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(STORAGE_KEY_URL) || moltbotSocket.getUrl() || DEFAULT_URL;
    }
    return moltbotSocket.getUrl() || DEFAULT_URL;
  });

  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(STORAGE_KEY_TOKEN) || moltbotSocket.getToken() || '';
    }
    return moltbotSocket.getToken() || '';
  });
  
  const [status, setStatus] = useState<GatewayStatus>(GatewayStatus.DISCONNECTED);
  const [testStatus, setTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILURE'>('IDLE');

  useEffect(() => {
    setStatus(moltbotSocket.getStatus());
    return moltbotSocket.onStatusChange(setStatus);
  }, []);

  const saveSettings = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_URL, wsUrl);
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
    }
  };

  const handleConnectionToggle = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === GatewayStatus.CONNECTED || status === GatewayStatus.CONNECTING) {
      moltbotSocket.disconnect();
    } else {
      saveSettings();
      moltbotSocket.connect(wsUrl, token);
    }
  };

  const handleBlur = () => {
    saveSettings();
  };

  const handleTestConnection = (e: React.MouseEvent) => {
    e.preventDefault();
    if (testStatus === 'TESTING' || !wsUrl) return;

    setTestStatus('TESTING');
    
    try {
        let testUrl = wsUrl;
        
        // Add token to test connection if present
        if (token) {
            try {
                const urlObj = new URL(wsUrl);
                urlObj.searchParams.append('token', token);
                testUrl = urlObj.toString();
            } catch (e) {
                const separator = testUrl.includes('?') ? '&' : '?';
                testUrl = `${testUrl}${separator}token=${encodeURIComponent(token)}`;
            }
        }

        const socket = new WebSocket(testUrl);
        
        // Timeout to prevent hanging tests
        const timeoutId = setTimeout(() => {
            if (socket.readyState !== WebSocket.OPEN) {
                socket.close();
                setTestStatus('FAILURE');
                setTimeout(() => setTestStatus('IDLE'), 2000);
            }
        }, 3000);

        socket.onopen = () => {
            clearTimeout(timeoutId);
            socket.close(); // Close immediately, we just wanted to check connectivity
            setTestStatus('SUCCESS');
            setTimeout(() => setTestStatus('IDLE'), 2000);
        };

        socket.onerror = () => {
            clearTimeout(timeoutId);
            setTestStatus('FAILURE');
            setTimeout(() => setTestStatus('IDLE'), 2000);
        };

    } catch (err) {
        console.error("Test connection error:", err);
        setTestStatus('FAILURE');
        setTimeout(() => setTestStatus('IDLE'), 2000);
    }
  };

  const isMixedContentRisk = typeof window !== 'undefined' && 
                             window.location.protocol === 'https:' && 
                             wsUrl.startsWith('ws://');

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">System Configuration</h2>
        <p className="text-raven-muted font-mono text-sm">Manage gateway connections and environment preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Connection Settings */}
        <div className="bg-black border border-raven-border rounded-xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Server size={100} className="text-raven-primary" />
          </div>
          
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Globe size={18} className="text-raven-secondary" />
            Gateway Connection
          </h3>

          <form onSubmit={handleConnectionToggle} className="space-y-6 relative z-10">
            {/* WS URL Input */}
            <div>
              <label className="block text-xs font-mono text-raven-muted mb-2 uppercase tracking-wider">WebSocket Endpoint</label>
              <div className="flex gap-2">
                <input 
                    type="text" 
                    value={wsUrl}
                    onChange={(e) => setWsUrl(e.target.value)}
                    onBlur={handleBlur}
                    disabled={status === GatewayStatus.CONNECTED}
                    className={`flex-1 bg-raven-bg border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none transition-all ${
                        status === GatewayStatus.CONNECTED 
                        ? 'border-green-900/50 text-green-500/80 cursor-not-allowed' 
                        : 'border-raven-border text-raven-text focus:border-raven-secondary focus:ring-1 focus:ring-raven-secondary'
                    }`}
                    placeholder={DEFAULT_URL}
                />
                <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={status === GatewayStatus.CONNECTED || testStatus === 'TESTING'}
                    className={`px-4 rounded-lg font-medium transition-all flex items-center justify-center min-w-[80px] border ${
                        testStatus === 'SUCCESS' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                        testStatus === 'FAILURE' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                        testStatus === 'TESTING' ? 'bg-raven-surface border-raven-border text-raven-muted' :
                        status === GatewayStatus.CONNECTED ? 'bg-raven-surface/50 border-raven-border/50 text-raven-muted cursor-not-allowed' :
                        'bg-raven-surface border-raven-border text-raven-text hover:bg-raven-border hover:text-white'
                    }`}
                >
                    {testStatus === 'TESTING' ? <Activity size={18} className="animate-spin" /> :
                     testStatus === 'SUCCESS' ? <Check size={18} /> :
                     testStatus === 'FAILURE' ? <X size={18} /> :
                     'Test'}
                </button>
              </div>
              
              {isMixedContentRisk && (
                  <div className="mt-2 flex items-start gap-2 text-yellow-500 text-xs">
                      <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                      <span>
                          Warning: Connecting to 'ws://' from 'https://' may be blocked by your browser. 
                          Consider using a secure tunnel (wss://) or allow insecure content for this site.
                      </span>
                  </div>
              )}
            </div>
            
            {/* Token Input */}
            <div>
               <label className="block text-xs font-mono text-raven-muted mb-2 uppercase tracking-wider">Gateway Token</label>
               <div className="relative">
                  <input 
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      onBlur={handleBlur}
                      disabled={status === GatewayStatus.CONNECTED}
                      className={`w-full bg-raven-bg border rounded-lg px-4 py-3 pl-10 text-sm font-mono focus:outline-none transition-all ${
                        status === GatewayStatus.CONNECTED 
                        ? 'border-green-900/50 text-green-500/80 cursor-not-allowed' 
                        : 'border-raven-border text-raven-text focus:border-raven-secondary focus:ring-1 focus:ring-raven-secondary'
                      }`}
                      placeholder="Enter authentication token..."
                  />
                  <Key size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${status === GatewayStatus.CONNECTED ? 'text-green-500/50' : 'text-raven-muted'}`} />
               </div>
               <p className="mt-2 text-[10px] text-raven-muted">
                   Leave empty if your Moltbot instance runs in no-auth mode.
               </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-raven-surface rounded-lg border border-raven-border/50">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                        status === GatewayStatus.CONNECTED ? 'bg-green-500 animate-pulse' : 
                        status === GatewayStatus.CONNECTING ? 'bg-yellow-500 animate-bounce' : 
                        'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-mono text-raven-text">
                        {status === GatewayStatus.CONNECTED ? 'Link Established' : 
                         status === GatewayStatus.CONNECTING ? 'Handshaking...' : 
                         'Disconnected'}
                    </span>
                </div>
                
                <button 
                    type="submit"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        status === GatewayStatus.CONNECTED 
                        ? 'bg-red-950/30 text-red-400 border border-red-900/50 hover:bg-red-900/50' 
                        : 'bg-raven-secondary/20 text-raven-secondary border border-raven-secondary/50 hover:bg-raven-secondary/30'
                    }`}
                >
                    {status === GatewayStatus.CONNECTED ? (
                        <>
                            <WifiOff size={16} /> Disconnect
                        </>
                    ) : (
                        <>
                            <Wifi size={16} /> Connect
                        </>
                    )}
                </button>
            </div>
          </form>
        </div>

        {/* Security / Info */}
        <div className="bg-black border border-raven-border rounded-xl p-6 shadow-lg">
           <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <ShieldCheck size={18} className="text-raven-primary" />
            Security Context
          </h3>
          
          <div className="space-y-4 font-mono text-sm">
            <div className="flex justify-between py-3 border-b border-raven-border/30">
                <span className="text-raven-muted">Encryption</span>
                <span className="text-green-400">TLS v1.3 (Simulated)</span>
            </div>
            <div className="flex justify-between py-3 border-b border-raven-border/30">
                <span className="text-raven-muted">Auth Status</span>
                <span className={token ? "text-green-400" : "text-yellow-500"}>
                    {token ? 'Token Configured' : 'Anonymous / No-Auth'}
                </span>
            </div>
            <div className="flex justify-between py-3 border-b border-raven-border/30">
                <span className="text-raven-muted">Session ID</span>
                <span className="text-raven-secondary">sess_89234jk2</span>
            </div>
            <div className="flex justify-between py-3">
                <span className="text-raven-muted">Moltbot Version</span>
                <span className="text-raven-text">v2.4.0-alpha</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;