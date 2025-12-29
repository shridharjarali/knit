
import React, { useState, useCallback, useEffect } from 'react';
import { LogsPanel } from './components/LogsPanel';
import { ChatInterface } from './components/ChatInterface';
import { OrchestratorView } from './components/OrchestratorView';
import {
  reflectorChat,
  orchestratePlan,
  executeTaskStep,
  critiquePlan,
  critiqueResult,
  generateAgentPlan
} from './services/geminiService';
import {
  registerAgent,
  findMatchingAgent,
  updateAgentMetrics,
  getAllAgents
} from './services/agentRegistryService';
import { RegisteredAgent } from './types/agentRegistry';
import {
  AgentType,
  LogEntry,
  WorkflowState,
  RequirementsDoc,
  SubTask,
  DynamicAgent,
  ChatMessage,
  Interaction
} from './types';

function App() {
  // --- State ---
  const [workflowState, setWorkflowState] = useState<WorkflowState>(WorkflowState.REFLECTING);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello. I am the Reflector Agent. Please describe the task or software you wish to build.' }
  ]);
  const [requirements, setRequirements] = useState<RequirementsDoc | null>(null);
  const [tasks, setTasks] = useState<SubTask[]>([]);
  const [activeAgents, setActiveAgents] = useState<DynamicAgent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<string>("");
  const [registeredAgents, setRegisteredAgents] = useState<RegisteredAgent[]>(getAllAgents());

  // Reset handler for starting new task
  const handleReset = useCallback(() => {
    setWorkflowState(WorkflowState.REFLECTING);
    setLogs([]);
    setMessages([{ role: 'assistant', content: 'Hello. I am the Reflector Agent. Please describe the task or software you wish to build.' }]);
    setRequirements(null);
    setTasks([]);
    setActiveAgents([]);
    setIsProcessing(false);
    // Keep knowledgeBase to persist learnings across sessions
    setRegisteredAgents(getAllAgents());
  }, []);

  // --- Helpers ---
  const addLog = useCallback((agentType: AgentType, agentName: string, message: string, type: LogEntry['type'], details?: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      agentType,
      agentName,
      message,
      type,
      details
    }]);
  }, []);

  const addInteraction = (taskId: string, role: 'agent' | 'critique', content: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          interactions: [...(t.interactions || []), { role, content, timestamp: Date.now() }]
        };
      }
      return t;
    }));
  };

  // --- Workflow Steps ---

  // 1. Reflector Loop
  const handleReflectorMessage = async (userMsg: string) => {
    setIsProcessing(true);
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    addLog(AgentType.REFLECTOR, 'Requirements Engineer', `Processing user input: "${userMsg.substring(0, 30)}..."`, 'info');

    try {
      const response = await reflectorChat(newMessages, requirements);

      setRequirements(response.requirements);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.responseToUser,
        options: response.options
      }]);

      if (response.requirements.isComplete) {
        addLog(AgentType.REFLECTOR, 'Requirements Engineer', 'Requirements finalized. Handing over to Orchestrator.', 'success');
        setWorkflowState(WorkflowState.ORCHESTRATING);
      } else {
        addLog(AgentType.REFLECTOR, 'Requirements Engineer', 'Updated requirements draft. Continuing interview.', 'info');
      }
    } catch (e) {
      addLog(AgentType.REFLECTOR, 'Requirements Engineer', 'Error connecting to Gemini.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Orchestration Loop
  useEffect(() => {
    if (workflowState === WorkflowState.ORCHESTRATING && requirements && !isProcessing) {
      const runOrchestration = async () => {
        setIsProcessing(true);
        addLog(AgentType.ORCHESTRATOR, 'Master Planner', 'Breaking down requirements into tasks...', 'info');

        const plan = await orchestratePlan(requirements);
        setTasks(plan.map(t => ({ ...t, status: 'pending', interactions: [], retryCount: 0 })));

        addLog(AgentType.ORCHESTRATOR, 'Master Planner', `Created ${plan.length} high-level tasks.`, 'success', JSON.stringify(plan, null, 2));

        setWorkflowState(WorkflowState.EXECUTING);
        setIsProcessing(false);
      };
      runOrchestration();
    }
  }, [workflowState, requirements, addLog, isProcessing]);

  // 3. Execution Loop
  useEffect(() => {
    if (workflowState === WorkflowState.EXECUTING && !isProcessing) {
      const pendingTask = tasks.find(t => t.status === 'pending');

      if (!pendingTask) {
        // Check if all done
        if (tasks.every(t => t.status === 'completed' || t.status === 'failed')) {
          setWorkflowState(WorkflowState.FINISHED);
          addLog(AgentType.ORCHESTRATOR, 'System', 'All tasks execution cycle finished.', 'success');
        }
        return;
      }

      // Check dependencies - find the first task where all dependencies are completed
      const taskToRun = tasks.find(t =>
        t.status === 'pending' &&
        t.dependencies.every(dId => tasks.find(pt => pt.id === dId)?.status === 'completed')
      );

      // If we have pending tasks but none are ready, it means we are either waiting or blocked (e.g. dep failed)
      // For now, if a dependency failed, we probably should fail this task too.
      if (!taskToRun) {
        const failedDepTask = tasks.find(t =>
          t.status === 'pending' &&
          t.dependencies.some(dId => tasks.find(pt => pt.id === dId)?.status === 'failed')
        );

        if (failedDepTask) {
          addLog(AgentType.ORCHESTRATOR, 'System', `Task ${failedDepTask.title} blocked by failed dependency. Marking failed.`, 'error');
          setTasks(prev => prev.map(t => t.id === failedDepTask.id ? { ...t, status: 'failed' } : t));
        }
        return;
      }

      const runTask = async () => {
        setIsProcessing(true);
        const startTime = Date.now();

        // A. Check for Reusable Agent in Registry
        const dynamicName = taskToRun.dynamicAgentName || `${taskToRun.assignedTo} Sub-Unit`;
        const agentId = Math.random().toString(36).substr(2, 5);
        const retryLabel = (taskToRun.retryCount || 0) > 0 ? `(Retry #${taskToRun.retryCount})` : '';

        // Try to find a matching agent in the registry
        const matchResult = findMatchingAgent(taskToRun);
        const isReusing = matchResult && matchResult.score >= 0.5;
        let registryAgentId: string | undefined;

        if (isReusing && matchResult) {
          addLog(AgentType.ORCHESTRATOR, 'Registry',
            `♻️ Reusing agent: ${matchResult.agent.name} (${Math.round(matchResult.score * 100)}% match)`, 'success');
          addLog(AgentType.ORCHESTRATOR, 'Registry',
            `Reason: ${matchResult.reason}`, 'info');
          registryAgentId = matchResult.agent.id;
        } else {
          addLog(AgentType.SYNTHESIZER, 'System',
            `🆕 Spawning new agent: ${dynamicName} ${retryLabel}`, 'info');
        }

        const newAgent: DynamicAgent = {
          id: agentId,
          name: isReusing ? matchResult!.agent.name : dynamicName,
          parentType: taskToRun.assignedTo,
          role: taskToRun.description,
          status: 'active',
          registryId: registryAgentId,
          isReused: isReusing,
          reuseScore: matchResult?.score,
          currentPhase: 'planning'
        };
        setActiveAgents(prev => [...prev, newAgent]);
        setTasks(prev => prev.map(t => t.id === taskToRun.id ? { ...t, status: 'in-progress' } : t));

        let plan = "";
        let approved = false;
        let critiqueFeedback = "";
        let planAttempts = 0;
        const MAX_PLAN_RETRIES = 3;

        // B. Planning Loop
        setActiveAgents(prev => prev.map(a => a.id === agentId ? { ...a, currentPhase: 'planning' } : a));
        addLog(AgentType.DYNAMIC, newAgent.name, "📝 Drafting execution plan...", 'info');

        while (!approved && planAttempts < MAX_PLAN_RETRIES) {
          // Generate Plan
          plan = await generateAgentPlan(taskToRun, dynamicName, knowledgeBase, critiqueFeedback);
          addInteraction(taskToRun.id, 'agent', `Proposed Plan (v${planAttempts + 1}):\n${plan}`);

          // Critique Plan
          addLog(AgentType.CRITIQUE, 'Sentinel', `Reviewing plan v${planAttempts + 1}...`, 'critique');
          const planCritique = await critiquePlan(taskToRun, plan, dynamicName);

          addInteraction(taskToRun.id, 'critique', planCritique.approved
            ? "Plan Approved. Proceed with execution."
            : `Plan Rejected. Issues: ${planCritique.feedback}`);

          if (planCritique.approved) {
            approved = true;
          } else {
            critiqueFeedback = planCritique.feedback;
            planAttempts++;
            addLog(AgentType.CRITIQUE, 'Sentinel', "Plan rejected. Requesting revision.", 'warning');
          }
        }

        if (!approved) {
          addLog(AgentType.CRITIQUE, 'Sentinel', `Task failed: Could not agree on a valid plan after ${MAX_PLAN_RETRIES} attempts.`, 'error');
          // Handle Retry logic for Planning Failure
          handleTaskFailure(taskToRun, agentId);
          return;
        }

        // C. Execution
        setActiveAgents(prev => prev.map(a => a.id === agentId ? { ...a, currentPhase: 'executing' } : a));
        addLog(AgentType.DYNAMIC, newAgent.name, `⚡ Executing approved plan...`, 'info');
        const executionResult = await executeTaskStep(taskToRun, newAgent.name, plan, knowledgeBase);
        addInteraction(taskToRun.id, 'agent', `Execution Result:\n${executionResult.result}`);

        // D. Critique Result
        setActiveAgents(prev => prev.map(a => a.id === agentId ? { ...a, currentPhase: 'reviewing' } : a));
        addLog(AgentType.CRITIQUE, 'Sentinel', `🔍 Reviewing execution result...`, 'info');
        const resultCritique = await critiqueResult(taskToRun, executionResult.result);
        addInteraction(taskToRun.id, 'critique', resultCritique.approved ? "✅ Result Validated." : `❌ Result Unsatisfactory: ${resultCritique.feedback}`);

        if (resultCritique.approved) {
          addLog(AgentType.CRITIQUE, 'Sentinel', `✅ Result validated. Logic: ${executionResult.logic.substring(0, 50)}...`, 'success');

          // Update Knowledgebase
          setKnowledgeBase(prev => prev + `\n\nTask: ${taskToRun.title}\nResult: ${executionResult.result}`);

          // Register or update agent in registry
          if (registryAgentId) {
            updateAgentMetrics(registryAgentId, true);
            addLog(AgentType.ORCHESTRATOR, 'Registry', `📊 Updated metrics for: ${newAgent.name}`, 'info');
          } else {
            const prompt = `You are ${newAgent.name}. Parent: ${taskToRun.assignedTo}.`;
            const registered = registerAgent(taskToRun, newAgent.name, prompt);
            addLog(AgentType.ORCHESTRATOR, 'Registry', `📝 Registered new agent: ${registered.name}`, 'success');
            setRegisteredAgents(getAllAgents());
          }

          // Mark complete
          setTasks(prev => prev.map(t => t.id === taskToRun.id ? { ...t, status: 'completed', result: executionResult.result } : t));
          setActiveAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'completed' } : a));

          // Cleanup Agent
          setTimeout(() => setActiveAgents(prev => prev.filter(a => a.id !== agentId)), 2000);

        } else {
          // Result Failure
          addLog(AgentType.CRITIQUE, 'Sentinel', `Result sub-par.`, 'error');
          handleTaskFailure(taskToRun, agentId);
        }

        setIsProcessing(false);
      };

      const handleTaskFailure = (task: SubTask, agentId: string) => {
        const currentRetries = task.retryCount || 0;
        const MAX_TASK_RETRIES = 2;

        if (currentRetries < MAX_TASK_RETRIES) {
          addLog(AgentType.ORCHESTRATOR, 'System', `Task failed. Initiating retry (${currentRetries + 1}/${MAX_TASK_RETRIES})...`, 'warning');
          setTasks(prev => prev.map(t => t.id === task.id ? {
            ...t,
            status: 'pending',
            retryCount: currentRetries + 1
          } : t));
        } else {
          addLog(AgentType.ORCHESTRATOR, 'System', `Task failed after ${MAX_TASK_RETRIES} retries. Marking as permanently failed.`, 'error');
          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'failed' } : t));
        }

        // Terminate current agent
        setActiveAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'terminated' } : a));
        setTimeout(() => setActiveAgents(prev => prev.filter(a => a.id !== agentId)), 2000);
        setIsProcessing(false);
      };

      runTask();
    }
  }, [workflowState, tasks, isProcessing, addLog, knowledgeBase]);


  // --- Render ---
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0a0a] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Sidebar: Logs */}
      <div className="w-80 hidden xl:block border-r border-slate-800 bg-[#0a0a0a] shrink-0 z-20">
        <LogsPanel logs={logs} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {workflowState === WorkflowState.REFLECTING ? (
          <ChatInterface
            messages={messages}
            onSendMessage={handleReflectorMessage}
            requirements={requirements}
            isProcessing={isProcessing}
          />
        ) : (
          <OrchestratorView
            tasks={tasks}
            activeAgents={activeAgents}
            workflowState={workflowState}
            knowledgeBase={knowledgeBase}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}

export default App;
