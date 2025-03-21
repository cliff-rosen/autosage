// Asset types
export interface InformationAsset {
    id: string;
    type: 'data' | 'analysis' | 'chart' | 'document' | 'analysis_output';
    title?: string;
    name?: string;
    content: any;
    metadata?: {
        timestamp: string;
        tags: string[];
    };
    stepId?: string;
}

// Workspace item types (for the third column)
export interface WorkspaceItem {
    id: string;
    type: 'step' | 'note' | 'decision' | 'checkpoint';
    title: string;
    description: string;
    status: 'pending' | 'active' | 'completed' | 'failed';
    metadata?: Record<string, any>;
    createdAt: string;
}

// Step types
export interface WorkflowStep {
    id: string;
    name: string;
    title?: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    subSteps?: WorkflowStep[];
    parentId?: string;
    level: number;
    agentType?: string;
    tools?: string[];
}

// Step details including assets
export interface StepDetails {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    assets: InformationAsset[];
    content?: string;
}

// Message types
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    metadata?: {
        phase?: 'setup' | 'execution';
        type?: 'question' | 'clarification' | 'workflow' | 'result' | 'error';
    };
}

// Workflow state
export interface WorkflowState {
    phase: 'setup' | 'execution';
    currentStepIndex: number;
    isProcessing: boolean;
}

// Stage types
export type Stage =
    | 'initial'
    | 'question_received'
    | 'workflow_designing'
    | 'workflow_ready'
    | 'workflow_started'
    | 'compiling_songs'
    | 'retrieving_lyrics'
    | 'analyzing_lyrics'
    | 'workflow_complete';

// Stage data structure
export interface StageData {
    stage: Stage;
    messages: ChatMessage[];
    assets: InformationAsset[];
    nextStages: Stage[];
    prevStages: Stage[];
    workspaceItems: WorkspaceItem[];
}

// State snapshot for a particular stage
export interface StageState {
    stage: Stage;
    messages: ChatMessage[];
    assets: InformationAsset[];
    workspaceItems: WorkspaceItem[];
    metadata?: Record<string, any>;
}

// Master state table
export interface FractalBotState {
    currentStage: Stage;
    stageStates: Record<Stage, StageState>;
    globalAssets: InformationAsset[];
    globalWorkspaceItems: WorkspaceItem[];
    metadata: {
        lastUpdated: string;
        currentPhase: 'setup' | 'execution';
        isProcessing: boolean;
        [key: string]: any;
    };
}

// State update action types
export type StateUpdateAction =
    | { type: 'SET_STAGE'; payload: { stage: Stage } }
    | { type: 'ADD_MESSAGE'; payload: { stage: Stage; message: ChatMessage } }
    | { type: 'ADD_ASSET'; payload: { stage: Stage; asset: InformationAsset } }
    | { type: 'ADD_WORKSPACE_ITEM'; payload: { stage: Stage; item: WorkspaceItem } }
    | { type: 'UPDATE_WORKSPACE_ITEM'; payload: { stage: Stage; itemId: string; updates: Partial<WorkspaceItem> } }
    | { type: 'ADD_GLOBAL_ASSET'; payload: { asset: InformationAsset } }
    | { type: 'ADD_GLOBAL_WORKSPACE_ITEM'; payload: { item: WorkspaceItem } }
    | { type: 'UPDATE_METADATA'; payload: { updates: Partial<FractalBotState['metadata']> } };

// Initial state factory
export const createInitialState = (): FractalBotState => ({
    currentStage: 'initial',
    stageStates: {} as Record<Stage, StageState>,
    globalAssets: [],
    globalWorkspaceItems: [],
    metadata: {
        lastUpdated: new Date().toISOString(),
        currentPhase: 'setup',
        isProcessing: false
    }
}); 