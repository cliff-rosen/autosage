import { ChatMessage } from '../../interactive-workflow/types';
import { Stage } from '../data/fractal_bot_data';

// Asset types
export interface InformationAsset {
    id: string;
    type: 'document' | 'image' | 'data' | 'chart';
    name: string;
    content: any;
    metadata?: Record<string, any>;
    createdAt: string;
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