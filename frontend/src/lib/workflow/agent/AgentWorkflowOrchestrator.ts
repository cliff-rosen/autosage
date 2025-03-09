import { EventEmitter } from '../../../lib/utils/EventEmitter';
import { v4 as uuidv4 } from 'uuid';
import {
    AgentWorkflow,
    AgentWorkflowConfig,
    AgentWorkflowEventType,
    AgentWorkflowOrchestratorInterface,
    AgentWorkflowType,
    ErrorEvent,
    OrchestrationPhase,
    OrchestrationStatus,
    PhaseCompleteEvent,
    StatusChangeEvent,
    WorkflowCompleteEvent,
    WORKFLOW_VARIABLES
} from '../../../types/agent-workflows';
import { AgentWorkflowEngine } from './AgentWorkflowEngine';
import { createQuestionDevelopmentWorkflow } from './definitions/questionDevelopmentWorkflow';
import { createKnowledgeBaseDevelopmentWorkflow } from './definitions/knowledgeBaseDevelopmentWorkflow';
import { createAnswerGenerationWorkflow } from './definitions/answerGenerationWorkflow';

/**
 * AgentWorkflowOrchestrator coordinates the execution of the three agent workflows
 */
export class AgentWorkflowOrchestrator implements AgentWorkflowOrchestratorInterface {
    private sessionId: string;
    private status: OrchestrationStatus;
    private eventEmitter: EventEmitter;
    private workflowEngine: AgentWorkflowEngine;
    private config: AgentWorkflowConfig;

    constructor(workflowEngine?: AgentWorkflowEngine) {
        this.sessionId = uuidv4();
        this.eventEmitter = new EventEmitter();
        this.workflowEngine = workflowEngine || new AgentWorkflowEngine();
        this.config = {};

        // Initialize status
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
     */
    async executeFullWorkflow(question: string, config?: AgentWorkflowConfig): Promise<string> {
        try {
            // Store config
            this.config = config || {};

            // Update status
            this.updateStatus({
                currentPhase: 'question_development',
                progress: 0,
                results: {}
            });

            // Execute Question Development workflow
            const questionDevResult = await this.executeQuestionDevelopment(question);

            // Update status with improved question
            this.updateStatus({
                currentPhase: 'kb_development',
                progress: 33,
                results: {
                    ...this.status.results,
                    improvedQuestion: questionDevResult.improvedQuestion
                }
            });

            // Emit phase complete event
            this.emitPhaseComplete('question_development', {
                improvedQuestion: questionDevResult.improvedQuestion
            });

            // Execute Knowledge Base Development workflow
            const kbDevResult = await this.executeKnowledgeBaseDevelopment(questionDevResult.improvedQuestion);

            // Update status with knowledge base
            this.updateStatus({
                currentPhase: 'answer_generation',
                progress: 66,
                results: {
                    ...this.status.results,
                    knowledgeBase: kbDevResult.knowledgeBase
                }
            });

            // Emit phase complete event
            this.emitPhaseComplete('kb_development', {
                knowledgeBase: kbDevResult.knowledgeBase
            });

            // Execute Answer Generation workflow
            const answerGenResult = await this.executeAnswerGeneration(
                questionDevResult.improvedQuestion,
                kbDevResult.knowledgeBase
            );

            // Update status with final answer
            this.updateStatus({
                currentPhase: 'completed',
                progress: 100,
                endTime: new Date().toISOString(),
                results: {
                    ...this.status.results,
                    finalAnswer: answerGenResult.finalAnswer
                }
            });

            // Emit phase complete event
            this.emitPhaseComplete('answer_generation', {
                finalAnswer: answerGenResult.finalAnswer
            });

            // Emit workflow complete event
            this.emitWorkflowComplete(answerGenResult.finalAnswer);

            return answerGenResult.finalAnswer;
        } catch (error) {
            console.error('Error executing agent workflow:', error);

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
     * Execute the Question Development workflow
     */
    private async executeQuestionDevelopment(question: string): Promise<{
        improvedQuestion: string;
    }> {
        // Create Question Development workflow
        const workflow = createQuestionDevelopmentWorkflow();

        // Apply configuration
        this.applyWorkflowConfig(workflow);

        // Execute workflow
        const result = await this.workflowEngine.runJob({
            workflow,
            inputs: {
                [WORKFLOW_VARIABLES.ORIGINAL_QUESTION]: question
            }
        });

        // Check for errors
        if (!result.success) {
            throw new Error(`Question Development failed: ${result.error}`);
        }

        // Extract improved question
        const improvedQuestion = result.outputs?.[WORKFLOW_VARIABLES.IMPROVED_QUESTION] as string;

        if (!improvedQuestion) {
            throw new Error('Question Development did not produce an improved question');
        }

        return { improvedQuestion };
    }

    /**
     * Execute the Knowledge Base Development workflow
     */
    private async executeKnowledgeBaseDevelopment(question: string): Promise<{
        knowledgeBase: any;
    }> {
        // Create Knowledge Base Development workflow
        const workflow = createKnowledgeBaseDevelopmentWorkflow();

        // Apply configuration
        this.applyWorkflowConfig(workflow);

        // Execute workflow
        const result = await this.workflowEngine.runJob({
            workflow,
            inputs: {
                [WORKFLOW_VARIABLES.KB_INPUT_QUESTION]: question
            }
        });

        // Check for errors
        if (!result.success) {
            throw new Error(`Knowledge Base Development failed: ${result.error}`);
        }

        // Extract knowledge base
        const knowledgeBase = result.outputs?.[WORKFLOW_VARIABLES.KNOWLEDGE_BASE];

        if (!knowledgeBase) {
            throw new Error('Knowledge Base Development did not produce a knowledge base');
        }

        return { knowledgeBase };
    }

    /**
     * Execute the Answer Generation workflow
     */
    private async executeAnswerGeneration(
        question: string,
        knowledgeBase: any
    ): Promise<{
        finalAnswer: string;
    }> {
        // Create Answer Generation workflow
        const workflow = createAnswerGenerationWorkflow();

        // Apply configuration
        this.applyWorkflowConfig(workflow);

        // Execute workflow
        const result = await this.workflowEngine.runJob({
            workflow,
            inputs: {
                [WORKFLOW_VARIABLES.ANSWER_INPUT_QUESTION]: question,
                [WORKFLOW_VARIABLES.ANSWER_INPUT_KB]: knowledgeBase
            }
        });

        // Check for errors
        if (!result.success) {
            throw new Error(`Answer Generation failed: ${result.error}`);
        }

        // Extract final answer
        const finalAnswer = result.outputs?.[WORKFLOW_VARIABLES.FINAL_ANSWER] as string;

        if (!finalAnswer) {
            throw new Error('Answer Generation did not produce a final answer');
        }

        return { finalAnswer };
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