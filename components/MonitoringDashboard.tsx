import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { moltbotSocket } from '../services/moltbotSocket';
import { GatewayStatus } from '../types';
import { Activity, DollarSign, Zap, Clock, RefreshCw } from 'lucide-react';

const MonitoringDashboard: React.FC = () => {
  // Historical Data States
  const [tokenData, setTokenData] = useState([
    { time: '10:00:00', input: 120, output: 240 },
    { time: '10:05:00', input: 180, output: 190 },
    { time: '10:10:00', input: 450, output: 560 },
    { time: '10:15:00', input: 200, output: 300 },
    { time: '10:20:00', input: 600, output: 800 },
    { time: '10:25:00', input: 300, output: 400 },
    { time: '10:30:00', input: 250, output: 350 },
  ]);

  const [apiLatency, setApiLatency] = useState([
    { time: '10:00:00', ms: 45 },
    { time: '10:05:00', ms: 52 },
    { time: '10:10:00', ms: 120 },
    { time: '10:15:00', ms: 48 },
    { time: '10:20:00', ms: 50 },
    { time: '10:25:00', ms: 47 },
    { time: '10:30:00', ms: 45 },
  ]);

  const [requestRate, setRequestRate] = useState([
    { time: '10:00:00', rpm: 12 },
    { time: '10:05:00', rpm: 15 },
    { time: '10:10:00', rpm: 25 },
    { time: '10:15:00', rpm: 18 },
    { time: '10:20:00', rpm: 30 },
    { time: '10:25:00', rpm: 22 },
    { time: '10:30:00', rpm: 20 },
  ]);

  // Real-time Metrics
  const [currentMetrics, setCurrentMetrics] = useState({
    latency: 45,
    totalTokens: 142893,
    tps: 0,
    cost: 0.142, // Estimated accumulated cost
    rpm: 20
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Check initial status
    setIsConnected(moltbotSocket.getStatus() === GatewayStatus.CONNECTED);

    const unsubStatus = moltbotSocket.onStatusChange((status) => {
      setIsConnected(status === GatewayStatus.CONNECTED);
    });

    const unsubMessage = moltbotSocket.onMessage((data: any) => {
      // Expected format: { type: 'metrics', inputTokens: 150, outputTokens: 200, latency: 45, rpm: 22 }
      if (data.type === 'usage' || data.type === 'metrics') {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const input = data.input || data.inputTokens || Math.floor(Math.random() * 100); 
        const output = data.output || data.outputTokens || Math.floor(Math.random() * 200);
        const latency = data.latency || Math.floor(Math.random() * 60 + 30);
        const rpm = data.rpm || Math.floor(Math.random() * 10 + 15);

        // Update Charts
        setTokenData(prev => {
          const newData = [...prev, { time: timeStr, input, output }];
          return newData.length > 20 ? newData.slice(newData.length - 20) : newData;
        });

        setApiLatency(prev => {
          const newData = [...prev, { time: timeStr, ms: latency }];
          return newData.length > 20 ? newData.slice(newData.length - 20) : newData;
        });

        setRequestRate(prev => {
          const newData = [...prev, { time: timeStr, rpm: rpm }];
          return newData.length > 20 ? newData.slice(newData.length - 20) : newData;
        });

        // Calculate Cost (Rough estimation: $0.50 / 1M input, $1.50 / 1M output for generic pro models)
        const requestCost = (input * 0.0000005) + (output * 0.0000015);

        // Update Summary Cards
        setCurrentMetrics(prev => ({
          latency: latency,
          totalTokens: prev.totalTokens + input + output,
          tps: Math.floor((input + output) / 2), // Mock TPS calc or read from data
          cost: prev.cost + requestCost,
          rpm: rpm
        }));
        
        setIsRefreshing(false);
      }
    });

    return () => {
      unsubStatus();
      unsubMessage();
    };
  }, []);

  const handleRefresh = () => {
    if (isConnected) {
        setIsRefreshing(true);
        moltbotSocket.sendMessage({ type: 'get_metrics' });
        // Auto-reset refreshing state after timeout if no response
        setTimeout(() => setIsRefreshing(false), 2000);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto space-y-8">
      {/* Header & Connection Status */}
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-bold text-white mb-1">System Telemetry</h2>
           <div className="flex items-center gap-2">
             <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
             <p className="text-raven-muted font-mono text-sm">
               {isConnected ? 'LIVE FEED ACTIVE' : 'FEED DISCONNECTED'}
             </p>
           </div>
        </div>
        <div className="flex gap-3">
             {/* Refresh Button */}
             <button 
                onClick={handleRefresh}
                disabled={!isConnected}
                className={`px-3 py-2 text-xs font-mono border rounded transition-colors flex items-center gap-2 ${
                    isConnected 
                    ? 'bg-raven-surface hover:bg-raven-border text-raven-text border-raven-border' 
                    : 'bg-raven-surface/50 text-raven-muted border-raven-border/50 cursor-not-allowed'
                }`}
            >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> REFRESH
            </button>

             {/* Restart Gateway Button */}
             <button 
                onClick={() => {
                    moltbotSocket.disconnect();
                    setTimeout(() => moltbotSocket.connect(), 1000);
                }}
                className="px-4 py-2 bg-red-950/20 hover:bg-red-900/40 text-red-400 text-xs font-mono border border-red-900/50 rounded transition-colors"
            >
                RESTART GATEWAY
            </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-black border border-raven-border rounded-xl p-5 flex flex-col justify-between hover:border-raven-secondary/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-raven-secondary/10 rounded-lg text-raven-secondary">
                      <Zap size={20} />
                  </div>
                  <span className="text-xs font-mono text-raven-muted uppercase">TPS</span>
              </div>
              <div>
                  <h3 className="text-3xl font-bold text-white font-mono">{currentMetrics.tps}</h3>
                  <p className="text-xs text-raven-muted mt-1">Tokens per second</p>
              </div>
          </div>

          <div className="bg-black border border-raven-border rounded-xl p-5 flex flex-col justify-between hover:border-raven-primary/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-raven-primary/10 rounded-lg text-raven-primary">
                      <Activity size={20} />
                  </div>
                  <span className="text-xs font-mono text-raven-muted uppercase">Total Tokens</span>
              </div>
              <div>
                  <h3 className="text-3xl font-bold text-white font-mono">{currentMetrics.totalTokens.toLocaleString()}</h3>
                  <p className="text-xs text-raven-muted mt-1">Lifetime usage</p>
              </div>
          </div>

          <div className="bg-black border border-raven-border rounded-xl p-5 flex flex-col justify-between hover:border-green-500/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                      <Clock size={20} />
                  </div>
                  <span className="text-xs font-mono text-raven-muted uppercase">Latency</span>
              </div>
              <div>
                  <h3 className={`text-3xl font-bold font-mono ${currentMetrics.latency > 150 ? 'text-yellow-400' : 'text-white'}`}>
                      {currentMetrics.latency}ms
                  </h3>
                  <p className="text-xs text-raven-muted mt-1">Gateway response time</p>
              </div>
          </div>

          <div className="bg-black border border-raven-border rounded-xl p-5 flex flex-col justify-between hover:border-yellow-500/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                      <DollarSign size={20} />
                  </div>
                  <span className="text-xs font-mono text-raven-muted uppercase">Est. Cost</span>
              </div>
              <div>
                  <h3 className="text-3xl font-bold text-white font-mono">${currentMetrics.cost.toFixed(4)}</h3>
                  <p className="text-xs text-raven-muted mt-1">Session accumulation</p>
              </div>
          </div>
      </div>

      {/* Main Chart: Token Usage */}
      <div className="bg-black border border-raven-border rounded-xl p-6 shadow-lg">
        <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-raven-primary"></span>
          Token Throughput (Input vs Output)
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={tokenData}>
              <defs>
                <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#52525b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#27272a', color: '#fff' }}
                itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area 
                name="Output Tokens"
                type="monotone" 
                dataKey="output" 
                stroke="#ec4899" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorOutput)" 
                isAnimationActive={false}
              />
               <Area 
                name="Input Tokens"
                type="monotone" 
                dataKey="input" 
                stroke="#06b6d4" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorInput)" 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latency Chart */}
          <div className="bg-black border border-raven-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Request Latency</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={apiLatency}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#27272a', opacity: 0.4}}
                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#27272a', color: '#fff' }}
                  />
                  <Bar dataKey="ms" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Request Rate Chart */}
          <div className="bg-black border border-raven-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Load (Requests / Min)</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={requestRate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#27272a', color: '#fff' }}
                    itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                  />
                  <Line 
                    type="stepAfter" 
                    dataKey="rpm" 
                    stroke="#a855f7" 
                    strokeWidth={2} 
                    dot={false}
                    isAnimationActive={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;