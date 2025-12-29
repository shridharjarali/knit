import React, { useEffect, useRef } from 'react';
import { LogEntry, AgentType } from '../types';

interface LogsPanelProps {
  logs: LogEntry[];
}

const getAgentColor = (type: AgentType) => {
  switch (type) {
    case AgentType.COLLECTOR: return 'text-blue-400';
    case AgentType.CONTEXTUALIZER: return 'text-purple-400';
    case AgentType.SYNTHESIZER: return 'text-green-400';
    case AgentType.REFLECTOR: return 'text-yellow-400';
    case AgentType.CRITIQUE: return 'text-red-400';
    case AgentType.ORCHESTRATOR: return 'text-cyan-400';
    case AgentType.DYNAMIC: return 'text-pink-400';
    default: return 'text-gray-400';
  }
};

export const LogsPanel: React.FC<LogsPanelProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-700">
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">System Memory & Critique Log</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        {logs.map((log) => (
          <div key={log.id} className={`p-2 rounded border border-opacity-20 ${log.type === 'critique' ? 'bg-red-900/10 border-red-500/30' : 'bg-slate-800 border-slate-600'}`}>
            <div className="flex justify-between items-center mb-1">
              <span className={`font-bold ${getAgentColor(log.agentType)}`}>
                [{log.agentType}] {log.agentName}
              </span>
              <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="text-slate-300 whitespace-pre-wrap">{log.message}</div>
            {log.details && (
              <div className="mt-2 text-slate-500 pl-2 border-l-2 border-slate-700 italic">
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