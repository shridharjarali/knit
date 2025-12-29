import React, { useEffect, useRef } from 'react';
import { LogEntry, AgentType } from '../types';

interface LogsPanelProps {
  logs: LogEntry[];
}

const getAgentColor = (type: AgentType) => {
  switch (type) {
    case AgentType.COLLECTOR: return 'text-blue-400';
    case AgentType.CONTEXTUALIZER: return 'text-purple-400';
    case AgentType.SYNTHESIZER: return 'text-emerald-400';
    case AgentType.REFLECTOR: return 'text-amber-400';
    case AgentType.CRITIQUE: return 'text-red-400';
    case AgentType.ORCHESTRATOR: return 'text-cyan-400';
    case AgentType.DYNAMIC: return 'text-pink-400';
    default: return 'text-slate-400';
  }
};

export const LogsPanel: React.FC<LogsPanelProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] border-r border-slate-800 font-mono text-xs">
      <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <h2 className="font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          System Events
        </h2>
        <span className="text-[10px] text-slate-600">{logs.length} events</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {logs.map((log) => (
          <div 
            key={log.id} 
            className={`
              group p-2 rounded border-l-2 transition-all duration-200 hover:bg-slate-900/50
              ${log.type === 'error' ? 'border-red-500 bg-red-900/10' : 
                log.type === 'warning' ? 'border-amber-500 bg-amber-900/10' : 
                log.type === 'success' ? 'border-emerald-500 bg-emerald-900/10' : 
                log.type === 'critique' ? 'border-purple-500 bg-purple-900/10' :
                'border-slate-700 hover:border-slate-600'}
            `}
          >
            <div className="flex items-center gap-2 mb-1 opacity-70">
              <span className="text-[10px] text-slate-500">
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={`font-bold ${getAgentColor(log.agentType)}`}>
                {log.agentType}
              </span>
            </div>
            
            <div className="text-slate-300 break-words leading-relaxed">
              {log.message}
            </div>
            
            {log.details && (
              <div className="mt-1 pt-1 border-t border-slate-800/50 text-slate-500 italic text-[10px]">
                {log.details}
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};