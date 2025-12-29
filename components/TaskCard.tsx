import React from 'react';
import { SubTask } from '../types';

interface TaskCardProps {
  task: SubTask;
  isActive?: boolean;
  onClick?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, isActive, onClick }) => {
  const getStatusColor = (status: SubTask['status']) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'in-progress': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'reviewing': return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      case 'failed': return 'bg-red-500/10 border-red-500/30 text-red-400';
      default: return 'bg-slate-800/50 border-slate-700/50 text-slate-400';
    }
  };

  const getStatusIcon = (status: SubTask['status']) => {
    switch (status) {
      case 'completed': return '✓';
      case 'in-progress': return '⚡';
      case 'reviewing': return '🔍';
      case 'failed': return '✕';
      default: return '•';
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`
        group relative p-4 rounded-xl border cursor-pointer transition-all duration-200
        ${isActive 
          ? 'bg-slate-800 border-blue-500/50 shadow-lg ring-1 ring-blue-500/20' 
          : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
        }
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`
          inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
          ${getStatusColor(task.status)}
        `}>
          {getStatusIcon(task.status)}
        </span>
        {task.retryCount ? (
           <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
             Retry #{task.retryCount}
           </span>
        ) : null}
      </div>

      <h4 className={`font-medium text-sm mb-1 line-clamp-2 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
        {task.title}
      </h4>
      
      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
        {task.description}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px]">
            🤖
          </div>
          <span className="text-[10px] text-slate-400">
            {task.dynamicAgentName || task.assignedTo}
          </span>
        </div>
      </div>

      {/* Progress Bar for In-Progress Tasks */}
      {task.status === 'in-progress' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800 overflow-hidden rounded-b-xl">
          <div className="h-full bg-blue-500 animate-progress-indeterminate" />
        </div>
      )}
    </div>
  );
};
