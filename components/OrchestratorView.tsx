
import React, { useEffect, useRef, useState } from 'react';
import { SubTask, DynamicAgent, WorkflowState, Interaction } from '../types';
import { AgentCard } from './AgentCard';
import { TaskCard } from './TaskCard';

interface OrchestratorViewProps {
  tasks: SubTask[];
  activeAgents: DynamicAgent[];
  workflowState?: WorkflowState;
  knowledgeBase?: string;
  onReset?: () => void;
}

export const OrchestratorView: React.FC<OrchestratorViewProps> = ({ 
  tasks, 
  activeAgents, 
  workflowState, 
  knowledgeBase, 
  onReset 
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const interactionScrollRef = useRef<HTMLDivElement>(null);

  // Auto-select the active task if none selected
  const activeTask = tasks.find(t => t.status === 'in-progress' || t.status === 'reviewing');
  
  useEffect(() => {
    if (activeTask && !selectedTaskId) {
      setSelectedTaskId(activeTask.id);
    }
  }, [activeTask, selectedTaskId]);

  // If user manually selects a task, show that. Otherwise show active.
  const displayedTask = tasks.find(t => t.id === selectedTaskId) || activeTask || tasks[0];
  
  const activeAgent = activeAgents.find(a => a.status === 'active');

  useEffect(() => {
    if (interactionScrollRef.current) {
      interactionScrollRef.current.scrollTop = interactionScrollRef.current.scrollHeight;
    }
  }, [displayedTask?.interactions]);

  // Calculate progress
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden font-sans">
      {/* Top Bar: Global Status */}
      <div className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-xl">🧠</span>
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight">Orchestrator</h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className={`w-2 h-2 rounded-full ${workflowState === 'EXECUTING' ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
              {workflowState || 'IDLE'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400 mb-1">Mission Progress</span>
            <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          {onReset && (
            <button 
              onClick={onReset}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors border border-slate-700"
            >
              New Mission
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Task Pipeline */}
        <div className="w-80 border-r border-slate-800 bg-slate-900/30 flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Task Pipeline</h2>
            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)] pr-2 custom-scrollbar">
              {tasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  isActive={displayedTask?.id === task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                />
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-10 text-slate-600 text-sm italic">
                  No tasks generated yet...
                </div>
              )}
            </div>
          </div>
          
          {/* Active Agents List (Mini) */}
          <div className="flex-1 p-4 overflow-y-auto">
             <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Active Agents</h2>
             <div className="space-y-2">
               {activeAgents.map(agent => (
                 <AgentCard key={agent.id} agent={agent} isActive={agent.status === 'active'} />
               ))}
               {activeAgents.length === 0 && (
                 <div className="text-center py-4 text-slate-600 text-xs">
                   No agents active
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* Main Area: Workspace */}
        <div className="flex-1 flex flex-col bg-slate-950 relative">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          {displayedTask ? (
            <>
              {/* Task Header */}
              <div className="relative z-10 p-6 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                        ID: {displayedTask.id.split('-')[0]}
                      </span>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                        ${displayedTask.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' : 
                          displayedTask.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 
                          'bg-slate-800 text-slate-400'}
                      `}>
                        {displayedTask.status}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{displayedTask.title}</h2>
                    <p className="text-slate-400 max-w-3xl">{displayedTask.description}</p>
                  </div>
                  
                  {/* Assigned Agent Badge */}
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-500 mb-1">Assigned To</span>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
                      <span className="text-lg">🤖</span>
                      <span className="text-sm font-medium text-slate-300">
                        {displayedTask.dynamicAgentName || displayedTask.assignedTo}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workspace / Terminal View */}
              <div className="flex-1 relative z-10 p-6 overflow-hidden flex flex-col">
                <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
                  {/* Terminal Header */}
                  <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                    </div>
                    <div className="ml-4 text-xs font-mono text-slate-500 flex-1 text-center">
                      agent_workspace.log
                    </div>
                  </div>

                  {/* Terminal Content */}
                  <div 
                    ref={interactionScrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-sm"
                  >
                    {displayedTask.interactions?.map((interaction, idx) => (
                      <div key={idx} className={`flex gap-4 ${interaction.role === 'critique' ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-lg
                          ${interaction.role === 'critique' ? 'bg-purple-500/20' : 'bg-blue-500/20'}
                        `}>
                          {interaction.role === 'critique' ? '🔍' : '⚡'}
                        </div>

                        {/* Message Bubble */}
                        <div className={`flex-1 max-w-[80%] rounded-xl p-4 border
                          ${interaction.role === 'critique' 
                            ? 'bg-purple-900/10 border-purple-500/20 text-purple-200' 
                            : 'bg-slate-800/50 border-slate-700 text-slate-300'}
                        `}>
                          <div className="flex items-center justify-between mb-2 opacity-50 text-xs">
                            <span className="font-bold uppercase">
                              {interaction.role === 'critique' ? 'Quality Assurance' : 'Agent Output'}
                            </span>
                            <span>{new Date(interaction.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {interaction.content}
                          </div>
                        </div>
                      </div>
                    ))}

                    {displayedTask.status === 'in-progress' && (
                      <div className="flex gap-4 animate-pulse opacity-50">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">⚡</div>
                        <div className="flex items-center gap-2 text-blue-400">
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100" />
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200" />
                          <span className="text-xs ml-2">Agent is working...</span>
                        </div>
                      </div>
                    )}
                    
                    {displayedTask.interactions?.length === 0 && displayedTask.status !== 'in-progress' && (
                       <div className="text-center text-slate-600 italic py-10">
                         Waiting for execution to start...
                       </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-600 flex-col gap-4">
              <div className="text-6xl opacity-20">🎯</div>
              <p>Select a task to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
