import React, { useState, useEffect } from 'react';
import { AgentWorkflowService } from '../lib/workflow/agent/AgentWorkflowService';
import {
    AgentWorkflowChain,
    SAMPLE_WORKFLOW_CHAIN,
} from '../types/agent-workflows';
import './AgentWorkflowDemo.css';

import { ValueType } from '@/types/schema';

// Define workflow variable constants
const WORKFLOW_VARIABLES = {
    ORIGINAL_QUESTION: 'original_question' as any,
    IMPROVED_QUESTION: 'improved_question' as any,
    SEARCH_RESULTS: 'search_results' as any,
    FINAL_ANSWER: 'final_answer' as any
};

// Helper functions for phase display
const getPhaseProgress = (phaseId: string): number => {
    // In a real app, this would be calculated based on actual progress
    // For demo purposes, we'll return a random value between 10 and 100
    return Math.floor(Math.random() * 90) + 10;
};

const AgentWorkflowDemo: React.FC = () => {
    // Input values for the workflow
    const [inputValues, setInputValues] = useState<Record<string, any>>({ question: '' });
    const [status, setStatus] = useState<any | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPhase, setSelectedPhase] = useState('input');
    const [activeWorkflowChain, setActiveWorkflowChain] = useState<AgentWorkflowChain>(SAMPLE_WORKFLOW_CHAIN);
    const [currentWorkflowSteps, setCurrentWorkflowSteps] = useState<any[]>([]);
    const [phaseResults, setPhaseResults] = useState<Record<string, any>>({});
    const [chainOutputs, setChainOutputs] = useState<Record<string, any>>({});

    // Create a ref to the service to avoid recreating it on each render
    const serviceRef = React.useRef<AgentWorkflowService | null>(null);

    // Initialize the service if it doesn't exist
    if (!serviceRef.current) {
        serviceRef.current = new AgentWorkflowService();
    }

    // Get the service from the ref
    const service = serviceRef.current;

    // Handle status change events
    const handleStatusChange = (event: any) => {
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
            setSelectedPhase(event.status.currentPhase);
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

    // Set up event listeners when the component mounts
    useEffect(() => {
        service.onStatusChange(handleStatusChange);

        // Clean up event listeners when the component unmounts
        return () => {
            service.offStatusChange(handleStatusChange);
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
            setSelectedPhase(activeWorkflowChain.phases[0].id);
            setPhaseResults({});
            setChainOutputs({});

            // Convert input values to WorkflowVariable array
            const workflowVariables = [
                {
                    variable_id: 'question_input',
                    name: WORKFLOW_VARIABLES.ORIGINAL_QUESTION,
                    value: inputValues.question,
                    schema: {
                        type: 'string' as ValueType,
                        description: 'The input question from the user',
                        is_array: false
                    },
                    io_type: 'input' as const,
                    required: true
                }
            ];

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

    // Render the workflow steps
    const renderWorkflowSteps = () => {
        if (!currentWorkflowSteps || currentWorkflowSteps.length === 0) {
            return null;
        }

        return (
            <div className="workflow-steps">
                <h4>Current Workflow Steps:</h4>
                <ul>
                    {currentWorkflowSteps.map((step, index) => (
                        <li key={index}>
                            <strong>{step.label || `Step ${index + 1}`}</strong>
                            {step.description && <p>{step.description}</p>}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    // Render the chain outputs
    const renderChainOutputs = () => {
        if (Object.keys(chainOutputs).length === 0) {
            return <p>No outputs available yet.</p>;
        }

        return (
            <div className="chain-outputs">
                <h4>Chain Outputs:</h4>
                <div className="output-grid">
                    {Object.entries(chainOutputs).map(([key, value]) => (
                        <div key={key} className="output-item">
                            <h5>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h5>
                            <div className="output-value">
                                {typeof value === 'object' ? (
                                    <pre>{JSON.stringify(value, null, 2)}</pre>
                                ) : (
                                    <p>{String(value)}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
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
                        <h3>Workflow Results</h3>
                        {renderChainOutputs()}
                        <button onClick={() => setSelectedPhase('input')} disabled={isRunning} className="new-question-btn">
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
                        <h3>{phase.label}</h3>
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

                        {/* Display chain outputs so far */}
                        {Object.keys(chainOutputs).length > 0 && (
                            <div className="chain-outputs-so-far">
                                <h4>Chain Outputs So Far:</h4>
                                {renderChainOutputs()}
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
            { id: 'input', label: 'Input Question' },
            ...activeWorkflowChain.phases,
            { id: 'output', label: 'Final Output' }
        ];

        return (
            <div className="workflow-phases">
                {allPhases.map((phase, index) => (
                    <React.Fragment key={phase.id}>
                        {/* Phase item */}
                        <div
                            className={`phase-item ${selectedPhase === phase.id ? 'active' : ''}`}
                            onClick={() => !isRunning && setSelectedPhase(phase.id)}
                        >
                            <div className="phase-icon">{index + 1}</div>
                            <div className="phase-label">{phase.label}</div>
                        </div>

                        {/* Connector (only between phases, not after the last one) */}
                        {index < allPhases.length - 1 && (
                            <div className="phase-connector" />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        <div className="agent-workflow-demo">
            <h2>Sample Workflow Chain Demo</h2>
            <p className="demo-description">
                This demo shows how multiple workflows can be chained together, with outputs from one workflow becoming inputs to the next.
            </p>

            {/* Workflow Phases - Top Section */}
            {renderWorkflowPhases()}

            {/* Detail Panel - Bottom Section */}
            {renderDetailPanel()}
        </div>
    );
};

export default AgentWorkflowDemo; 