import { Workflow, WorkflowStatus, WorkflowStepId, WorkflowVariableName, WorkflowVariable } from './workflows';

/**
 * Enum defining the types of agent workflows
 */
export enum AgentWorkflowType {
    QUESTION_DEVELOPMENT = 'QUESTION_DEVELOPMENT',
    KNOWLEDGE_BASE_DEVELOPMENT = 'KNOWLEDGE_BASE_DEVELOPMENT',
    ANSWER_GENERATION = 'ANSWER_GENERATION',
    COMPLETE_AGENT_WORKFLOW = 'COMPLETE_AGENT_WORKFLOW'
}

/**
 * Interface extending the base Workflow with agent-specific properties
 */
export interface AgentWorkflow extends Workflow {
    agent_workflow_type: AgentWorkflowType;
    max_iterations?: number;
    confidence_threshold?: number;
}

/**
 * Current phase of the agent workflow orchestration
 */
export type OrchestrationPhase =
    | 'question_development'
    | 'kb_development'
    | 'answer_generation'
    | 'completed'
    | 'failed';

/**
 * Status of the agent workflow orchestration
 */
export interface OrchestrationStatus {
    sessionId: string;
    currentPhase: OrchestrationPhase;
    progress: number; // 0-100
    startTime: string;
    endTime?: string;
    error?: string;
    results?: {
        improvedQuestion?: string;
        knowledgeBase?: any;
        finalAnswer?: string;
    };
    currentWorkflowId?: string;
    currentWorkflowStatus?: {
        id: string;
        status: string;
        progress: number;
        state: {
            steps?: Array<{
                id: string;
                name: string;
                status: string;
                result?: any;
            }>;
            variables?: Array<any>;
        };
    };
}

/**
 * Configuration for the agent workflow orchestration
 */
export interface AgentWorkflowConfig {
    maxIterationsPerPhase?: {
        [AgentWorkflowType.QUESTION_DEVELOPMENT]?: number;
        [AgentWorkflowType.KNOWLEDGE_BASE_DEVELOPMENT]?: number;
        [AgentWorkflowType.ANSWER_GENERATION]?: number;
    };
    confidenceThresholds?: {
        [AgentWorkflowType.QUESTION_DEVELOPMENT]?: number;
        [AgentWorkflowType.KNOWLEDGE_BASE_DEVELOPMENT]?: number;
        [AgentWorkflowType.ANSWER_GENERATION]?: number;
    };
    enableFeedbackLoop?: boolean;
    persistState?: boolean;
}

/**
 * Request to start a new agent workflow
 */
export interface StartAgentWorkflowRequest {
    question: string;
    config?: AgentWorkflowConfig;
}

/**
 * Response from starting a new agent workflow
 */
export interface StartAgentWorkflowResponse {
    sessionId: string;
    status: OrchestrationStatus;
    statusUrl: string;
}

/**
 * Request to get the status of an agent workflow
 */
export interface GetAgentWorkflowStatusRequest {
    sessionId: string;
}

/**
 * Response with the status of an agent workflow
 */
export interface GetAgentWorkflowStatusResponse {
    status: OrchestrationStatus;
}

/**
 * Request to cancel an agent workflow
 */
export interface CancelAgentWorkflowRequest {
    sessionId: string;
}

/**
 * Response from canceling an agent workflow
 */
export interface CancelAgentWorkflowResponse {
    success: boolean;
    message?: string;
}

/**
 * Event types for agent workflow orchestration
 */
export enum AgentWorkflowEventType {
    STATUS_CHANGE = 'status_change',
    PHASE_COMPLETE = 'phase_complete',
    WORKFLOW_COMPLETE = 'workflow_complete',
    ERROR = 'error'
}

/**
 * Base event interface for agent workflow events
 */
export interface AgentWorkflowEvent {
    type: AgentWorkflowEventType;
    sessionId: string;
    timestamp: string;
}

/**
 * Status change event
 */
export interface StatusChangeEvent extends AgentWorkflowEvent {
    type: AgentWorkflowEventType.STATUS_CHANGE;
    status: OrchestrationStatus;
}

/**
 * Phase complete event
 */
export interface PhaseCompleteEvent extends AgentWorkflowEvent {
    type: AgentWorkflowEventType.PHASE_COMPLETE;
    phase: OrchestrationPhase;
    result: any;
}

/**
 * Workflow complete event
 */
export interface WorkflowCompleteEvent extends AgentWorkflowEvent {
    type: AgentWorkflowEventType.WORKFLOW_COMPLETE;
    finalAnswer: string;
}

/**
 * Error event
 */
export interface ErrorEvent extends AgentWorkflowEvent {
    type: AgentWorkflowEventType.ERROR;
    error: string;
}

/**
 * Union type for all agent workflow events
 */
export type AgentWorkflowEventUnion =
    | StatusChangeEvent
    | PhaseCompleteEvent
    | WorkflowCompleteEvent
    | ErrorEvent;

/**
 * Interface for the agent workflow orchestrator
 */
export interface AgentWorkflowOrchestratorInterface {
    executeWorkflowChain(
        inputValues: WorkflowVariable[],
        workflowChain: AgentWorkflowChain,
        config?: AgentWorkflowConfig
    ): Promise<string>;
    getStatus(sessionId?: string): OrchestrationStatus;
    cancelExecution(sessionId?: string): Promise<boolean>;
    onStatusChange(callback: (event: StatusChangeEvent) => void): void;
    onPhaseComplete(callback: (event: PhaseCompleteEvent) => void): void;
    onWorkflowComplete(callback: (event: WorkflowCompleteEvent) => void): void;
    onError(callback: (event: ErrorEvent) => void): void;
}

/**
 * Interface for the workflow engine used by the orchestrator
 */
export interface WorkflowEngineInterface {
    runJob(job: WorkflowJob): Promise<JobResult>;
    getJobStatus(jobId: string): Promise<JobStatus>;
    cancelJob(jobId: string): Promise<boolean>;
}

/**
 * Job to run a workflow
 */
export interface WorkflowJob {
    workflow: Workflow;
    inputs: WorkflowVariable[];
    jobId?: string;
}

/**
 * Result of running a workflow job
 */
export interface JobResult {
    jobId: string;
    success: boolean;
    error?: string;
    outputs?: Record<WorkflowVariableName, any>;
}

/**
 * Status of a workflow job
 */
export interface JobStatus {
    jobId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    currentStepId?: WorkflowStepId;
    error?: string;
}

/**
 * Constants for workflow variable names
 */
export const WORKFLOW_VARIABLES = {
    // Question Development
    ORIGINAL_QUESTION: 'original_question' as WorkflowVariableName,
    IMPROVED_QUESTION: 'improved_question' as WorkflowVariableName,
    QUESTION_IMPROVEMENT_CONFIDENCE: 'question_improvement_confidence' as WorkflowVariableName,
    QUESTION_IMPROVEMENT_ITERATIONS: 'question_improvement_iterations' as WorkflowVariableName,
    QUESTION_IMPROVEMENT_FEEDBACK: 'question_improvement_feedback' as WorkflowVariableName,

    // Knowledge Base Development
    KB_INPUT_QUESTION: 'kb_input_question' as WorkflowVariableName,
    KNOWLEDGE_BASE: 'knowledge_base' as WorkflowVariableName,
    KB_COMPLETENESS_SCORE: 'kb_completeness_score' as WorkflowVariableName,
    KB_DEVELOPMENT_ITERATIONS: 'kb_development_iterations' as WorkflowVariableName,
    KB_SOURCES: 'kb_sources' as WorkflowVariableName,
    KB_GAPS: 'kb_gaps' as WorkflowVariableName,

    // Answer Generation
    ANSWER_INPUT_QUESTION: 'answer_input_question' as WorkflowVariableName,
    ANSWER_INPUT_KB: 'answer_input_kb' as WorkflowVariableName,
    FINAL_ANSWER: 'final_answer' as WorkflowVariableName,
    ANSWER_CONFIDENCE: 'answer_confidence' as WorkflowVariableName,
    ANSWER_ITERATIONS: 'answer_iterations' as WorkflowVariableName,
    ANSWER_SOURCES: 'answer_sources' as WorkflowVariableName
};

/**
 * Interface for a workflow phase in a chain
 */
export interface WorkflowPhase {
    id: string;
    type: AgentWorkflowType;
    label: string;
    description: string;
    createWorkflow: () => Promise<AgentWorkflow> | AgentWorkflow;
    inputs: Record<string, {
        source: 'previous' | 'original' | 'constant';
        sourcePhaseId?: string;
        sourceVariable?: WorkflowVariableName;
        value?: any;
    }>;
    outputs: WorkflowVariableName[];
}

/**
 * Interface for a collection of workflows to be executed in sequence
 */
export interface AgentWorkflowChain {
    id: string;
    name: string;
    description: string;
    phases: WorkflowPhase[];
    state?: Record<string, any>; // For now, keeping as Record for backward compatibility
}

/**
 * Default agent workflow chain with the standard three phases
 */
export const DEFAULT_AGENT_WORKFLOW_CHAIN: AgentWorkflowChain = {
    id: 'default_agent_workflow_chain',
    name: 'Default Agent Workflow Chain',
    description: 'Standard three-phase agent workflow: question development, knowledge base development, and answer generation',
    phases: [
        {
            id: 'question_development',
            type: AgentWorkflowType.QUESTION_DEVELOPMENT,
            label: 'Question Development',
            description: 'Improve and refine the original question',
            createWorkflow: () => import('../lib/workflow/agent/definitions/questionDevelopmentWorkflow').then(m => m.createQuestionDevelopmentWorkflow()),
            inputs: {
                [WORKFLOW_VARIABLES.ORIGINAL_QUESTION]: {
                    source: 'original',
                    value: null
                }
            },
            outputs: [WORKFLOW_VARIABLES.IMPROVED_QUESTION]
        },
        {
            id: 'kb_development',
            type: AgentWorkflowType.KNOWLEDGE_BASE_DEVELOPMENT,
            label: 'Knowledge Base Development',
            description: 'Build a comprehensive knowledge base for the question',
            createWorkflow: () => import('../lib/workflow/agent/definitions/knowledgeBaseDevelopmentWorkflow').then(m => m.createKnowledgeBaseDevelopmentWorkflow()),
            inputs: {
                [WORKFLOW_VARIABLES.KB_INPUT_QUESTION]: {
                    source: 'previous',
                    sourcePhaseId: 'question_development',
                    sourceVariable: WORKFLOW_VARIABLES.IMPROVED_QUESTION
                }
            },
            outputs: [WORKFLOW_VARIABLES.KNOWLEDGE_BASE]
        },
        {
            id: 'answer_generation',
            type: AgentWorkflowType.ANSWER_GENERATION,
            label: 'Answer Generation',
            description: 'Generate a comprehensive answer based on the knowledge base',
            createWorkflow: () => import('../lib/workflow/agent/definitions/answerGenerationWorkflow').then(m => m.createAnswerGenerationWorkflow()),
            inputs: {
                [WORKFLOW_VARIABLES.ANSWER_INPUT_QUESTION]: {
                    source: 'previous',
                    sourcePhaseId: 'question_development',
                    sourceVariable: WORKFLOW_VARIABLES.IMPROVED_QUESTION
                },
                [WORKFLOW_VARIABLES.ANSWER_INPUT_KB]: {
                    source: 'previous',
                    sourcePhaseId: 'kb_development',
                    sourceVariable: WORKFLOW_VARIABLES.KNOWLEDGE_BASE
                }
            },
            outputs: [WORKFLOW_VARIABLES.FINAL_ANSWER]
        }
    ]
}; 