// Agent Registry Service - CRUD operations for agent storage

import { RegisteredAgent, AgentMatch } from '../types/agentRegistry';
import { SubTask } from '../types';

const STORAGE_KEY = 'agent_registry';
let agents: RegisteredAgent[] = [];

// Load from localStorage on init
try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) agents = JSON.parse(stored);
} catch (e) {
    console.warn('Failed to load agent registry');
}

const save = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
    } catch (e) {
        console.warn('Failed to save agent registry');
    }
};

// Capability extraction keywords
const CAPABILITY_KEYWORDS: Record<string, string[]> = {
    'code_generation': ['code', 'implement', 'build', 'develop', 'program', 'script'],
    'analysis': ['analyze', 'evaluate', 'review', 'assess', 'examine', 'inspect'],
    'data_collection': ['collect', 'gather', 'fetch', 'research', 'scrape', 'retrieve'],
    'synthesis': ['create', 'generate', 'compose', 'design', 'produce', 'craft'],
    'documentation': ['document', 'write', 'describe', 'explain', 'summarize'],
    'testing': ['test', 'validate', 'verify', 'check', 'debug'],
    'optimization': ['optimize', 'improve', 'enhance', 'refine', 'tune'],
    'planning': ['plan', 'architect', 'structure', 'organize', 'outline']
};

// Extract capabilities from text
const extractCapabilities = (text: string): string[] => {
    const lower = text.toLowerCase();
    return Object.entries(CAPABILITY_KEYWORDS)
        .filter(([_, words]) => words.some(w => lower.includes(w)))
        .map(([cap]) => cap);
};

// Calculate text similarity (simple word overlap)
const calculateSimilarity = (text1: string, text2: string): number => {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));

    if (words1.size === 0 || words2.size === 0) return 0;

    let overlap = 0;
    words1.forEach(w => { if (words2.has(w)) overlap++; });

    return overlap / Math.max(words1.size, words2.size);
};

// Register a new agent
export const registerAgent = (
    task: SubTask,
    name: string,
    systemPrompt: string
): RegisteredAgent => {
    const agent: RegisteredAgent = {
        id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name,
        parentType: task.assignedTo,
        taskPattern: task.title,
        capabilities: extractCapabilities(`${task.title} ${task.description} ${name}`),
        usageCount: 1,
        successRate: 1.0,
        lastUsedAt: Date.now(),
        systemPrompt
    };

    agents.push(agent);
    save();
    return agent;
};

// Find matching agent for a task
export const findMatchingAgent = (task: SubTask): AgentMatch | null => {
    const taskText = `${task.title} ${task.description}`;
    const taskCaps = extractCapabilities(taskText);

    const matches = agents
        .filter(a => a.parentType === task.assignedTo && a.successRate >= 0.6)
        .map(agent => {
            // Calculate capability overlap score
            const capOverlap = taskCaps.length > 0
                ? taskCaps.filter(c => agent.capabilities.includes(c)).length / taskCaps.length
                : 0;

            // Calculate task pattern similarity
            const patternSim = calculateSimilarity(agent.taskPattern, task.title);

            // Combine scores (60% capability, 40% pattern similarity)
            const score = capOverlap * 0.6 + patternSim * 0.4;

            // Build reason
            const reasons: string[] = [];
            if (capOverlap > 0.5) reasons.push(`${Math.round(capOverlap * 100)}% capability match`);
            if (patternSim > 0.3) reasons.push(`similar task pattern`);
            if (agent.usageCount > 1) reasons.push(`used ${agent.usageCount}x before`);

            return {
                agent,
                score,
                reason: reasons.join(', ') || 'partial match'
            };
        })
        .filter(m => m.score >= 0.4)
        .sort((a, b) => b.score - a.score);

    return matches[0] || null;
};

// Update agent metrics after use
export const updateAgentMetrics = (id: string, success: boolean): void => {
    const agent = agents.find(a => a.id === id);
    if (!agent) return;

    const oldCount = agent.usageCount;
    agent.usageCount = oldCount + 1;
    agent.successRate = (agent.successRate * oldCount + (success ? 1 : 0)) / agent.usageCount;
    agent.lastUsedAt = Date.now();
    save();
};

// Get all registered agents
export const getAllAgents = (): RegisteredAgent[] => [...agents];

// Get agent by ID
export const getAgentById = (id: string): RegisteredAgent | undefined => {
    return agents.find(a => a.id === id);
};

// Clear all agents (for testing)
export const clearRegistry = (): void => {
    agents = [];
    save();
};
