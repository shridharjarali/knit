
import { GoogleGenAI, Type } from "@google/genai";
import { AgentType, RequirementsDoc, SubTask } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- 1. REFLECTOR AGENT (Requirements Gathering) ---

export const reflectorChat = async (
  history: { role: string; content: string }[],
  currentRequirements: RequirementsDoc | null
): Promise<{ responseToUser: string; requirements: RequirementsDoc; options?: string[] }> => {
  const ai = getAI();
  const userTurns = history.filter(h => h.role === 'user').length;
  
  const systemInstruction = `
    You are the Reflector Agent, acting as a Requirements Engineer.
    Your goal is to interview the user until you have a complete specification:
    1. User Story
    2. System Requirements
    3. Functional Requirements
    4. Non-Functional Requirements (Performance, Security, etc.)

    INTERACTION GUIDELINES:
    1. Analyze the user's request. If it is vague, ambiguous, or lacks detail, you MUST ask clarifying questions.
    2. **MCQ REQUIRED**: When asking a clarifying question, you MUST provide 3-5 distinct "options" (Multiple Choice Answers) to guide the user.
       - Example: "What type of data source?" Options: ["Social Media", "News Websites", "Internal Database", "Uploaded Files"].
       - Providing options is CRITICAL to help the user answer quickly.
    3. **STRICT LIMIT**: You are allowed a MAXIMUM of 5 questions.
       - Current Question Count: ${userTurns}.
       - If Current Question Count >= 5, you MUST STOP asking questions. 
       - Instead, make your best intelligent assumptions for any missing details based on the context, populate the requirements fully, and set "isComplete" to true.
       - Do not say "I need more info" if you have reached the limit. Just finalize it.
    4. If the requirements are solid before the limit, set "isComplete" to true immediately.
    
    Output JSON format:
    {
      "responseToUser": "Your conversational response here...",
      "options": ["Option A", "Option B", "Option C", "Option D"], 
      "requirements": {
        "userStory": "...",
        "systemRequirements": ["..."],
        "functionalRequirements": ["..."],
        "nonFunctionalRequirements": ["..."],
        "isComplete": boolean
      }
    }
  `;

  const prompt = `
    Current Conversation History:
    ${history.map(h => `${h.role}: ${h.content}`).join('\n')}
    
    Current Draft Requirements:
    ${JSON.stringify(currentRequirements || {})}

    Analyze the latest user input.
    Current interaction count: ${userTurns}.
    If count >= 5, set isComplete: true.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Reflector Error", error);
    throw error;
  }
};

// --- 2. ORCHESTRATOR AGENT (High Level Planning) ---

export const orchestratePlan = async (
  requirements: RequirementsDoc
): Promise<SubTask[]> => {
  const ai = getAI();
  const systemInstruction = `
    You are the Orchestrator Agent.
    Your task: Take the finalized requirements and break them down into high-level subtasks.
    Assign each task to one of the 4 base agents:
    - COLLECTOR: Gathers data/research.
    - CONTEXTUALIZER: Maps, structures, clusters data.
    - SYNTHESIZER: Reasoning, coding, creating content, decision making.
    - REFLECTOR: Final polishing, user interaction, UI/UX refinement.

    IMPORTANT: Define dependencies. 
    - Logical flow: Research -> Planning -> Implementation -> Review.
    - If Task B requires output from Task A, list Task A's ID in Task B's dependencies.
    - Ensure the graph is acyclic.
    
    Return a JSON array of tasks.
  `;

  const prompt = `
    Requirements:
    ${JSON.stringify(requirements)}

    Create a dependency graph of tasks.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              assignedTo: { type: Type.STRING, enum: [
                AgentType.COLLECTOR, 
                AgentType.CONTEXTUALIZER, 
                AgentType.SYNTHESIZER, 
                AgentType.REFLECTOR
              ] },
              dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
              dynamicAgentName: { type: Type.STRING, description: "Specific role name for the sub-agent needed (e.g., 'Python Architect')" }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Orchestrator Error", error);
    return [];
  }
};

// --- 3. DYNAMIC AGENT (Planning & Execution) ---

export const generateAgentPlan = async (
  task: SubTask,
  agentRole: string,
  context: string,
  critiqueFeedback: string
): Promise<string> => {
  const ai = getAI();
  const systemInstruction = `
    You are a dynamically created agent. Role: ${agentRole}.
    Parent Type: ${task.assignedTo}.
    
    Your Goal: Create a detailed execution plan for the assigned task.
    
    CRITICAL: If you received Critique Feedback, you MUST adjust your plan to address it.
    Do not repeat the same mistake.
  `;

  const prompt = `
    Task: ${task.title}
    Description: ${task.description}
    
    Context Summary: ${context.substring(0, 5000)}
    
    ${critiqueFeedback ? `PREVIOUS PLAN WAS REJECTED.\nCRITIQUE FEEDBACK: ${critiqueFeedback}\n\nYou MUST rewrite the plan to address this.` : "Propose your initial plan."}
    
    Provide a step-by-step plan.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction }
    });
    return response.text || "I will proceed with the standard procedure.";
  } catch (error) {
    return "Plan generation failed.";
  }
};

export const executeTaskStep = async (
  task: SubTask,
  dynamicAgentRole: string,
  approvedPlan: string,
  context: string
): Promise<{ result: string; logic: string }> => {
  const ai = getAI();
  const systemInstruction = `
    You are a dynamically created agent. Role: ${dynamicAgentRole}.
    You have an APPROVED PLAN. Execute it now.
    
    Task: ${task.title}
    Details: ${task.description}
  `;

  const prompt = `
    Approved Plan:
    ${approvedPlan}

    Context/Knowledgebase:
    ${context.substring(0, 10000)}

    Execute the plan. Return the result and the reasoning logic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            result: { type: Type.STRING, description: "The actual output of the work" },
            logic: { type: Type.STRING, description: "Explanation of execution steps" }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Execution Error", error);
    return { result: "Failed to execute", logic: "Error in API call" };
  }
};

// --- 4. CRITIQUE AGENT (Validation) ---

export const critiquePlan = async (
  task: SubTask,
  proposedPlan: string,
  agentRole: string
): Promise<{ approved: boolean; feedback: string }> => {
  const ai = getAI();
  const systemInstruction = `
    You are the Critique Agent (The Sentinel).
    Review the dynamic agent's plan.
    
    Goal: Ensure the plan is efficient, safe, and correct.
    
    Rules:
    1. If the plan is vague, REJECT it.
    2. If the plan is over-engineered when a simple solution exists, REJECT it.
    3. If the plan misses the core objective, REJECT it.
    4. If it looks good, APPROVE it.
    
    Return JSON: { approved: boolean, feedback: string }
  `;

  const prompt = `
    Task: ${task.title}
    Description: ${task.description}
    Agent Role: ${agentRole}
    
    Proposed Plan:
    ${proposedPlan}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction, responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { approved: true, feedback: "Critique service unavailable, proceeding." };
  }
};

export const critiqueResult = async (
  task: SubTask,
  result: string
): Promise<{ approved: boolean; feedback: string }> => {
  const ai = getAI();
  const systemInstruction = `
    You are the Critique Agent.
    Review the FINAL OUTPUT of the task.
    Does it meet the requirements?
    
    Return JSON: { approved: boolean, feedback: string }
  `;

  const prompt = `
    Task: ${task.title}
    Expected: ${task.description}
    Actual Result: ${result}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction, responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { approved: true, feedback: "Critique service unavailable." };
  }
};
