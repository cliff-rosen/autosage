import React, { useState, useEffect } from 'react';
import { AgentWorkflowService } from '../lib/workflow/agent/AgentWorkflowService';
import { OrchestrationPhase, OrchestrationStatus, StatusChangeEvent } from '../types/agent-workflows';
import './AgentWorkflowDemo.css';

// Define a type that includes both OrchestrationPhase and our custom phases
type WorkflowPhase = OrchestrationPhase | 'input' | 'output';

const AgentWorkflowDemo: React.FC = () => {
    const [question, setQuestion] = useState('');
    const [status, setStatus] = useState<OrchestrationStatus | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPhase, setSelectedPhase] = useState<WorkflowPhase>('input');

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
            setSelectedPhase(event.status.currentPhase as WorkflowPhase);
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
        if (!question.trim()) {
            setError('Please enter a question');
            return;
        }

        try {
            // Reset state
            setError(null);
            setIsRunning(true);
            setSelectedPhase('question_development');

            // Start the workflow
            await service.executeFullWorkflow(question);
        } catch (error) {
            console.error('Error starting workflow:', error);
            setError('Failed to start workflow');
            setIsRunning(false);
        }
    };

    // Get a user-friendly label for a phase
    const getPhaseLabel = (phase: WorkflowPhase): string => {
        switch (phase) {
            case 'input':
                return 'Input';
            case 'question_development':
                return 'Question Improvement';
            case 'kb_development':
                return 'Knowledge Base';
            case 'answer_generation':
                return 'Answer Generation';
            case 'output':
                return 'Final Answer';
            case 'completed':
                return 'Complete';
            case 'failed':
                return 'Failed';
            default:
                return 'Processing';
        }
    };

    // Get the progress percentage for a phase
    const getPhaseProgress = (phase: WorkflowPhase): number => {
        if (!status) return 0;

        if (phase === 'input') {
            return 100; // Input phase is always 100% complete once we have a status
        }

        if (phase === 'question_development') {
            if (status.currentPhase === 'question_development') {
                return status.progress / 3; // Assuming 33% is the max for this phase
            }
            // Use a safer approach to check the current phase
            const currentPhase = status.currentPhase as string;
            return currentPhase === 'question_development' || currentPhase === 'input' ? 0 : 100;
        }

        if (phase === 'kb_development') {
            if (status.currentPhase === 'kb_development') {
                return (status.progress - 33) * 3; // Scale 33-66 to 0-100
            }
            // Use a safer approach with string array
            const earlyPhases = ['question_development', 'input'];
            return earlyPhases.includes(status.currentPhase as string) ? 0 : 100;
        }

        if (phase === 'answer_generation') {
            if (status.currentPhase === 'answer_generation') {
                return (status.progress - 66) * 3; // Scale 66-100 to 0-100
            }
            // Use a safer approach with string array
            const earlyPhases = ['input', 'question_development', 'kb_development'];
            return earlyPhases.includes(status.currentPhase as string) ? 0 : 100;
        }

        if (phase === 'output') {
            return status.currentPhase === 'completed' ? 100 : 0;
        }

        return 0;
    };

    // Check if a phase is active
    const isPhaseActive = (phase: WorkflowPhase): boolean => {
        if (!status) return phase === 'input';
        if (status.currentPhase === 'completed') return phase === 'output';
        return status.currentPhase === (phase as string);
    };

    // Check if a phase is complete
    const isPhaseComplete = (phase: WorkflowPhase): boolean => {
        if (!status) return false;

        // Use string comparison for safety
        const currentPhase = status.currentPhase as string;
        if (phase === 'input') return currentPhase !== 'input';

        const phases: string[] = ['input', 'question_development', 'kb_development', 'answer_generation', 'output'];
        const currentIndex = phases.indexOf(currentPhase);
        const phaseIndex = phases.indexOf(phase as string);

        return phaseIndex < currentIndex || status.currentPhase === 'completed';
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
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Enter your question..."
                                disabled={isRunning}
                            />
                            <button onClick={startWorkflow} disabled={isRunning || !question.trim()}>
                                {isRunning ? 'Processing...' : 'Submit'}
                            </button>
                        </div>
                        {error && <div className="error-message">{error}</div>}
                    </div>
                );

            case 'question_development':
                return (
                    <div className="detail-panel">
                        <h3>Question Improvement</h3>
                        <div className="original-question">
                            <h4>Original Question:</h4>
                            <p>{question}</p>
                        </div>
                        {status?.results?.improvedQuestion && (
                            <div className="improved-question">
                                <h4>Improved Question:</h4>
                                <p>{status.results.improvedQuestion}</p>
                            </div>
                        )}
                        <div className="phase-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress"
                                    style={{ width: `${getPhaseProgress('question_development')}%` }}
                                ></div>
                            </div>
                            <p>Analyzing and improving your question...</p>
                        </div>
                    </div>
                );

            case 'kb_development':
                return (
                    <div className="detail-panel">
                        <h3>Knowledge Base Development</h3>
                        {status?.results?.improvedQuestion && (
                            <div className="improved-question">
                                <h4>Question:</h4>
                                <p>{status.results.improvedQuestion}</p>
                            </div>
                        )}
                        <div className="phase-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress"
                                    style={{ width: `${getPhaseProgress('kb_development')}%` }}
                                ></div>
                            </div>
                            <p>Building knowledge base to answer your question...</p>
                        </div>
                        {status?.results?.knowledgeBase && (
                            <div className="knowledge-base">
                                <h4>Knowledge Base:</h4>
                                <div className="kb-summary">
                                    <p>{Array.isArray(status.results.knowledgeBase)
                                        ? `${status.results.knowledgeBase.length} items collected`
                                        : 'Knowledge base created'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'answer_generation':
                return (
                    <div className="detail-panel">
                        <h3>Answer Generation</h3>
                        {status?.results?.improvedQuestion && (
                            <div className="improved-question">
                                <h4>Question:</h4>
                                <p>{status.results.improvedQuestion}</p>
                            </div>
                        )}
                        <div className="phase-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress"
                                    style={{ width: `${getPhaseProgress('answer_generation')}%` }}
                                ></div>
                            </div>
                            <p>Generating comprehensive answer...</p>
                        </div>
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
                return <div className="detail-panel">Select a phase to view details</div>;
        }
    };

    return (
        <div className="agent-workflow-demo">
            <h2>Agent Workflow Demo</h2>

            {/* Workflow Phases - Top Section */}
            <div className="workflow-phases">
                <div
                    className={`phase ${isPhaseActive('input') ? 'active' : ''} ${isPhaseComplete('input') ? 'complete' : ''}`}
                    onClick={() => !isRunning && setSelectedPhase('input')}
                >
                    <div className="phase-icon">1</div>
                    <div className="phase-label">{getPhaseLabel('input')}</div>
                    <div className="phase-progress-bar">
                        <div
                            className="phase-progress"
                            style={{ width: `${getPhaseProgress('input')}%` }}
                        ></div>
                    </div>
                </div>

                <div className="phase-connector"></div>

                <div
                    className={`phase ${isPhaseActive('question_development') ? 'active' : ''} ${isPhaseComplete('question_development') ? 'complete' : ''}`}
                    onClick={() => !isRunning && status && setSelectedPhase('question_development')}
                >
                    <div className="phase-icon">2</div>
                    <div className="phase-label">{getPhaseLabel('question_development')}</div>
                    <div className="phase-progress-bar">
                        <div
                            className="phase-progress"
                            style={{ width: `${getPhaseProgress('question_development')}%` }}
                        ></div>
                    </div>
                </div>

                <div className="phase-connector"></div>

                <div
                    className={`phase ${isPhaseActive('kb_development') ? 'active' : ''} ${isPhaseComplete('kb_development') ? 'complete' : ''}`}
                    onClick={() => !isRunning && status && setSelectedPhase('kb_development')}
                >
                    <div className="phase-icon">3</div>
                    <div className="phase-label">{getPhaseLabel('kb_development')}</div>
                    <div className="phase-progress-bar">
                        <div
                            className="phase-progress"
                            style={{ width: `${getPhaseProgress('kb_development')}%` }}
                        ></div>
                    </div>
                </div>

                <div className="phase-connector"></div>

                <div
                    className={`phase ${isPhaseActive('answer_generation') ? 'active' : ''} ${isPhaseComplete('answer_generation') ? 'complete' : ''}`}
                    onClick={() => !isRunning && status && setSelectedPhase('answer_generation')}
                >
                    <div className="phase-icon">4</div>
                    <div className="phase-label">{getPhaseLabel('answer_generation')}</div>
                    <div className="phase-progress-bar">
                        <div
                            className="phase-progress"
                            style={{ width: `${getPhaseProgress('answer_generation')}%` }}
                        ></div>
                    </div>
                </div>

                <div className="phase-connector"></div>

                <div
                    className={`phase ${isPhaseActive('output') ? 'active' : ''} ${isPhaseComplete('output') ? 'complete' : ''}`}
                    onClick={() => !isRunning && status?.currentPhase === 'completed' && setSelectedPhase('output')}
                >
                    <div className="phase-icon">5</div>
                    <div className="phase-label">{getPhaseLabel('output')}</div>
                    <div className="phase-progress-bar">
                        <div
                            className="phase-progress"
                            style={{ width: `${getPhaseProgress('output')}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Detail Panel - Bottom Section */}
            {renderDetailPanel()}
        </div>
    );
};

export default AgentWorkflowDemo; 