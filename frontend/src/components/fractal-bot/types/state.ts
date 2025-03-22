// Basic types
export type Phase = 'setup' | 'execution' | 'complete';

export type MessageType =
    | 'text'
    | 'action_prompt'
    | 'agent_update'
    | 'asset_added';

// Message types
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    type: MessageType;
    actionButton?: {
        label: string;
        action: string;
        disabled?: boolean;
    };
}

// Agent types
export type AgentStatus = 'pending' | 'in_progress' | 'completed' | 'error';

export interface Agent {
    id: string;
    title: string;
    description: string;
    status: AgentStatus;
    createdAt: string;
    completedAt?: string;
    metadata?: Record<string, any>;
}

// Asset types
export interface Asset {
    id: string;
    type: string;
    name: string;
    content: any;
    ready: boolean;
    metadata: {
        timestamp: string;
        tags: string[];
        agentId?: string;
        [key: string]: any;
    };
}

// Turn state represents a single interaction cycle
export interface TurnState {
    messages: ChatMessage[];
    newAgents: Agent[];
    updatedAgents: Record<string, Partial<Agent>>;
    newAssets: Asset[];
}

// Main state interface
export interface FractalBotState {
    phase: Phase;
    messages: ChatMessage[];
    agents: Record<string, Agent>;
    assets: Asset[];
    currentTurn?: TurnState;
    metadata: {
        lastUpdated: string;
        isProcessing: boolean;
        [key: string]: any;
    };
}

// Action creators for managing turns
export const createTurn = (): TurnState => ({
    messages: [],
    newAgents: [],
    updatedAgents: {},
    newAssets: []
});

// Initial state factory
export const createInitialState = (): FractalBotState => ({
    phase: 'setup',
    messages: [],
    agents: {
        'fact-checker-agent': {
            id: 'fact-checker-agent',
            title: 'Fact Checker',
            description: 'Verify and validate information across multiple sources',
            status: 'completed',
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
        }
    },
    assets: [],
    metadata: {
        lastUpdated: new Date().toISOString(),
        isProcessing: false
    }
}); 