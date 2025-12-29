
export enum AgentType {
  COLLECTOR = 'COLLECTOR',
  CONTEXTUALIZER = 'CONTEXTUALIZER',
  SYNTHESIZER = 'SYNTHESIZER',
  REFLECTOR = 'REFLECTOR',
  CRITIQUE = 'CRITIQUE',
  ORCHESTRATOR = 'ORCHESTRATOR',
  DYNAMIC = 'DYNAMIC' // For dynamically created sub-agents
}

export enum WorkflowState {
  IDLE = 'IDLE',
  REFLECTING = 'REFLECTING', // Initial user requirement gathering
  ORCHESTRATING = 'ORCHESTRATING', // Breaking down tasks
  EXECUTING = 'EXECUTING', // Running tasks
  FINISHED = 'FINISHED'
}

export interface LogEntry {
  id: string;
  timestamp: number;
  agentType: AgentType;
  agentName: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'critique';
  details?: string;
}

export interface DynamicAgent {
  id: string;
  name: string;
  parentType: AgentType;
  role: string;
  status: 'active' | 'waiting' | 'completed' | 'terminated';
  registryId?: string;      // Link to stored agent in registry
  isReused?: boolean;       // Whether this agent was reused
  reuseScore?: number;      // Match score if reused (0-1)
  currentPhase?: 'planning' | 'executing' | 'reviewing';  // Current work phase
}

export interface Interaction {
  role: 'agent' | 'critique';
  content: string;
  timestamp: number;
}

export interface SubTask {
  id: string;
  title: string;
  description: string;
  assignedTo: AgentType;
  status: 'pending' | 'in-progress' | 'reviewing' | 'completed' | 'failed';
  dependencies: string[];
  dynamicAgentName?: string; // If a specific dynamic agent is needed
  result?: string;
  interactions?: Interaction[]; // Chat history between Agent and Critique
  retryCount?: number; // Track number of retries
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  options?: string[]; // Multiple choice options for the user
}

export interface RequirementsDoc {
  userStory: string;
  systemRequirements: string[];
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  isComplete: boolean;
}
