import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Cpu, WifiOff, Wifi } from 'lucide-react';
import { Message, GatewayStatus } from '../types';
import { createChatSession, sendMessageStream } from '../services/geminiService';
import { moltbotSocket } from '../services/moltbotSocket';
import { Chat, GenerateContentResponse } from "@google/genai";

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'TheRaven initialized. Ready for input.',
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState<GatewayStatus>(GatewayStatus.DISCONNECTED);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Ref to hold the active Gemini chat session
  const geminiSessionRef = useRef<Chat | null>(null);

  useEffect(() => {
    // Initialize Gemini chat session as fallback
    geminiSessionRef.current = createChatSession();

    // Subscribe to Socket Status
    const unsubStatus = moltbotSocket.onStatusChange((newStatus) => {
        setStatus(newStatus);
        if (newStatus === GatewayStatus.CONNECTED) {
             setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'system',
                content: 'Secure connection established with local Moltbot gateway.',
                timestamp: Date.now()
             }]);
        }
    });

    // Subscribe to Socket Messages
    const unsubMessages = moltbotSocket.onMessage((data) => {
        // Assume data structure like { role: 'model', content: '...' } or simple string
        const content = data.content || data.message || (typeof data === 'string' ? data : JSON.stringify(data));
        
        // Check if we are currently "typing" a bot message, if so, append to it, otherwise create new
        // For simplicity in this demo, we just push new messages or you could implement streaming logic here
        
        setIsTyping(false);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            content: content,
            timestamp: Date.now()
        }]);
    });

    return () => {
        unsubStatus();
        unsubMessages();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Primary Strategy: Use WebSocket if connected
    if (status === GatewayStatus.CONNECTED) {
        try {
            moltbotSocket.sendMessage({ 
                type: 'chat', 
                message: userMsg.content,
                timestamp: Date.now()
            });
            // We wait for onMessage to handle the response
        } catch (err) {
            console.error("Socket send error", err);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'system',
                content: 'Error sending to Moltbot gateway.',
                timestamp: Date.now()
            }]);
            setIsTyping(false);
        }
        return;
    }

    // Fallback Strategy: Gemini Direct
    if (!geminiSessionRef.current) return;

    try {
      const streamResult = await sendMessageStream(geminiSessionRef.current, userMsg.content);
      
      const botMsgId = (Date.now() + 1).toString();
      // Initialize empty bot message
      setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'model',
        content: '',
        timestamp: Date.now()
      }]);

      let accumulatedText = '';

      for await (const chunk of streamResult) {
        const c = chunk as GenerateContentResponse;
        const text = c.text || '';
        accumulatedText += text;
        
        setMessages(prev => prev.map(msg => 
          msg.id === botMsgId 
            ? { ...msg, content: accumulatedText }
            : msg
        ));
      }
      
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: 'Error: Connection to fallback Gemini service lost.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-raven-bg relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-raven-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="p-4 border-b border-raven-border flex justify-between items-center bg-raven-bg/80 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-raven-border/50 border border-raven-border">
            <Cpu size={16} className="text-raven-secondary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Moltbot Prime</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-raven-muted">Target: {status === GatewayStatus.CONNECTED ? 'Local Gateway' : 'Cloud Fallback'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${status === GatewayStatus.CONNECTED ? 'bg-green-500' : 'bg-yellow-500'}`} />
            </div>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-raven-surface border border-raven-border flex items-center gap-2">
            {status === GatewayStatus.CONNECTED ? (
                <Wifi size={14} className="text-green-500" />
            ) : (
                <WifiOff size={14} className="text-raven-muted" />
            )}
            <span className="text-[10px] uppercase font-mono text-raven-muted">
                {status === GatewayStatus.CONNECTED ? 'WS Active' : 'WS Offline'}
            </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 z-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-raven-border' : msg.role === 'system' ? 'bg-red-900/20' : 'bg-raven-primary/20'
            }`}>
              {msg.role === 'user' ? (
                <User size={14} className="text-raven-text" />
              ) : (
                <Bot size={14} className={msg.role === 'system' ? 'text-red-400' : 'text-raven-primary'} />
              )}
            </div>
            
            <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-lg border text-sm font-mono leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-raven-surface border-raven-border text-raven-text'
                  : msg.role === 'system'
                  ? 'bg-red-950/10 border-red-900/50 text-red-400'
                  : 'bg-black/40 border-raven-border/50 text-raven-text shadow-[0_0_15px_-5px_rgba(236,72,153,0.1)]'
              }`}>
                {msg.content}
              </div>
              <span className="text-[10px] text-raven-muted mt-1 opacity-60">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-raven-primary/20">
                <Bot size={14} className="text-raven-primary" />
             </div>
             <div className="px-4 py-3 rounded-lg border border-raven-border/50 bg-black/40 text-sm font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-raven-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-raven-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-raven-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-raven-surface border-t border-raven-border z-10">
        <form 
          onSubmit={handleSend}
          className="relative group"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Send command or message..."
            className="w-full bg-black border border-raven-border rounded-md py-3 pl-4 pr-12 text-sm text-raven-text focus:outline-none focus:border-raven-secondary focus:ring-1 focus:ring-raven-secondary/50 transition-all font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-raven-border text-raven-muted hover:text-white transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;