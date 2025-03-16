import { EventEmitter } from '../../../lib/utils/EventEmitter';
import { v4 as uuidv4 } from 'uuid';
import {
    AgentWorkflow,
    AgentWorkflowChain,
    WorkflowPhase
} from '../../../types/agent-workflows';
import { WorkflowVariable } from '../../../types/workflows';
import { AgentWorkflowEngine } from './AgentWorkflowEngine';
import { updateStateWithInputs, updateStateWithOutputs, variablesToRecord } from '../utils/state-management';

/**
 * Event types for the agent workflow orchestrator
 */
export enum AgentWorkflowEventType {
    STATUS_CHANGE = 'status_change',
    PHASE_COMPLETE = 'phase_complete',
    WORKFLOW_COMPLETE = 'workflow_complete',
    ERROR = 'error'
}

/**
 * Phases of the orchestration process
 */
export type OrchestrationPhase =
    | 'question_development'
    | 'knowledge_base_development'
    | 'answer_generation'
    | 'completed'
    | 'failed';

/**
 * Status of the orchestration process
 */
export interface OrchestrationStatus {
    sessionId: string;
    currentPhase: OrchestrationPhase | string;
    progress: number;
    startTime: string;
    endTime?: string;
    error?: string;
    currentWorkflowId?: string;
    currentWorkflowStatus?: {
        id: string;
        status: 'running' | 'completed' | 'failed';
        progress: number;
        state: {
            steps: Array<{
                id: string;
                name: string;
                status: 'running' | 'completed' | 'failed';
                result?: any;
            }>;
        };
    };
    results?: Record<string, any>;
}

/**
 * Interface for the status change event
 */
export interface StatusChangeEvent {
    type: AgentWorkflowEventType.STATUS_CHANGE;
    sessionId: string;
    timestamp: string;
    status: OrchestrationStatus;
}

/**
 * Interface for the phase complete event
 */
export interface PhaseCompleteEvent {
    type: AgentWorkflowEventType.PHASE_COMPLETE;
    sessionId: string;
    timestamp: string;
    phase: OrchestrationPhase;
    result: any;
}

/**
 * Interface for the workflow complete event
 */
export interface WorkflowCompleteEvent {
    type: AgentWorkflowEventType.WORKFLOW_COMPLETE;
    sessionId: string;
    timestamp: string;
    finalAnswer: string;
}

/**
 * Interface for the error event
 */
export interface ErrorEvent {
    type: AgentWorkflowEventType.ERROR;
    sessionId: string;
    timestamp: string;
    error: string;
}

/**
 * Configuration options for the agent workflow
 */
export interface AgentWorkflowConfig {
    maxIterationsPerPhase?: Record<string, number>;
    confidenceThresholds?: Record<string, number>;
}

/**
 * Interface for the agent workflow orchestrator
 */
export interface AgentWorkflowOrchestratorInterface {
    executeWorkflowChain(
        workflowChain: AgentWorkflowChain,
        inputValues: WorkflowVariable[],
        config?: AgentWorkflowConfig
    ): Promise<string>;
    getStatus(): OrchestrationStatus;
    cancelExecution(): Promise<boolean>;
    onStatusChange(callback: (event: StatusChangeEvent) => void): void;
    onPhaseComplete(callback: (event: PhaseCompleteEvent) => void): void;
    onWorkflowComplete(callback: (event: WorkflowCompleteEvent) => void): void;
    onError(callback: (event: ErrorEvent) => void): void;
    setStepStatusCallback(callback: (status: any) => void): void;
}

/**
 * AgentWorkflowOrchestrator coordinates the execution of the three agent workflows
 * that make up the complete agent workflow: question development, knowledge base
 * development, and answer generation.
 */
export class AgentWorkflowOrchestrator implements AgentWorkflowOrchestratorInterface {
    private sessionId: string;
    private status: OrchestrationStatus;
    private eventEmitter: EventEmitter;
    private workflowEngine: AgentWorkflowEngine;
    private config: AgentWorkflowConfig;
    private phaseResults: Record<string, any> = {};
    private currentPhase: WorkflowPhase | null = null;
    private stepStatusCallback: ((status: any) => void) | null = null;

    constructor(workflowEngine?: AgentWorkflowEngine) {
        this.sessionId = uuidv4();
        this.status = {
            sessionId: this.sessionId,
            currentPhase: 'question_development',
            progress: 0,
            startTime: new Date().toISOString(),
            error: undefined
        };
        this.eventEmitter = new EventEmitter();
        this.workflowEngine = workflowEngine || new AgentWorkflowEngine();
        this.config = {};
    }

    /**
     * Set a callback to receive step status updates
     * @param callback The callback to call when a step status update is received
     */
    setStepStatusCallback(callback: (status: {
        jobId: string;
        stepId: string;
        stepIndex: number;
        status: 'running' | 'completed' | 'failed';
        message?: string;
        progress?: number;
        result?: any;
    }) => void): void {
        this.stepStatusCallback = callback;
    }

    /**
     * Execute the full agent workflow
     * @param inputValues The input values to initialize the workflow chain state
     * @param workflowChain The workflow chain to execute
     * @param config Optional configuration for the workflow
     * @returns Promise resolving to the final answer
     */
    async executeWorkflowChain(
        workflowChain: AgentWorkflowChain,
        inputValues: Record<string, any>,
        config?: AgentWorkflowConfig
    ): Promise<string> {
        try {
            console.log('🚀 [WORKFLOW] Starting full workflow execution');

            // Store config
            this.config = config || {};

            // Update chain state with input values
            let chainState = updateStateWithInputs(
                workflowChain.state as WorkflowVariable[],
                inputValues,
                // Create identity mapping for input values
                Object.fromEntries(Object.keys(inputValues).map(k => [k, k]))
            );

            // Initialize phase results with the input values
            this.phaseResults = {
                ...inputValues
            };

            // Update status
            this.updateStatus({
                currentPhase: 'question_development',
                progress: 0,
                results: {}
            });

            // Execute each phase in sequence
            let finalAnswer = '';
            for (const phase of workflowChain.phases) {
                console.log(`🔄 [WORKFLOW] Starting phase: ${phase.id}`);
                console.log('qqq ********************************************************************')
                console.log('qqq phase', phase);
                console.log('qqq chainState', chainState);

                // Update status to the current phase
                this.updateStatus({
                    currentPhase: phase.id as OrchestrationPhase,
                    currentWorkflowId: phase.id
                });

                // Get the workflow for this phase
                const workflow = await (phase.workflow instanceof Promise ? phase.workflow : phase.workflow());

                // Apply workflow configuration
                this.applyWorkflowConfig(workflow);

                // Convert chain state to record for phase inputs
                const phaseInputs = variablesToRecord(chainState);

                console.log('qqq phaseInputs', phaseInputs);

                // Execute the workflow for this phase
                const result = await this.executeWorkflowPhase(phase, phaseInputs);

                // Store the results in the phase results
                this.phaseResults[phase.id] = result;

                // Transform the result to match the output mapping format
                // The result needs to be transformed from { key: value } to { newVarName: value }

                const transformedOutputs: Record<string, any> = {};
                result.map((e: any) => {
                    transformedOutputs[e.name] = e.value;
                });

                // Update chain state with phase outputs
                console.log('qqq result', result);
                console.log('qqq transformedOutputs', transformedOutputs);
                console.log('qqq phase.outputs_mappings', phase.outputs_mappings);
                chainState = updateStateWithOutputs(
                    chainState,
                    transformedOutputs,
                    phase.outputs_mappings
                );
                console.log('qqq chainState again', chainState);

                // If this is the final phase, get the final answer
                if (phase.id === workflowChain.phases[workflowChain.phases.length - 1].id) {
                    // Look for a final answer in the result
                    // This assumes the final phase has an output mapped to something like 'finalAnswer'
                    for (const key of Object.keys(result)) {
                        if (key.toLowerCase().includes('final') && key.toLowerCase().includes('answer')) {
                            finalAnswer = result[key] || '';
                            break;
                        }
                    }

                    // If no specific final answer found, use the first output
                    if (!finalAnswer && Object.keys(result).length > 0) {
                        finalAnswer = result[Object.keys(result)[0]] || '';
                    }
                }

                console.timeEnd(`⏱️ Phase Execution Time: ${phase.id}`);
                console.log(`✅ [WORKFLOW] Completed phase: ${phase.id}`);

                // Emit phase complete event
                this.emitPhaseComplete(phase.id as OrchestrationPhase, result);
            }

            // Update status to completed
            this.updateStatus({
                currentPhase: 'completed',
                progress: 100,
                endTime: new Date().toISOString(),
                results: {
                    chainOutputs: chainState
                }
            });

            // Emit workflow complete event
            this.emitWorkflowComplete(chainState);

            console.timeEnd('⏱️ Full Workflow Execution Time');
            console.log('✅ [WORKFLOW] Workflow execution completed');

            return finalAnswer;
        } catch (error) {
            console.error('❌ [WORKFLOW] Error executing workflow:', error);

            // Update status to failed
            this.updateStatus({
                currentPhase: 'failed',
                error: error instanceof Error ? error.message : String(error)
            });

            // Emit error event
            this.emitError(error instanceof Error ? error.message : String(error));

            throw error;
        }
    }

    /**
     * Get the current status of the workflow
     */
    getStatus(): OrchestrationStatus {
        return { ...this.status };
    }

    /**
     * Cancel the execution of the workflow
     */
    async cancelExecution(): Promise<boolean> {
        // If there's a current workflow job, cancel it
        if (this.status.currentWorkflowId) {
            await this.workflowEngine.cancelJob(this.status.currentWorkflowId);
        }

        // Update status
        this.updateStatus({
            currentPhase: 'failed',
            error: 'Workflow cancelled by user',
            endTime: new Date().toISOString()
        });

        // Emit error event
        this.emitError('Workflow cancelled by user');

        return true;
    }

    /**
     * Register a callback for status change events
     */
    onStatusChange(callback: (event: StatusChangeEvent) => void): void {
        this.eventEmitter.on(AgentWorkflowEventType.STATUS_CHANGE, callback);
    }

    /**
     * Register a callback for phase complete events
     */
    onPhaseComplete(callback: (event: PhaseCompleteEvent) => void): void {
        this.eventEmitter.on(AgentWorkflowEventType.PHASE_COMPLETE, callback);
    }

    /**
     * Register a callback for workflow complete events
     */
    onWorkflowComplete(callback: (event: WorkflowCompleteEvent) => void): void {
        this.eventEmitter.on(AgentWorkflowEventType.WORKFLOW_COMPLETE, callback);
    }

    /**
     * Register a callback for error events
     */
    onError(callback: (event: ErrorEvent) => void): void {
        this.eventEmitter.on(AgentWorkflowEventType.ERROR, callback);
    }

    /**
     * Execute a single workflow phase
     * @param phase The workflow phase to execute
     * @param inputs The input values for this phase
     * @returns Promise resolving to the phase results
     */
    private async executeWorkflowPhase(
        phase: WorkflowPhase,
        inputs: Record<string, any>
    ): Promise<Record<string, any>> {
        console.log(`🔄 [PHASE ${phase.id}] Starting workflow phase: ${phase.label}`);

        // Store the current phase
        this.currentPhase = phase;

        // Update status
        this.updateStatus({
            currentPhase: phase.id as OrchestrationPhase,
            progress: 0,
            currentWorkflowStatus: {
                id: phase.id,
                status: 'running',
                progress: 0,
                state: {
                    steps: []
                }
            }
        });

        // Get the workflow
        const workflow = await (phase.workflow instanceof Promise ? phase.workflow : phase.workflow());

        // Apply configuration
        this.applyWorkflowConfig(workflow);

        // Update workflow state with inputs
        const workflowState = updateStateWithInputs(
            workflow.state as WorkflowVariable[],
            inputs,
            phase.inputs_mappings
        );

        // Create status callback
        const statusCallback = (status: {
            jobId: string;
            stepId: string;
            stepIndex: number;
            status: 'running' | 'completed' | 'failed';
            message?: string;
            progress?: number;
            result?: any;
        }) => {
            // Calculate overall phase progress based on step progress
            // For simplicity, we'll assume each step contributes equally to the phase progress
            const stepCount = workflow.steps.length;
            const stepWeight = 1 / stepCount;
            const stepProgress = status.progress || 0;

            // Calculate the phase progress as: 
            // (completed steps * 100% + current step progress * step weight)
            const phaseProgress = Math.min(
                100,
                Math.round((status.stepIndex * stepWeight * 100) + (stepProgress * stepWeight))
            );

            // Update the orchestration status with the step information
            this.updateStatus({
                progress: phaseProgress,
                currentWorkflowStatus: {
                    id: phase.id,
                    status: 'running',
                    progress: phaseProgress,
                    state: {
                        steps: [{
                            id: status.stepId,
                            name: workflow.steps[status.stepIndex]?.label || `Step ${status.stepIndex + 1}`,
                            status: status.status,
                            result: status.result
                        }]
                    }
                }
            });

            // Forward the status update to the step status callback if set
            if (this.stepStatusCallback) {
                this.stepStatusCallback(status);
            }
        };

        // Run the workflow with updated state
        const jobResult = await this.workflowEngine.runJob({
            workflow: {
                ...workflow,
                state: workflowState
            },
            inputs,
            statusCallback
        });
        console.log('qqq AgentWorkflowOrchestrator jobResult', jobResult);

        // Update status to reflect phase completion
        const phaseStatus = jobResult.success ? 'completed' : 'failed';
        this.updateStatus({
            currentPhase: phaseStatus as OrchestrationPhase,
            progress: jobResult.success ? 100 : this.status.progress,
            error: jobResult.error,
            currentWorkflowStatus: {
                id: phase.id,
                status: phaseStatus,
                progress: jobResult.success ? 100 : this.status.progress,
                state: {
                    steps: []
                }
            }
        });

        // Check for errors
        if (!jobResult.success || !jobResult.outputs) {
            const errorMessage = jobResult.error || `Unknown error in ${phase.label} workflow`;
            console.error(`❌ [PHASE ${phase.id}] Workflow job failed:`, errorMessage);
            throw new Error(errorMessage);
        }

        // Return the raw outputs from the workflow engine
        // The mapping to chain variables will be done in executeWorkflowChain
        console.log(`✅ [PHASE ${phase.id}] Workflow completed successfully with outputs:`, Object.keys(jobResult.outputs));

        // Emit phase complete event with the raw outputs
        this.emitPhaseComplete(phase.id as OrchestrationPhase, jobResult.outputs);

        return jobResult.outputs;
    }

    /**
     * Apply configuration to a workflow
     */
    private applyWorkflowConfig(workflow: AgentWorkflow): void {
        const { agent_workflow_type } = workflow;

        // Apply max iterations
        if (this.config.maxIterationsPerPhase &&
            agent_workflow_type in this.config.maxIterationsPerPhase) {
            const maxIterations = this.config.maxIterationsPerPhase[agent_workflow_type as keyof typeof this.config.maxIterationsPerPhase];
            if (maxIterations !== undefined) {
                workflow.max_iterations = maxIterations;
            }
        }

        // Apply confidence threshold
        if (this.config.confidenceThresholds &&
            agent_workflow_type in this.config.confidenceThresholds) {
            const threshold = this.config.confidenceThresholds[agent_workflow_type as keyof typeof this.config.confidenceThresholds];
            if (threshold !== undefined) {
                workflow.confidence_threshold = threshold;
            }
        }
    }

    /**
     * Update the status and emit a status change event
     */
    private updateStatus(updates: Partial<OrchestrationStatus>): void {
        this.status = {
            ...this.status,
            ...updates
        };

        // Emit status change event
        this.emitStatusChange();
    }

    /**
     * Emit a status change event
     */
    private emitStatusChange(): void {
        const event: StatusChangeEvent = {
            type: AgentWorkflowEventType.STATUS_CHANGE,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            status: { ...this.status }
        };

        this.eventEmitter.emit(AgentWorkflowEventType.STATUS_CHANGE, event);
    }

    /**
     * Emit a phase complete event
     */
    private emitPhaseComplete(phase: OrchestrationPhase, result: any): void {
        const event: PhaseCompleteEvent = {
            type: AgentWorkflowEventType.PHASE_COMPLETE,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            phase,
            result
        };

        this.eventEmitter.emit(AgentWorkflowEventType.PHASE_COMPLETE, event);
    }

    /**
     * Emit a workflow complete event
     */
    private emitWorkflowComplete(finalAnswer: string): void {
        const event: WorkflowCompleteEvent = {
            type: AgentWorkflowEventType.WORKFLOW_COMPLETE,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            finalAnswer
        };

        this.eventEmitter.emit(AgentWorkflowEventType.WORKFLOW_COMPLETE, event);
    }

    /**
     * Emit an error event
     */
    private emitError(error: string): void {
        const event: ErrorEvent = {
            type: AgentWorkflowEventType.ERROR,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            error
        };

        this.eventEmitter.emit(AgentWorkflowEventType.ERROR, event);
    }
} 