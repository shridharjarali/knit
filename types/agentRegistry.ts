// Agent Registry Types - Simplified schema for storing reusable agents

export interface RegisteredAgent {
  id: string;                    // Unique identifier
  name: string;                  // Agent role name e.g., "Python Architect"
  parentType: string;            // COLLECTOR | CONTEXTUALIZER | SYNTHESIZER | REFLECTOR
  taskPattern: string;           // Original task title for similarity matching
  capabilities: string[];        // e.g., ["code_generation", "analysis"]
  usageCount: number;            // How many times this agent has been used
  successRate: number;           // 0-1 success ratio
  lastUsedAt: number;            // Timestamp of last use
  systemPrompt: string;          // The prompt used to configure this agent
}

export interface AgentMatch {
  agent: RegisteredAgent;
  score: number;                 // Match score 0-1
  reason: string;                // Why this agent matched
}
