export type WorkflowPhase = 'setup' | 'execution';
export type SetupSubPhase =
    | 'question_development'
    | 'workflow_development'
    | 'workflow_designing'
    | 'workflow_ready';

export type SetupStage =
    | 'initial'                    // Initial welcome message
    | 'question_received'          // User has submitted their question
    | 'clarification_requested'    // User's question submitted and bot asking for clarification
    | 'request_confirmation'       // User confirmed lyrics requirement
    | 'workflow_designing'         // Bot showing "Designing workflow steps..."
    | 'workflow_explanation'       // Bot explaining the workflow that has been created
    | 'workflow_ready';           // Workflow is ready to start

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
    subSteps?: WorkflowStep[];  // Add support for nested steps
    parentId?: string;          // Reference to parent step if this is a sub-step
    level: number;              // Depth in the tree (0 for main steps)
    tools?: string[];          // Tools that can be used in this step
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

export type InformationAsset = {
    id: string;
    stepId: string;            // ID of the step that generated this asset
    type: 'search_result' | 'generated_content' | 'analysis_output' | 'intermediate_finding';
    content: any;              // The actual content of the asset
    metadata: {
        tool?: string;         // Tool used to generate this asset
        timestamp: string;     // When the asset was created
        tags: string[];       // For organization/filtering
    };
};

export type StepDetails = {
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    status: string;
    progress: number;
    assets: InformationAsset[];  // Track assets generated in this step
};

export type ToolTemplate = {
    id: string;
    name: string;
    description: string;
    category: 'search' | 'list' | 'analysis' | 'generation';
    icon: string;
};

export interface Asset {
    id: string;
    title: string;
    data: Record<string, any>;
    icon: string;
    type: string;
} 