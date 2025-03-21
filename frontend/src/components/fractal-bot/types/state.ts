// Basic types
export type Phase = 'setup' | 'execution' | 'complete';

export type MessageType =
    | 'text'
    | 'action_prompt'
    | 'task_update'
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

// Task types
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'error';

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
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
    metadata: {
        timestamp: string;
        tags: string[];
        taskId?: string;
        [key: string]: any;
    };
}

// Turn state represents a single interaction cycle
export interface TurnState {
    messages: ChatMessage[];
    newTasks: Task[];
    updatedTasks: Record<string, Partial<Task>>;
    newAssets: Asset[];
}

// Main state interface
export interface FractalBotState {
    phase: Phase;
    messages: ChatMessage[];
    tasks: Record<string, Task>;
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
    newTasks: [],
    updatedTasks: {},
    newAssets: []
});

// Initial state factory
export const createInitialState = (): FractalBotState => ({
    phase: 'setup',
    messages: [],
    tasks: {},
    assets: [],
    metadata: {
        lastUpdated: new Date().toISOString(),
        isProcessing: false
    }
}); 