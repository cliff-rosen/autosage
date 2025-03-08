import { EventEmitter } from '../../../lib/utils/EventEmitter';
import { v4 as uuidv4 } from 'uuid';
import {
    AgentWorkflow,
    AgentWorkflowConfig,
    AgentWorkflowEventType,
    AgentWorkflowOrchestratorInterface,
    ErrorEvent,
    OrchestrationPhase,
    OrchestrationStatus,
    PhaseCompleteEvent,
    StatusChangeEvent,
    WORKFLOW_VARIABLES,
    WorkflowCompleteEvent,
    AgentWorkflowChain,
    DEFAULT_AGENT_WORKFLOW_CHAIN,
    WorkflowPhase
} from '../../../types/agent-workflows';
import { AgentWorkflowEngine } from './AgentWorkflowEngine';

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

    constructor(workflowEngine?: AgentWorkflowEngine) {
        this.sessionId = uuidv4();
        this.eventEmitter = new EventEmitter();
        this.workflowEngine = workflowEngine || new AgentWorkflowEngine();
        this.config = {};
        this.status = {
            sessionId: this.sessionId,
            currentPhase: 'question_development',
            progress: 0,
            startTime: new Date().toISOString(),
            results: {}
        };
    }

    /**
     * Execute the full agent workflow
     * @param question The question to process
     * @param config Optional configuration for the workflow
     * @param workflowChain Optional workflow chain to execute (defaults to DEFAULT_AGENT_WORKFLOW_CHAIN)
     * @returns Promise resolving to the final answer
     */
    async executeWorkflowChain(
        question: string,
        config?: AgentWorkflowConfig,
        workflowChain: AgentWorkflowChain = DEFAULT_AGENT_WORKFLOW_CHAIN
    ): Promise<string> {
        try {
            console.log('🚀 [WORKFLOW] Starting full workflow execution');
            console.time('⏱️ Full Workflow Execution Time');

            // Store config
            this.config = config || {};

            // Initialize phase results with the original question
            this.phaseResults = {
                original_question: question
            };

            // Update status
            this.updateStatus({
                currentPhase: 'question_development',
                progress: 0,
                results: {}
            });

            // Calculate progress increment per phase
            const progressIncrement = 100 / workflowChain.phases.length;

            // Execute each phase in the workflow chain
            for (let i = 0; i < workflowChain.phases.length; i++) {
                const phase = workflowChain.phases[i];
                const phaseId = phase.id;
                const phaseType = phase.type;

                console.log(`🔄 [WORKFLOW] Starting ${phase.label} phase (${i + 1}/${workflowChain.phases.length})`);
                console.time(`⏱️ ${phase.label} Phase`);

                // Update status to current phase
                this.updateStatus({
                    currentPhase: phaseId as OrchestrationPhase,
                    progress: i * progressIncrement
                });

                // Execute the phase
                const phaseResult = await this.executeWorkflowPhase(phase, question);

                // Store the phase results
                this.phaseResults = {
                    ...this.phaseResults,
                    ...phaseResult
                };

                // Update status with phase results
                const updatedResults = { ...this.status.results };

                // Map phase outputs to status results
                if (phaseId === 'question_development') {
                    updatedResults.improvedQuestion = phaseResult[WORKFLOW_VARIABLES.IMPROVED_QUESTION];
                } else if (phaseId === 'kb_development') {
                    updatedResults.knowledgeBase = phaseResult[WORKFLOW_VARIABLES.KNOWLEDGE_BASE];
                } else if (phaseId === 'answer_generation') {
                    updatedResults.finalAnswer = phaseResult[WORKFLOW_VARIABLES.FINAL_ANSWER];
                }

                this.updateStatus({
                    progress: (i + 1) * progressIncrement,
                    results: updatedResults
                });

                // Emit phase complete event
                this.emitPhaseComplete(phaseId as OrchestrationPhase, phaseResult);

                console.timeEnd(`⏱️ ${phase.label} Phase`);
                console.log(`✅ [WORKFLOW] ${phase.label} phase completed`);
            }

            // Get the final answer from the last phase
            const finalAnswer = this.phaseResults[WORKFLOW_VARIABLES.FINAL_ANSWER];

            // Update status to completed
            this.updateStatus({
                currentPhase: 'completed',
                progress: 100,
                endTime: new Date().toISOString()
            });

            // Emit workflow complete event
            this.emitWorkflowComplete(finalAnswer);

            console.timeEnd('⏱️ Full Workflow Execution Time');
            console.log('🎉 [WORKFLOW] Full workflow execution completed successfully');

            return finalAnswer;
        } catch (error) {
            console.error('❌ [WORKFLOW] Error executing agent workflow:', error);

            // Update status with error
            this.updateStatus({
                currentPhase: 'failed',
                error: error instanceof Error ? error.message : String(error),
                endTime: new Date().toISOString()
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
     * @param originalQuestion The original question (for reference)
     * @returns Promise resolving to the phase results
     */
    private async executeWorkflowPhase(
        phase: WorkflowPhase,
        originalQuestion: string
    ): Promise<Record<string, any>> {
        console.log(`🔄 [PHASE ${phase.id}] Starting workflow phase: ${phase.label}`);

        // Create the workflow
        const workflowPromise = phase.createWorkflow();
        const workflow = workflowPromise instanceof Promise
            ? await workflowPromise
            : workflowPromise;

        console.log(`🔄 [PHASE ${phase.id}] Created workflow with ${workflow.steps.length} steps`);

        // Apply any configuration
        this.applyWorkflowConfig(workflow);

        // Prepare inputs for the workflow
        const inputs: Record<string, any> = {};

        for (const [inputName, inputConfig] of Object.entries(phase.inputs)) {
            if (inputConfig.source === 'original') {
                inputs[inputName] = originalQuestion;
            } else if (inputConfig.source === 'previous' && inputConfig.sourcePhaseId && inputConfig.sourceVariable) {
                inputs[inputName] = this.phaseResults[inputConfig.sourceVariable];
            } else if (inputConfig.source === 'constant') {
                inputs[inputName] = inputConfig.value;
            }
        }

        console.log(`🔄 [PHASE ${phase.id}] Running workflow with inputs:`, Object.keys(inputs));

        // Run the workflow
        const jobResult = await this.workflowEngine.runJob({
            workflow,
            inputs
        });

        // Check for errors
        if (!jobResult.success || !jobResult.outputs) {
            const errorMessage = jobResult.error || `Unknown error in ${phase.label} workflow`;
            console.error(`❌ [PHASE ${phase.id}] Workflow job failed:`, errorMessage);
            throw new Error(errorMessage);
        }

        // Extract outputs
        const outputs: Record<string, any> = {};

        for (const outputName of phase.outputs) {
            outputs[outputName] = jobResult.outputs[outputName];
        }

        console.log(`✅ [PHASE ${phase.id}] Workflow completed successfully with outputs:`, Object.keys(outputs));

        return outputs;
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