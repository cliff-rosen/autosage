import React, { useState, useEffect, useRef } from 'react';
import {
    AgentWorkflowOrchestrator,
    AgentWorkflowConfig,
    StatusChangeEvent,
    PhaseCompleteEvent,
    WorkflowCompleteEvent,
    AgentWorkflowEventType,
    OrchestrationStatus
} from '../lib/workflow/agent/AgentWorkflowOrchestrator';
import { AgentWorkflowEngine } from '../lib/workflow/agent/AgentWorkflowEngine';
import AgentWorkflowStatusDisplay, { AgentWorkflowStatusDisplayRef, StatusMessage } from './AgentWorkflowStatusDisplay';
import {
    AgentWorkflowChain,
    SAMPLE_WORKFLOW_CHAIN,
    AgentWorkflow
} from '../types/agent-workflows';
import {
    WorkflowVariable,
    WorkflowVariableRole
} from '../types/workflows';

// Use a different name to avoid conflict with the DOM ErrorEvent
interface WorkflowErrorEvent {
    type: AgentWorkflowEventType.ERROR;
    sessionId: string;
    timestamp: string;
    error: string;
}

/**
 * Interface for the agent workflow orchestrator
 */
interface AgentWorkflowOrchestratorInterface {
    executeWorkflowChain(
        inputValues: WorkflowVariable[],
        workflowChain: AgentWorkflowChain,
        config?: AgentWorkflowConfig
    ): Promise<string>;
    getStatus(): OrchestrationStatus;
    cancelExecution(): Promise<boolean>;
    onStatusChange(callback: (event: StatusChangeEvent) => void): void;
    onPhaseComplete(callback: (event: PhaseCompleteEvent) => void): void;
    onWorkflowComplete(callback: (event: WorkflowCompleteEvent) => void): void;
    onError(callback: (event: WorkflowErrorEvent) => void): void;
    setStepStatusCallback(callback: (status: any) => void): void;
}

/**
 * Test component for the AgentWorkflowOrchestrator
 */
const AgentWorkflowOrchestratorTest: React.FC = () => {
    // State for the input question
    const [question, setQuestion] = useState<string>('');

    // State for the orchestrator status
    const [status, setStatus] = useState<OrchestrationStatus | null>(null);

    // State for the step status
    const [stepStatus, setStepStatus] = useState<any | null>(null);

    // State for the final answer
    const [finalAnswer, setFinalAnswer] = useState<string>('');

    // State for the running state
    const [isRunning, setIsRunning] = useState<boolean>(false);

    // State for any errors
    const [error, setError] = useState<string | null>(null);

    // State for the selected status message
    const [selectedStatus, setSelectedStatus] = useState<OrchestrationStatus | any | null>(null);

    // State for the selected status index
    const [selectedStatusIndex, setSelectedStatusIndex] = useState<number | undefined>(undefined);

    // Create a ref to the orchestrator to avoid recreating it on each render
    const orchestratorRef = useRef<AgentWorkflowOrchestratorInterface | null>(null);

    // Ref for the status display component
    const statusDisplayRef = useRef<AgentWorkflowStatusDisplayRef>(null);

    // Initialize the orchestrator if it doesn't exist
    if (!orchestratorRef.current) {
        const workflowEngine = new AgentWorkflowEngine();
        // Cast to the interface to avoid type errors
        orchestratorRef.current = new AgentWorkflowOrchestrator(workflowEngine) as unknown as AgentWorkflowOrchestratorInterface;

        // Set the step status callback
        if (orchestratorRef.current) {
            orchestratorRef.current.setStepStatusCallback((status) => {
                setStepStatus(status);
            });
        }
    }

    // Get the orchestrator from the ref
    const orchestrator = orchestratorRef.current;

    // Handle status selection
    const handleSelectStatus = (status: any, index: number) => {
        setSelectedStatus(status);
        setSelectedStatusIndex(index);
    };

    // Process new status updates
    useEffect(() => {
        if (status || stepStatus) {
            const currentStatus = status || stepStatus;
            setSelectedStatus(currentStatus);

            // Update the selected index to the last one after a short delay
            // to ensure the status messages array has been updated
            setTimeout(() => {
                if (statusDisplayRef.current) {
                    const messages = statusDisplayRef.current.getMessages();
                    setSelectedStatusIndex(messages.length - 1);
                }
            }, 50);
        }
    }, [status, stepStatus]);

    // Handle status change events
    const handleStatusChange = (event: StatusChangeEvent) => {
        setStatus(event.status);

        // Update running state based on status
        if (event.status.currentPhase === 'completed' || event.status.currentPhase === 'failed') {
            setIsRunning(false);
        }

        // Update error state
        if (event.status.currentPhase === 'failed' && event.status.error) {
            setError(event.status.error);
        }
    };

    // Handle phase complete events
    const handlePhaseComplete = (event: PhaseCompleteEvent) => {
        console.log(`Phase ${event.phase} completed with result:`, event.result);
    };

    // Handle workflow complete events
    const handleWorkflowComplete = (event: WorkflowCompleteEvent) => {
        setFinalAnswer(event.finalAnswer);
    };

    // Handle error events
    const handleError = (event: WorkflowErrorEvent) => {
        setError(event.error);
        setIsRunning(false);
    };

    // Set up event listeners when the component mounts
    useEffect(() => {
        if (orchestrator) {
            orchestrator.onStatusChange(handleStatusChange);
            orchestrator.onPhaseComplete(handlePhaseComplete);
            orchestrator.onWorkflowComplete(handleWorkflowComplete);
            orchestrator.onError(handleError);
        }

        // Clean up event listeners when the component unmounts
        return () => {
            // Note: In a real implementation, we would need to remove the event listeners
            // but the current interface doesn't provide methods for that
        };
    }, [orchestrator]);

    // Start the workflow
    const startWorkflow = async () => {
        if (!question.trim()) {
            setError('Please enter a question');
            return;
        }

        if (!orchestrator) {
            setError('Orchestrator not initialized');
            return;
        }

        try {
            // Reset state
            setError(null);
            setIsRunning(true);
            setFinalAnswer('');
            setStatus(null);
            setStepStatus(null);
            setSelectedStatus(null);
            setSelectedStatusIndex(undefined);

            // Clear previous status messages
            if (statusDisplayRef.current) {
                statusDisplayRef.current.clearMessages();
            }

            // Create the input variable
            const inputVariables: WorkflowVariable[] = [
                {
                    variable_id: 'question',
                    name: 'question' as any,
                    value: question,
                    schema: {
                        type: 'string',
                        description: 'The question to answer',
                        is_array: false
                    },
                    io_type: 'input',
                    required: true,
                    variable_role: WorkflowVariableRole.USER_INPUT
                }
            ];

            // Start the workflow
            await orchestrator.executeWorkflowChain(inputVariables, SAMPLE_WORKFLOW_CHAIN);
        } catch (error) {
            console.error('Error starting workflow:', error);
            setError('Failed to start workflow');
            setIsRunning(false);
        }
    };

    // Cancel the workflow
    const cancelWorkflow = async () => {
        if (!orchestrator) {
            return;
        }

        try {
            await orchestrator.cancelExecution();
            setIsRunning(false);
        } catch (error) {
            console.error('Error cancelling workflow:', error);
        }
    };

    return (
        <div>
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Input
                </h3>

                <div className="mb-4">
                    <label
                        htmlFor="question"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                        Question
                    </label>
                    <textarea
                        id="question"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Enter your question..."
                        disabled={isRunning}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={startWorkflow}
                        disabled={isRunning || !question.trim()}
                        className="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isRunning ? 'Processing...' : 'Submit'}
                    </button>

                    {isRunning && (
                        <button
                            onClick={cancelWorkflow}
                            className="px-4 py-2 bg-red-500 text-white font-medium rounded-md hover:bg-red-600 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                        {error}
                    </div>
                )}
            </div>

            {/* Status Display */}
            <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Status Updates</h3>
                <AgentWorkflowStatusDisplay
                    ref={statusDisplayRef}
                    status={status}
                    stepStatus={stepStatus}
                    onSelectStatus={handleSelectStatus}
                    selectedIndex={selectedStatusIndex}
                    maxHeight="300px"
                />
            </div>

            {/* Final Answer */}
            {finalAnswer && (
                <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                        Final Answer
                    </h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{finalAnswer}</p>
                    </div>
                </div>
            )}

            {/* Selected Status Details */}
            {selectedStatus && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-2">Selected Status Details</h3>
                    <pre className="whitespace-pre-wrap overflow-auto max-h-96 p-2 bg-gray-100 dark:bg-gray-900 rounded">
                        {JSON.stringify(selectedStatus, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default AgentWorkflowOrchestratorTest; 