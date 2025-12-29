import React from 'react';
import { DynamicAgent, AgentType } from '../types';

interface AgentCardProps {
  agent: DynamicAgent;
  isActive?: boolean;
}

const getAgentIcon = (role: string) => {
  if (role.toLowerCase().includes('coder')) return '👨‍💻';
  if (role.toLowerCase().includes('architect')) return '🏗️';
  if (role.toLowerCase().includes('tester')) return '🧪';
  if (role.toLowerCase().includes('manager')) return '👔';
  return '🤖';
};

export const AgentCard: React.FC<AgentCardProps> = ({ agent, isActive }) => {
  return (
    <div className={`
      relative p-4 rounded-xl border transition-all duration-300
      ${isActive 
        ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)] scale-105' 
        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
      }
    `}>
      {isActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
      )}
      
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center text-xl
          ${isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700/50 text-slate-400'}
        `}>
          {getAgentIcon(agent.role)}
        </div>
        
        <div>
          <h3 className={`font-medium text-sm ${isActive ? 'text-white' : 'text-slate-300'}`}>
            {agent.name}
          </h3>
          <p className="text-xs text-slate-500 truncate max-w-[120px]">
            {agent.role}
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mt-3 flex items-center gap-2">
        <span className={`
          text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold
          ${agent.status === 'active' ? 'bg-green-500/10 text-green-400' : 
            agent.status === 'waiting' ? 'bg-amber-500/10 text-amber-400' :
            'bg-slate-700/50 text-slate-500'}
        `}>
          {agent.status}
        </span>
        {agent.currentPhase && (
          <span className="text-[10px] text-slate-500 border-l border-slate-700 pl-2">
            {agent.currentPhase}
          </span>
        )}
      </div>
    </div>
  );
};
