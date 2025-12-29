
import React, { useEffect, useRef } from 'react';
import { SubTask, DynamicAgent, WorkflowState } from '../types';

interface OrchestratorViewProps {
  tasks: SubTask[];
  activeAgents: DynamicAgent[];
  workflowState?: WorkflowState;
  knowledgeBase?: string;
  onReset?: () => void;
}

// Phase configuration with colors and icons
const PHASE_CONFIG = {
  planning: {
    icon: '📝',
    label: 'Planning',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    pulseColor: 'bg-amber-500'
  },
  executing: {
    icon: '⚡',
    label: 'Executing',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    pulseColor: 'bg-blue-500'
  },
  reviewing: {
    icon: '🔍',
    label: 'Reviewing',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    pulseColor: 'bg-purple-500'
  }
};

export const OrchestratorView: React.FC<OrchestratorViewProps> = ({ tasks, activeAgents, workflowState, knowledgeBase, onReset }) => {
  const interactionScrollRef = useRef<HTMLDivElement>(null);

  // Find the active task (in progress or reviewing)
  const activeTask = tasks.find(t => t.status === 'in-progress' || t.status === 'reviewing');
  const activeAgent = activeAgents.find(a => a.status === 'active');
  const currentPhase = activeAgent?.currentPhase || 'planning';
  const phaseConfig = PHASE_CONFIG[currentPhase];

  useEffect(() => {
    if (interactionScrollRef.current) {
      interactionScrollRef.current.scrollTop = interactionScrollRef.current.scrollHeight;
    }
  }, [activeTask?.interactions]);

  const getDependencyNames = (depIds: string[]) => {
    return tasks
      .filter(t => depIds.includes(t.id))
      .map(t => t.title);
  };

  // Calculate progress
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Header with Progress */}
      <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              Orchestrator Dashboard
            </h1>
            <p className="text-slate-400 text-sm">Managing task distribution, dependencies, and agent lifecycle.</p>
          </div>

          {/* Overall Progress */}
          <div className="text-right">
            <div className="text-sm text-slate-400 mb-1">Overall Progress</div>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-emerald-400 font-bold">{completedCount}/{totalCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Task Queue */}
        <div className="w-5/12 p-6 border-r border-slate-800 overflow-y-auto bg-slate-950">
          <h2 className="text-lg font-semibold text-cyan-400 mb-6 flex items-center gap-2 sticky top-0 bg-slate-950 pb-2 z-10">
            <span className="text-xl">📋</span> Task Queue
          </h2>
          <div className="space-y-4 relative">
            {/* Connection line */}
            <div className="absolute left-6 top-4 bottom-0 w-0.5 bg-gradient-to-b from-slate-700 via-slate-800 to-transparent -z-0" />

            {tasks.map((task, index) => {
              const deps = getDependencyNames(task.dependencies);
              const isActive = task.status === 'in-progress';

              return (
                <div
                  key={task.id}
                  className={`relative z-10 p-4 rounded-xl border transition-all duration-500 ml-2 ${task.status === 'completed'
                    ? 'bg-slate-900/30 border-emerald-900/50 opacity-70'
                    : isActive
                      ? `${phaseConfig.bgColor} ${phaseConfig.borderColor} shadow-lg shadow-${currentPhase === 'executing' ? 'blue' : currentPhase === 'planning' ? 'amber' : 'purple'}-500/10 scale-[1.02]`
                      : task.status === 'failed'
                        ? 'bg-red-900/10 border-red-500/50'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {/* Status Indicator */}
                      <div className="relative">
                        <div className={`w-3 h-3 rounded-full ${task.status === 'completed' ? 'bg-emerald-500' :
                          isActive ? `${phaseConfig.pulseColor} animate-pulse` :
                            task.status === 'failed' ? 'bg-red-500' : 'bg-slate-600'
                          }`} />
                        {isActive && (
                          <div className={`absolute inset-0 w-3 h-3 rounded-full ${phaseConfig.pulseColor} animate-ping opacity-75`} />
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-200 text-sm">{task.title}</h3>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isActive ? (
                        <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider ${phaseConfig.bgColor} ${phaseConfig.color} flex items-center gap-1`}>
                          <span>{phaseConfig.icon}</span>
                          {phaseConfig.label}
                        </span>
                      ) : (
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                          task.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-800 text-slate-500'
                          }`}>
                          {task.status === 'completed' ? '✓ Done' : task.status}
                        </span>
                      )}
                      {task.retryCount && task.retryCount > 0 ? (
                        <span className="text-[9px] text-orange-400 flex items-center gap-1">
                          <span>🔄</span> Retry #{task.retryCount}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-3 pl-4 border-l-2 border-slate-700/50 line-clamp-2">{task.description}</p>

                  {deps.length > 0 && (
                    <div className="mb-3 ml-4">
                      <div className="text-[10px] text-amber-500 font-bold mb-1 flex items-center gap-1">
                        <span>⏳</span> WAITING FOR:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {deps.map((d, i) => (
                          <span key={i} className="text-[10px] bg-amber-900/20 text-amber-300 border border-amber-900/50 px-1.5 py-0.5 rounded">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-[10px] ml-4">
                    <span className="text-purple-300 bg-purple-900/20 px-2 py-0.5 rounded border border-purple-500/20">
                      {task.assignedTo}
                    </span>
                    {task.dynamicAgentName && (
                      <span className="text-pink-300 bg-pink-900/20 px-2 py-0.5 rounded border border-pink-500/20 flex items-center gap-1">
                        <span>🤖</span> {task.dynamicAgentName}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {tasks.length === 0 && (
              <div className="text-center p-8 border border-dashed border-slate-800 rounded-lg text-slate-600">
                <span className="text-4xl block mb-2">🔄</span>
                Awaiting Orchestration...
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Agent Workspace */}
        <div className="w-7/12 flex flex-col bg-gradient-to-br from-slate-900 to-slate-950">
          {/* Agent Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm shadow-lg z-10">
            <h2 className="text-lg font-semibold text-pink-400 flex items-center gap-2">
              <span className="text-xl">🔬</span> Live Agent Workspace
            </h2>
          </div>

          <div className="flex-1 p-6 overflow-y-auto" ref={interactionScrollRef}>
            {activeTask && activeAgent ? (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Agent Card */}
                <div className={`relative overflow-hidden rounded-2xl border-2 ${phaseConfig.borderColor} ${phaseConfig.bgColor} p-6 shadow-2xl`}>
                  {/* Background Effect */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-white to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                  </div>

                  <div className="relative z-10">
                    {/* Agent Status Bar */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {/* Animated Status Indicator */}
                        <div className="relative">
                          <div className={`w-5 h-5 rounded-full ${phaseConfig.pulseColor}`}>
                            <div className={`absolute inset-0 w-5 h-5 rounded-full ${phaseConfig.pulseColor} animate-ping opacity-75`} />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-xl tracking-tight flex items-center gap-2">
                            {activeAgent.name}
                            {activeAgent.isReused && (
                              <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                                ♻️ Reused
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-slate-400 font-mono mt-1">
                            ID: <span className="text-slate-300">{activeAgent.id}</span> •
                            PARENT: <span className="text-slate-300">{activeAgent.parentType}</span>
                            {activeAgent.reuseScore && (
                              <> • MATCH: <span className="text-emerald-400">{Math.round(activeAgent.reuseScore * 100)}%</span></>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Current Phase Badge */}
                      <div className={`${phaseConfig.bgColor} ${phaseConfig.color} px-4 py-2 rounded-full border ${phaseConfig.borderColor} flex items-center gap-2 font-semibold`}>
                        <span className="text-lg">{phaseConfig.icon}</span>
                        <span>{phaseConfig.label}</span>
                      </div>
                    </div>

                    {/* Current Task */}
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <p className="text-sm text-slate-300">
                        <span className="text-slate-500">Working on:</span>{' '}
                        <span className="text-white font-medium">{activeTask.title}</span>
                      </p>
                    </div>

                    {/* Phase Progress */}
                    <div className="mt-4 flex items-center gap-2">
                      {['planning', 'executing', 'reviewing'].map((phase, idx) => (
                        <React.Fragment key={phase}>
                          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${currentPhase === phase
                            ? `${PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG].bgColor} ${PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG].color} border ${PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG].borderColor}`
                            : idx < ['planning', 'executing', 'reviewing'].indexOf(currentPhase)
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800/50 text-slate-500 border border-slate-700/50'
                            }`}>
                            <span>{PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG].icon}</span>
                            <span className="hidden sm:inline">{PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG].label}</span>
                          </div>
                          {idx < 2 && (
                            <div className={`w-8 h-0.5 ${idx < ['planning', 'executing', 'reviewing'].indexOf(currentPhase)
                              ? 'bg-emerald-500'
                              : 'bg-slate-700'
                              }`} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Conversation History */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent flex-1" />
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <span>💬</span> Interaction Log
                    </span>
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent flex-1" />
                  </div>

                  {activeTask.interactions?.map((interaction, idx) => (
                    <div
                      key={idx}
                      className={`flex ${interaction.role === 'critique' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className={`flex flex-col max-w-[85%] ${interaction.role === 'critique' ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-slate-500 mb-1 px-1 flex items-center gap-1">
                          {interaction.role === 'critique' ? (
                            <><span>🛡️</span> CRITIQUE AGENT (SENTINEL)</>
                          ) : (
                            <><span>🤖</span> {activeAgent.name.toUpperCase()}</>
                          )}
                        </span>
                        <div className={`rounded-2xl p-4 text-sm shadow-lg border leading-relaxed whitespace-pre-wrap ${interaction.role === 'critique'
                          ? 'bg-gradient-to-br from-red-500/10 to-red-900/10 border-red-500/20 text-red-100 rounded-tr-sm'
                          : 'bg-gradient-to-br from-indigo-500/10 to-indigo-900/10 border-indigo-500/20 text-indigo-100 rounded-tl-sm'
                          }`}>
                          {interaction.content}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Active Thinking Indicator */}
                  {activeTask.status === 'in-progress' && (
                    <div className="flex justify-start">
                      <div className={`${phaseConfig.bgColor} rounded-full px-5 py-3 flex items-center gap-3 border ${phaseConfig.borderColor} shadow-lg`}>
                        <div className="flex gap-1">
                          <div className={`w-2 h-2 ${phaseConfig.pulseColor} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
                          <div className={`w-2 h-2 ${phaseConfig.pulseColor} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
                          <div className={`w-2 h-2 ${phaseConfig.pulseColor} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className={`text-sm ${phaseConfig.color} font-medium`}>
                          {currentPhase === 'planning' && 'Agent is crafting a plan...'}
                          {currentPhase === 'executing' && 'Agent is executing...'}
                          {currentPhase === 'reviewing' && 'Critique agent is reviewing...'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : workflowState === WorkflowState.FINISHED ? (
              /* Final Output Panel */
              <div className="h-full flex items-center justify-center">
                <div className="max-w-2xl w-full mx-auto p-8">
                  <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-950/30 border-2 border-emerald-500/30 rounded-3xl p-8 shadow-2xl">
                    {/* Success Header */}
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-full mb-4">
                        <span className="text-5xl">✅</span>
                      </div>
                      <h2 className="text-3xl font-bold text-emerald-400 mb-2">All Tasks Completed!</h2>
                      <p className="text-slate-400">Workflow executed successfully</p>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700">
                        <div className="text-2xl font-bold text-white">{tasks.filter(t => t.status === 'completed').length}</div>
                        <div className="text-xs text-emerald-400">Completed</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700">
                        <div className="text-2xl font-bold text-white">{tasks.filter(t => t.status === 'failed').length}</div>
                        <div className="text-xs text-red-400">Failed</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700">
                        <div className="text-2xl font-bold text-white">{tasks.length}</div>
                        <div className="text-xs text-slate-400">Total Tasks</div>
                      </div>
                    </div>

                    {/* Knowledge Base Output */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <span>📚</span> Generated Knowledge Base
                      </h3>
                      <div className="bg-slate-900/80 rounded-xl p-4 max-h-64 overflow-y-auto border border-slate-700">
                        <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                          {knowledgeBase || 'No knowledge generated'}
                        </pre>
                      </div>
                    </div>

                    {/* Task Results */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <span>📋</span> Task Results
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {tasks.filter(t => t.result).map((task, idx) => (
                          <div key={task.id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-emerald-400">✓</span>
                              <span className="font-medium text-white text-sm">{task.title}</span>
                            </div>
                            <p className="text-xs text-slate-400 pl-5 line-clamp-2">{task.result}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Start New Task Button */}
                    {onReset && (
                      <div className="mt-8 text-center">
                        <button
                          onClick={onReset}
                          className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
                        >
                          <span>🚀</span> Start New Task
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center flex-col gap-6 opacity-60">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-slate-800 border-t-cyan-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
                </div>
                <div className="text-center">
                  <p className="font-mono text-sm tracking-widest text-slate-500 mb-2">AWAITING ASSIGNMENT</p>
                  <p className="text-xs text-slate-600">Dynamic agents will appear here when tasks begin execution</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
