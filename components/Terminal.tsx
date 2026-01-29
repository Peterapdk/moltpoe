import React, { useEffect, useState, useRef } from 'react';

const Terminal: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate incoming logs
    const interval = setInterval(() => {
      const services = ['gateway', 'auth', 'agent-core', 'gemini-adapter', 'db-shard'];
      const levels = ['INFO', 'INFO', 'INFO', 'DEBUG', 'WARN'];
      const messages = [
        'Heartbeat acknowledged',
        'Processing vector embedding for session 0x4A',
        'Token bucket replenished',
        'Connection kept alive (60s)',
        'Garbage collection started'
      ];

      const randomService = services[Math.floor(Math.random() * services.length)];
      const randomLevel = levels[Math.floor(Math.random() * levels.length)];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const timestamp = new Date().toISOString();

      const logLine = `[${timestamp}] [${randomLevel}] [${randomService}] ${randomMsg}`;
      
      setLogs(prev => [...prev.slice(-100), logLine]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-raven-bg p-4">
      <div className="flex items-center gap-2 mb-2 px-2">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span className="ml-2 text-xs text-raven-muted font-mono">moltbot@localhost:~</span>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 bg-black border border-raven-border rounded-lg p-4 font-mono text-xs overflow-y-auto shadow-inner shadow-black/50"
      >
        {logs.map((log, index) => {
            const isWarn = log.includes('[WARN]');
            const isError = log.includes('[ERROR]');
            return (
                <div key={index} className={`mb-1 whitespace-pre-wrap break-all ${
                    isWarn ? 'text-yellow-400' : isError ? 'text-red-400' : 'text-green-500/80'
                }`}>
                    <span className="opacity-50 mr-2">$</span>
                    {log}
                </div>
            )
        })}
        <div className="flex items-center text-green-500 animate-pulse">
            <span className="mr-2">_</span>
        </div>
      </div>
    </div>
  );
};

export default Terminal;