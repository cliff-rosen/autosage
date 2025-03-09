import { EventEmitter } from '../../../lib/utils/EventEmitter';
import {
    AgentWorkflowConfig,
    AgentWorkflowEventType,
    AgentWorkflowOrchestratorInterface,
    CancelAgentWorkflowResponse,
    ErrorEvent,
    GetAgentWorkflowStatusResponse,
    OrchestrationStatus,
    PhaseCompleteEvent,
    StartAgentWorkflowResponse,
    StatusChangeEvent,
    WorkflowCompleteEvent
} from '../../../types/agent-workflows';
import { AgentWorkflowOrchestrator } from './AgentWorkflowOrchestrator';

/**
 * Service for interacting with the Agent Workflow system
 */
export class AgentWorkflowService implements AgentWorkflowOrchestratorInterface {
    private readonly eventEmitter: EventEmitter;
    private readonly activeOrchestrators: Map<string, AgentWorkflowOrchestrator>;

    constructor() {
        this.eventEmitter = new EventEmitter();
        this.activeOrchestrators = new Map();
    }

    /**
     * Start a new agent workflow with the given question
     * @param question The question to process
     * @param config Optional configuration for the workflow
     * @returns Promise resolving to the final answer
     */
    async executeFullWorkflow(question: string, config?: AgentWorkflowConfig): Promise<string> {
        try {
            // Create a new orchestrator
            const orchestrator = new AgentWorkflowOrchestrator();

            // Set up event listeners
            this.setupOrchestratorListeners(orchestrator);

            // Get the session ID
            const status = orchestrator.getStatus();
            const { sessionId } = status;

            // Store the orchestrator
            this.activeOrchestrators.set(sessionId, orchestrator);

            // Execute the workflow
            const result = await orchestrator.executeFullWorkflow(question, config);

            // Clean up the orchestrator after a delay
            setTimeout(() => {
                this.activeOrchestrators.delete(sessionId);
            }, 5000);

            return result;
        } catch (error) {
            console.error('Error executing workflow:', error);
            throw error;
        }
    }

    /**
     * Get the current status of a workflow
     * @param sessionId The session ID of the workflow
     * @returns The current status
     */
    getStatus(sessionId: string): OrchestrationStatus {
        const orchestrator = this.getOrchestrator(sessionId);
        return orchestrator.getStatus();
    }

    /**
     * Cancel a running workflow
     * @param sessionId The session ID of the workflow to cancel
     * @returns Promise resolving to true if canceled successfully
     */
    async cancelExecution(sessionId: string): Promise<boolean> {
        try {
            const orchestrator = this.getOrchestrator(sessionId);
            return await orchestrator.cancelExecution();
        } catch (error) {
            console.error('Error canceling workflow:', error);
            throw error;
        }
    }

    /**
     * Register a callback for status change events
     * @param callback Function to call when status changes
     */
    onStatusChange(callback: (event: StatusChangeEvent) => void): void {
        this.eventEmitter.on(AgentWorkflowEventType.STATUS_CHANGE, callback);
    }

    /**
     * Register a callback for phase complete events
     * @param callback Function to call when a phase completes
     */
    onPhaseComplete(callback: (event: PhaseCompleteEvent) => void): void {
        this.eventEmitter.on(AgentWorkflowEventType.PHASE_COMPLETE, callback);
    }

    /**
     * Register a callback for workflow complete events
     * @param callback Function to call when the workflow completes
     */
    onWorkflowComplete(callback: (event: WorkflowCompleteEvent) => void): void {
        this.eventEmitter.on(AgentWorkflowEventType.WORKFLOW_COMPLETE, callback);
    }

    /**
     * Register a callback for error events
     * @param callback Function to call when an error occurs
     */
    onError(callback: (event: ErrorEvent) => void): void {
        this.eventEmitter.on(AgentWorkflowEventType.ERROR, callback);
    }

    /**
     * Remove a status change event listener
     * @param callback The callback to remove
     */
    offStatusChange(callback: (event: StatusChangeEvent) => void): void {
        this.eventEmitter.removeListener(AgentWorkflowEventType.STATUS_CHANGE, callback);
    }

    /**
     * Remove a phase complete event listener
     * @param callback The callback to remove
     */
    offPhaseComplete(callback: (event: PhaseCompleteEvent) => void): void {
        this.eventEmitter.removeListener(AgentWorkflowEventType.PHASE_COMPLETE, callback);
    }

    /**
     * Remove a workflow complete event listener
     * @param callback The callback to remove
     */
    offWorkflowComplete(callback: (event: WorkflowCompleteEvent) => void): void {
        this.eventEmitter.removeListener(AgentWorkflowEventType.WORKFLOW_COMPLETE, callback);
    }

    /**
     * Remove an error event listener
     * @param callback The callback to remove
     */
    offError(callback: (event: ErrorEvent) => void): void {
        this.eventEmitter.removeListener(AgentWorkflowEventType.ERROR, callback);
    }

    /**
     * Get an orchestrator by session ID
     * @param sessionId The session ID
     * @returns The orchestrator
     * @throws Error if the orchestrator is not found
     */
    private getOrchestrator(sessionId: string): AgentWorkflowOrchestrator {
        const orchestrator = this.activeOrchestrators.get(sessionId);

        if (!orchestrator) {
            throw new Error(`No active workflow found with session ID: ${sessionId}`);
        }

        return orchestrator;
    }

    /**
     * Set up event listeners for an orchestrator
     * @param orchestrator The orchestrator to listen to
     */
    private setupOrchestratorListeners(orchestrator: AgentWorkflowOrchestrator): void {
        // Status change events
        orchestrator.onStatusChange((event) => {
            this.eventEmitter.emit(AgentWorkflowEventType.STATUS_CHANGE, event);
        });

        // Phase complete events
        orchestrator.onPhaseComplete((event) => {
            this.eventEmitter.emit(AgentWorkflowEventType.PHASE_COMPLETE, event);
        });

        // Workflow complete events
        orchestrator.onWorkflowComplete((event) => {
            this.eventEmitter.emit(AgentWorkflowEventType.WORKFLOW_COMPLETE, event);
        });

        // Error events
        orchestrator.onError((event) => {
            this.eventEmitter.emit(AgentWorkflowEventType.ERROR, event);
        });
    }
} 