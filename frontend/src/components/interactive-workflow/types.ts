export type WorkflowPhase = 'setup' | 'execution';
export type SetupSubPhase =
    | 'question_development'
    | 'workflow_development'
    | 'workflow_designing'
    | 'workflow_ready';

export type SetupStage =
    | 'initial'                    // Initial welcome message
    | 'clarification_requested'    // User's question submitted and bot asking for clarification
    | 'clarification_provided'     // User confirmed lyrics requirement
    | 'workflow_explanation'       // Bot explaining it will create a workflow
    | 'workflow_designing'         // Bot showing "Designing workflow steps..."
    | 'workflow_ready';            // Workflow is ready to be shown

export type ExecutionStage =
    | 'workflow_started'          // Workflow execution has begun
    | 'compiling_songs'           // Step 1: Compiling Beatles songs
    | 'retrieving_lyrics'         // Step 2: Retrieving lyrics
    | 'analyzing_lyrics'          // Step 3: Analyzing lyrics for "love"
    | 'tabulating_results'        // Step 4: Tabulating results
    | 'workflow_complete';        // All steps complete

export interface WorkflowState {
    phase: WorkflowPhase;
    setupStage: SetupStage;
    executionStage: ExecutionStage;
    currentStepIndex: number;
    isProcessing: boolean;
}

export type WorkflowStep = {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    agentType: string;
    result?: any;
};

export type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    metadata?: {
        phase?: WorkflowPhase;
        subPhase?: SetupSubPhase;
        stepId?: string;
        type?: 'question' | 'clarification' | 'workflow' | 'result' | 'error';
    };
};

export type WorkflowStepTemplate = {
    id: string;
    name: string;
    description: string;
    agentType: string;
};

export type StepDetails = {
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    status: string;
    progress: number;
};

export type ToolTemplate = {
    id: string;
    name: string;
    description: string;
    category: 'search' | 'list' | 'analysis' | 'generation';
    icon: string;
}; 