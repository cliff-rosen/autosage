import React, { useState, useEffect } from 'react';
import { AgentWorkflowService } from '../lib/workflow/agent/AgentWorkflowService';
import {
    OrchestrationPhase,
    OrchestrationStatus,
    StatusChangeEvent,
    AgentWorkflowChain,
    DEFAULT_AGENT_WORKFLOW_CHAIN,
    PhaseCompleteEvent
} from '../types/agent-workflows';
import './AgentWorkflowDemo.css';
import { WorkflowVariableName } from '@/types/workflows';
import { ValueType } from '@/types/schema';

// Define a type that includes both OrchestrationPhase and our custom phases
type DisplayPhase = OrchestrationPhase | 'input' | 'output';

const AgentWorkflowDemo: React.FC = () => {
    // Input values for the workflow
    const [inputValues, setInputValues] = useState<Record<string, any>>({ question: '' });
    const [status, setStatus] = useState<OrchestrationStatus | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPhase, setSelectedPhase] = useState<DisplayPhase>('input');
    const [activeWorkflowChain, setActiveWorkflowChain] = useState<AgentWorkflowChain>(DEFAULT_AGENT_WORKFLOW_CHAIN);
    const [currentWorkflowSteps, setCurrentWorkflowSteps] = useState<any[]>([]);
    const [phaseResults, setPhaseResults] = useState<Record<string, any>>({});

    // Create a ref to the service to avoid recreating it on each render
    const serviceRef = React.useRef<AgentWorkflowService | null>(null);

    // Initialize the service if it doesn't exist
    if (!serviceRef.current) {
        serviceRef.current = new AgentWorkflowService();
    }

    // Get the service from the ref
    const service = serviceRef.current;

    // Handle status change events
    const handleStatusChange = (event: StatusChangeEvent) => {
        setStatus(event.status);

        // Update running state based on status
        if (event.status.currentPhase === 'completed' || event.status.currentPhase === 'failed') {
            setIsRunning(false);

            // If completed, select the output phase
            if (event.status.currentPhase === 'completed') {
                setSelectedPhase('output');
            }
        } else {
            // Set the selected phase to the current phase
            setSelectedPhase(event.status.currentPhase as DisplayPhase);
        }

        // Update current workflow steps if available
        if (event.status.currentWorkflowStatus?.state?.steps) {
            setCurrentWorkflowSteps(event.status.currentWorkflowStatus.state.steps);
        }

        // Update error state
        if (event.status.currentPhase === 'failed' && event.status.error) {
            setError(event.status.error);
        }
    };

    // Handle phase complete events
    const handlePhaseComplete = (event: PhaseCompleteEvent) => {
        setPhaseResults(prev => ({
            ...prev,
            [event.phase]: event.result
        }));
    };

    // Set up event listeners when the component mounts
    useEffect(() => {

        // Clean up event listeners when the component unmounts
        return () => {
            service.offStatusChange(handleStatusChange);
            service.offPhaseComplete(handlePhaseComplete);
        };
    }, [service]);

    // Start the workflow
    const startWorkflow = async () => {
        // Validate input
        if (!inputValues.question?.trim()) {
            setError('Please enter a question');
            return;
        }

        try {
            // Reset state
            setError(null);
            setIsRunning(true);
            setSelectedPhase('question_development');
            setPhaseResults({});

            // Convert input values to WorkflowVariable array
            const workflowVariables = Object.entries(inputValues).map(([name, value]) => ({
                variable_id: `input-${name}`,
                name: name as WorkflowVariableName,
                value: value,
                schema: {
                    type: 'string' as ValueType,
                    description: `Input ${name}`,
                    is_array: false
                },
                io_type: 'input' as const,
                required: true
            }));

            // Start the workflow with the input values as WorkflowVariable array
            await service.executeWorkflowChain(workflowVariables, activeWorkflowChain);
        } catch (error) {
            console.error('Error starting workflow:', error);
            setError('Failed to start workflow');
            setIsRunning(false);
        }
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValues(prev => ({
            ...prev,
            question: e.target.value
        }));
    };

    // Get a user-friendly label for a phase
    const getPhaseLabel = (phaseId: string): string => {
        // First check if it's one of our custom display phases
        if (phaseId === 'input') return 'Input';
        if (phaseId === 'output') return 'Final Answer';

        // Then check if it's a phase in the active workflow chain
        const workflowPhase = activeWorkflowChain.phases.find(p => p.id === phaseId);
        if (workflowPhase) return workflowPhase.label;

        // Fallback to default labels
        switch (phaseId) {
            case 'question_development':
                return 'Question Improvement';
            case 'kb_development':
                return 'Knowledge Base';
            case 'answer_generation':
                return 'Answer Generation';
            case 'completed':
                return 'Complete';
            case 'failed':
                return 'Failed';
            default:
                return 'Processing';
        }
    };

    // Get the progress percentage for a phase
    const getPhaseProgress = (phaseId: string): number => {
        if (!status) return 0;

        if (phaseId === 'input') {
            return 100; // Input phase is always 100% complete once we have a status
        }

        if (phaseId === 'output') {
            return status.currentPhase === 'completed' ? 100 : 0;
        }

        // If this is the current phase, return its progress
        if (status.currentPhase === phaseId) {
            return status.progress;
        }

        // If this phase is complete, return 100%
        const phaseIndex = activeWorkflowChain.phases.findIndex(p => p.id === phaseId);
        const currentPhaseIndex = activeWorkflowChain.phases.findIndex(p => p.id === status.currentPhase);

        if (phaseIndex < currentPhaseIndex) {
            return 100;
        }

        return 0;
    };

    // Check if a phase is active
    const isPhaseActive = (phaseId: string): boolean => {
        if (!status) return phaseId === 'input';
        if (status.currentPhase === 'completed') return phaseId === 'output';
        return status.currentPhase === phaseId;
    };

    // Check if a phase is complete
    const isPhaseComplete = (phaseId: string): boolean => {
        if (!status) return false;

        // String comparison for safety
        const currentPhase = status.currentPhase as string;
        if (phaseId === 'input') return currentPhase !== 'input';

        // Handle special phases
        if (phaseId === 'output') {
            return currentPhase === 'completed';
        }

        const phaseIndex = activeWorkflowChain.phases.findIndex(p => p.id === phaseId);
        const currentPhaseIndex = activeWorkflowChain.phases.findIndex(p => p.id === currentPhase);

        // If either phase is not found in the workflow chain, handle appropriately
        if (phaseIndex === -1 || currentPhaseIndex === -1) {
            return false;
        }

        return phaseIndex < currentPhaseIndex || currentPhase === 'completed';
    };

    // Render the workflow steps for the current phase
    const renderWorkflowSteps = () => {
        if (!currentWorkflowSteps.length) {
            return <p>No workflow steps available</p>;
        }

        return (
            <div className="workflow-steps">
                <h4>Current Workflow Steps</h4>
                <ul>
                    {currentWorkflowSteps.map((step, index) => (
                        <li key={index} className={step.status === 'completed' ? 'completed' : step.status === 'running' ? 'active' : ''}>
                            <div className="step-name">{step.name || `Step ${index + 1}`}</div>
                            <div className="step-status">{step.status}</div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    // Render the detail panel for the selected phase
    const renderDetailPanel = () => {
        switch (selectedPhase) {
            case 'input':
                return (
                    <div className="detail-panel">
                        <h3>Enter Your Question</h3>
                        <div className="question-input">
                            <input
                                type="text"
                                value={inputValues.question || ''}
                                onChange={handleInputChange}
                                placeholder="Enter your question..."
                                disabled={isRunning}
                            />
                            <button onClick={startWorkflow} disabled={isRunning || !inputValues.question?.trim()}>
                                {isRunning ? 'Processing...' : 'Submit'}
                            </button>
                        </div>
                        {error && <div className="error-message">{error}</div>}
                    </div>
                );

            case 'output':
                return (
                    <div className="detail-panel">
                        <h3>Final Answer</h3>
                        {status?.results?.improvedQuestion && (
                            <div className="improved-question">
                                <h4>Question:</h4>
                                <p>{status.results.improvedQuestion}</p>
                            </div>
                        )}
                        {status?.results?.finalAnswer && (
                            <div className="final-answer">
                                <h4>Answer:</h4>
                                <p>{status.results.finalAnswer}</p>
                            </div>
                        )}
                        <button onClick={() => setSelectedPhase('input')} className="new-question-btn">
                            Ask Another Question
                        </button>
                    </div>
                );

            default:
                // Find the phase in the workflow chain
                const phase = activeWorkflowChain.phases.find(p => p.id === selectedPhase);

                if (!phase) {
                    return <div className="detail-panel">Select a phase to view details</div>;
                }

                return (
                    <div className="detail-panel">
                        <h3>{getPhaseLabel(selectedPhase)}</h3>
                        <p>{phase.description}</p>

                        <div className="phase-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress"
                                    style={{ width: `${getPhaseProgress(selectedPhase)}%` }}
                                ></div>
                            </div>
                            <p>Progress: {getPhaseProgress(selectedPhase)}%</p>
                        </div>

                        {/* Display the current workflow steps */}
                        {renderWorkflowSteps()}

                        {/* Display phase results if available */}
                        {phaseResults[selectedPhase] && (
                            <div className="phase-results">
                                <h4>Phase Results:</h4>
                                <pre>{JSON.stringify(phaseResults[selectedPhase], null, 2)}</pre>
                            </div>
                        )}
                    </div>
                );
        }
    };

    // Render the workflow phases in the top panel
    const renderWorkflowPhases = () => {
        // Always include input and output phases
        const allPhases = [
            { id: 'input', label: 'Input' },
            ...activeWorkflowChain.phases,
            { id: 'output', label: 'Output' }
        ];

        return (
            <div className="workflow-phases">
                {allPhases.map((phase, index) => (
                    <React.Fragment key={phase.id}>
                        <div
                            className={`phase ${isPhaseActive(phase.id) ? 'active' : ''} ${isPhaseComplete(phase.id) ? 'complete' : ''}`}
                            onClick={() => !isRunning && setSelectedPhase(phase.id as DisplayPhase)}
                        >
                            <div className="phase-icon">{index + 1}</div>
                            <div className="phase-label">{getPhaseLabel(phase.id)}</div>
                            <div className="phase-progress-bar">
                                <div
                                    className="phase-progress"
                                    style={{ width: `${getPhaseProgress(phase.id)}%` }}
                                ></div>
                            </div>
                        </div>
                        {index < allPhases.length - 1 && <div className="phase-connector"></div>}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        <div className="agent-workflow-demo">
            <h2>Agent Workflow Demo</h2>

            {/* Workflow Phases - Top Section */}
            {renderWorkflowPhases()}

            {/* Detail Panel - Bottom Section */}
            {renderDetailPanel()}
        </div>
    );
};

export default AgentWorkflowDemo; 