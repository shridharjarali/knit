
import React, { useEffect, useRef, useState } from 'react';
import { SubTask, DynamicAgent, WorkflowState, Interaction } from '../types';
import { RegisteredAgent } from '../types/agentRegistry';
import { generateArtifact, downloadArtifact } from '../services/artifactPackager';

interface OrchestratorViewProps {
  tasks: SubTask[];
  activeAgents: DynamicAgent[];
  workflowState?: WorkflowState;
  knowledgeBase?: string;
  registeredAgents?: RegisteredAgent[];
  onReset?: () => void;
}

export const OrchestratorView: React.FC<OrchestratorViewProps> = ({ 
  tasks, 
  activeAgents, 
  workflowState, 
  knowledgeBase, 
  registeredAgents = [],
  onReset 
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const interactionScrollRef = useRef<HTMLDivElement>(null);

  const displayedTask = tasks.find(t => t.id === selectedTaskId);

  const handleDownload = () => {
    const artifact = generateArtifact(tasks);
    downloadArtifact(artifact, 'knit-generated-app.html');
  };

  useEffect(() => {
    if (interactionScrollRef.current) {
      interactionScrollRef.current.scrollTop = interactionScrollRef.current.scrollHeight;
    }
  }, [displayedTask?.interactions]);

  // Calculate progress
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Group tasks by dependency level
  const getTaskLevel = (task: SubTask, allTasks: SubTask[]): number => {
    if (task.dependencies.length === 0) return 0;
    const depLevels = task.dependencies.map(depId => {
      const dep = allTasks.find(t => t.id === depId);
      return dep ? getTaskLevel(dep, allTasks) : 0;
    });
    return Math.max(...depLevels) + 1;
  };

  const tasksByLevel = tasks.reduce((acc, task) => {
    const level = getTaskLevel(task, tasks);
    if (!acc[level]) acc[level] = [];
    acc[level].push(task);
    return acc;
  }, {} as Record<number, SubTask[]>);

  const maxLevel = Math.max(...Object.keys(tasksByLevel).map(Number), 0);

  return (
    <div className="h-full flex bg-slate-950 overflow-hidden font-sans text-slate-200">
      
      {/* LEFT PANEL: Knowledge Base & Context */}
      <div className="w-72 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              🧠
            </div>
            <h2 className="font-bold text-slate-200">Central Knowledge</h2>
          </div>
          <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Mission Context</div>
          <div className="h-32 bg-slate-950/50 rounded-lg p-3 border border-slate-800 overflow-y-auto custom-scrollbar">
             <p className="text-xs text-slate-400 whitespace-pre-wrap">
               {knowledgeBase || "No knowledge accumulated yet..."}
             </p>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">System Principles</h3>
           <div className="space-y-3">
              <div className="p-3 rounded bg-slate-800/50 border border-slate-700/50">
                 <div className="text-xs font-bold text-blue-400 mb-1">Parallel Execution</div>
                 <p className="text-[10px] text-slate-400">Independent tasks are identified and executed simultaneously by dynamic agents.</p>
              </div>
              <div className="p-3 rounded bg-slate-800/50 border border-slate-700/50">
                 <div className="text-xs font-bold text-purple-400 mb-1">Sentinel Critique</div>
                 <p className="text-[10px] text-slate-400">Every output is reviewed by a dedicated critique agent before acceptance.</p>
              </div>
              <div className="p-3 rounded bg-slate-800/50 border border-slate-700/50">
                 <div className="text-xs font-bold text-emerald-400 mb-1">Agent Reuse</div>
                 <p className="text-[10px] text-slate-400">Successful agents are stored in the registry and reused for similar future tasks.</p>
              </div>
           </div>
        </div>
        
        <div className="p-4 border-t border-slate-800">
           <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400">Progress</span>
              <span className="text-xs font-mono text-emerald-400">{Math.round(progressPercent)}%</span>
           </div>
           <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
           </div>
        </div>
      </div>

      {/* CENTER PANEL: Stage Board & Registry */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Header */}
        <div className="h-14 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between px-6">
           <h1 className="font-bold text-lg tracking-tight">Mission Control Board</h1>
           <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded text-xs font-mono border ${workflowState === 'EXECUTING' ? 'bg-green-500/20 border-green-500/50 text-green-400 animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                 STATUS: {workflowState}
              </span>
              {workflowState === 'FINISHED' && (
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded border border-emerald-500/50 transition-colors text-xs font-bold uppercase tracking-wider"
                >
                  <span>📦</span> Download Artifact
                </button>
              )}
              {onReset && (
                <button onClick={onReset} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-700 transition-colors">
                   Reset Mission
                </button>
              )}
           </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]">
           <div className="flex gap-8 h-full min-w-max">
              {Array.from({ length: maxLevel + 1 }).map((_, level) => (
                 <div key={level} className="w-80 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 px-2">
                       <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Stage {level + 1}</h3>
                       <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                          {tasksByLevel[level]?.length || 0}
                       </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar pb-10">
                       {tasksByLevel[level]?.map(task => {
                          const isActive = task.status === 'in-progress';
                          const isReviewing = task.status === 'reviewing';
                          const isCompleted = task.status === 'completed';
                          const isFailed = task.status === 'failed';
                          const activeAgent = activeAgents.find(a => a.role === task.description || a.name === task.dynamicAgentName); // Approximate match

                          return (
                             <div 
                                key={task.id}
                                onClick={() => setSelectedTaskId(task.id)}
                                className={`
                                   relative p-4 rounded-xl border transition-all cursor-pointer group
                                   ${selectedTaskId === task.id ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/20' : 'hover:border-slate-600'}
                                   ${isActive ? 'bg-slate-800/80 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 
                                     isReviewing ? 'bg-slate-800/80 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]' :
                                     isCompleted ? 'bg-slate-900/50 border-emerald-500/30 opacity-75' :
                                     isFailed ? 'bg-red-900/10 border-red-500/30' :
                                     'bg-slate-900 border-slate-800'}
                                `}
                             >
                                <div className="flex justify-between items-start mb-2">
                                   <span className="text-[10px] font-mono text-slate-500">#{task.id.split('-')[0]}</span>
                                   {isActive && <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
                                   {isReviewing && <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse" />}
                                   {isCompleted && <span className="text-emerald-500 text-xs">✓</span>}
                                </div>
                                
                                <h4 className="text-sm font-medium text-slate-200 mb-2 leading-snug">{task.title}</h4>
                                
                                {/* Active Agent Badge */}
                                {(isActive || isReviewing) && (
                                   <div className={`
                                      mt-3 flex items-center gap-2 p-2 rounded-lg border
                                      ${isReviewing ? 'bg-purple-500/10 border-purple-500/20' : 'bg-blue-500/10 border-blue-500/20'}
                                   `}>
                                      <div className="text-lg">{isReviewing ? '👁️' : '🤖'}</div>
                                      <div className="min-w-0">
                                         <div className={`text-[10px] font-bold uppercase ${isReviewing ? 'text-purple-400' : 'text-blue-400'}`}>
                                            {isReviewing ? 'Sentinel Review' : 'Agent Working'}
                                         </div>
                                         <div className="text-[10px] text-slate-400 truncate">
                                            {task.dynamicAgentName || task.assignedTo}
                                         </div>
                                      </div>
                                   </div>
                                )}

                                {/* Result Preview (if completed) */}
                                {isCompleted && (
                                   <div className="mt-2 text-[10px] text-slate-500 line-clamp-2 italic">
                                      {task.result || "Task completed successfully."}
                                   </div>
                                )}
                             </div>
                          );
                       })}
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* Bottom Panel: Agent Registry */}
        <div className="h-48 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col shrink-0">
           <div className="px-6 py-2 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                 <span>💾</span> Sentinel Agent Registry
              </h3>
              <span className="text-[10px] text-slate-500">{registeredAgents.length} Agents Available</span>
           </div>
           <div className="flex-1 overflow-x-auto p-4 flex gap-4 items-center">
              {registeredAgents.length === 0 ? (
                 <div className="text-sm text-slate-600 italic w-full text-center">Registry is empty. Agents will be saved here after successful missions.</div>
              ) : (
                 registeredAgents.map(agent => (
                    <div key={agent.id} className="min-w-[220px] h-full bg-slate-800 rounded-xl border border-slate-700 p-3 flex flex-col relative group hover:border-emerald-500/50 transition-colors">
                       <div className="flex justify-between items-start mb-2">
                          <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center text-lg">🤖</div>
                          <div className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                             {(agent.successRate * 100).toFixed(0)}% SR
                          </div>
                       </div>
                       <div className="font-bold text-sm text-slate-200 truncate" title={agent.name}>{agent.name}</div>
                       <div className="text-[10px] text-slate-500 mb-2 truncate">{agent.capabilities[0]}</div>
                       <div className="mt-auto flex gap-1 flex-wrap">
                          {agent.capabilities.slice(0, 2).map(cap => (
                             <span key={cap} className="text-[9px] px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">{cap}</span>
                          ))}
                       </div>
                    </div>
                 ))
              )}
           </div>
        </div>
      </div>

      {/* RIGHT DRAWER: Task Details / Terminal */}
      {displayedTask && (
         <div className="w-[450px] border-l border-slate-800 bg-slate-950 flex flex-col shadow-2xl z-20">
            <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/50">
               <div className="font-bold text-sm text-slate-200">Agent Workspace</div>
               <button onClick={() => setSelectedTaskId(null)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            
            <div className="p-4 border-b border-slate-800 bg-slate-900/20">
               <h2 className="font-bold text-lg text-white mb-1">{displayedTask.title}</h2>
               <p className="text-xs text-slate-400 leading-relaxed">{displayedTask.description}</p>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col bg-[#0d1117]">
               <div className="h-8 bg-slate-800/50 flex items-center px-3 gap-2 border-b border-slate-800">
                  <div className="flex gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                     <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 ml-2">execution_logs.log</span>
               </div>
               
               <div ref={interactionScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
                  {displayedTask.interactions?.map((interaction, idx) => (
                     <div key={idx} className={`flex flex-col ${interaction.role === 'critique' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[90%] rounded-lg p-3 border ${
                           interaction.role === 'critique' 
                           ? 'bg-purple-900/10 border-purple-500/20 text-purple-200' 
                           : 'bg-slate-800/50 border-slate-700 text-slate-300'
                        }`}>
                           <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase font-bold">
                              <span>{interaction.role === 'critique' ? '🔍 Sentinel' : '⚡ Agent'}</span>
                              <span>{new Date(interaction.timestamp).toLocaleTimeString()}</span>
                           </div>
                           <div className="whitespace-pre-wrap">{interaction.content}</div>
                        </div>
                     </div>
                  ))}
                  {displayedTask.status === 'in-progress' && (
                     <div className="flex items-center gap-2 text-blue-400 animate-pulse p-2">
                        <span className="text-lg">⚡</span>
                        <span>Agent is executing task...</span>
                     </div>
                  )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
