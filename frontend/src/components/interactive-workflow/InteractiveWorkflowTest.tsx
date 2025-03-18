import React, { useState, useEffect } from 'react';
import { PhaseIndicator } from './PhaseIndicator';
import { ChatPanel } from './ChatPanel';
import { StepList } from './StepList';
import { WorkArea } from './WorkArea';
import { InformationPalette } from './InformationPalette';
import { ToolPalette } from './ToolPalette';
import {
    WorkflowStep,
    ChatMessage,
    StepDetails,
    WorkflowState
} from './types';
import {
    TOOL_TEMPLATES,
    SAMPLE_STEP_DETAILS,
    SAMPLE_WORKFLOW_INPUTS,
    STAGE_MESSAGE_BLOCKS
} from './workflow_data_sample';
import { v4 as uuidv4 } from 'uuid';

const InteractiveWorkflowTest: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>(STAGE_MESSAGE_BLOCKS.initial);
    const [inputMessage, setInputMessage] = useState('');
    const [workflowState, setWorkflowState] = useState<WorkflowState>({
        phase: 'setup',
        setupStage: 'initial',
        executionStage: 'workflow_started',
        currentStepIndex: 0,
        isProcessing: false
    });
    const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);

    // Add initial step details
    const [stepDetails, setStepDetails] = useState<Record<string, StepDetails>>(SAMPLE_STEP_DETAILS);

    // Add initial workflow inputs
    const [workflowInputs, setWorkflowInputs] = useState<Record<string, any>>(SAMPLE_WORKFLOW_INPUTS);

    // Initialize chat with initial stage messages
    useEffect(() => {
        setMessages(STAGE_MESSAGE_BLOCKS.initial);
    }, []);

    const handleStateTransition = async () => {

        if (workflowState.isProcessing) return;

        setWorkflowState(prev => ({ ...prev, isProcessing: true }));

        try {
            if (workflowState.phase === 'setup') {
                switch (workflowState.setupStage) {
                    case 'initial':
                        console.log('initial');
                        setMessages(prev => [...prev, ...STAGE_MESSAGE_BLOCKS.clarification_requested]);
                        setWorkflowState(prev => ({ ...prev, setupStage: 'clarification_requested' }));
                        break;

                    case 'clarification_requested':
                        console.log('clarification_requested');
                        setMessages(prev => [...prev, ...STAGE_MESSAGE_BLOCKS.workflow_explanation]);
                        setWorkflowState(prev => ({ ...prev, setupStage: 'workflow_explanation' }));
                        break;

                    case 'workflow_explanation':
                        console.log('workflow_explanation');
                        setMessages(prev => [...prev, ...STAGE_MESSAGE_BLOCKS.workflow_designing]);
                        setWorkflowState(prev => ({ ...prev, setupStage: 'workflow_designing' }));
                        break;

                    case 'workflow_designing':
                        console.log('workflow_designing');
                        setWorkflowState(prev => ({ ...prev, setupStage: 'workflow_ready' }));
                        break;

                    case 'workflow_ready':
                        console.log('workflow_ready');
                        setMessages(prev => [...prev, ...STAGE_MESSAGE_BLOCKS.workflow_started]);
                        setWorkflowState(prev => ({
                            ...prev,
                            phase: 'execution',
                            executionStage: 'workflow_started'
                        }));

                        break;
                }
            } else if (workflowState.phase === 'execution') {
                switch (workflowState.executionStage) {
                    case 'workflow_started':
                        setMessages(prev => [...prev, ...STAGE_MESSAGE_BLOCKS.compiling_songs]);
                        setWorkflowState(prev => ({ ...prev, executionStage: 'compiling_songs' }));
                        break;

                    case 'compiling_songs':
                        setMessages(prev => [...prev, ...STAGE_MESSAGE_BLOCKS.retrieving_lyrics]);
                        setWorkflowState(prev => ({ ...prev, executionStage: 'retrieving_lyrics' }));
                        break;

                    case 'retrieving_lyrics':
                        setMessages(prev => [...prev, ...STAGE_MESSAGE_BLOCKS.analyzing_lyrics]);
                        setWorkflowState(prev => ({ ...prev, executionStage: 'analyzing_lyrics' }));
                        break;

                    case 'analyzing_lyrics':
                        setMessages(prev => [...prev, ...STAGE_MESSAGE_BLOCKS.tabulating_results]);
                        setWorkflowState(prev => ({ ...prev, executionStage: 'tabulating_results' }));
                        break;

                    case 'tabulating_results':
                        setMessages(prev => [...prev, ...STAGE_MESSAGE_BLOCKS.workflow_complete]);
                        setWorkflowState(prev => ({ ...prev, executionStage: 'workflow_complete' }));
                        break;
                }
            }
        } finally {
            setWorkflowState(prev => ({ ...prev, isProcessing: false }));
        }
    };

    // Handle completing the workflow
    const handleCompleteWorkflow = () => {
        if (workflowState.setupStage === 'workflow_ready') {
            setWorkflowState(prev => ({
                ...prev,
                phase: 'execution',
                executionStage: 'workflow_started',
                currentStepIndex: 0
            }));
        }
    };

    // Add function to add workflow step
    const handleAddStep = (newStep: WorkflowStep) => {
        setWorkflowSteps(prev => {
            const newSteps = [...prev];
            newSteps.splice(workflowState.currentStepIndex + 1, 0, newStep);
            return newSteps;
        });
        setStepDetails(prev => ({
            ...prev,
            [newStep.id]: {
                inputs: {},
                outputs: {},
                status: 'pending',
                progress: 0
            }
        }));
    };

    // Add function to handle restart
    const handleRestart = () => {
        setWorkflowState({
            phase: 'setup',
            setupStage: 'initial',
            executionStage: 'workflow_started',
            currentStepIndex: 0,
            isProcessing: false
        });
        setMessages(STAGE_MESSAGE_BLOCKS.initial);
        setInputMessage('');
        setWorkflowSteps([]);
        setStepDetails(SAMPLE_STEP_DETAILS);
        setWorkflowInputs(SAMPLE_WORKFLOW_INPUTS);
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Interactive Workflow Test
                </h2>
                <button
                    onClick={handleRestart}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200"
                >
                    Restart Workflow
                </button>
            </div>

            {/* Phase Indicator */}
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                <PhaseIndicator
                    currentPhase={workflowState.phase}
                    currentSubPhase={workflowState.setupStage === 'workflow_designing' ? 'workflow_designing' : workflowState.setupStage === 'workflow_ready' ? 'workflow_ready' : 'question_development'}
                    isQuestionComplete={workflowState.setupStage === 'workflow_ready'}
                    isWorkflowAgreed={workflowState.setupStage === 'workflow_ready'}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 p-4">
                <div className="flex gap-6 h-full">
                    {/* Chat Panel */}
                    <div className="w-[400px] flex flex-col min-h-0">
                        <ChatPanel
                            messages={messages}
                            inputMessage={inputMessage}
                            isProcessing={workflowState.isProcessing}
                            currentPhase={workflowState.phase}
                            currentSubPhase={workflowState.setupStage === 'workflow_designing' ? 'workflow_designing' : workflowState.setupStage === 'workflow_ready' ? 'workflow_ready' : 'question_development'}
                            currentStepIndex={workflowState.currentStepIndex}
                            workflowSteps={workflowSteps}
                            isQuestionComplete={workflowState.setupStage === 'workflow_ready'}
                            isWorkflowAgreed={workflowState.setupStage === 'workflow_ready'}
                            onSendMessage={handleStateTransition}
                            onInputChange={setInputMessage}
                            onCompleteWorkflow={handleCompleteWorkflow}
                            onPhaseTransition={handleStateTransition}
                        />
                    </div>

                    {/* Main Content Panel */}
                    <div className="flex-1 min-w-0 min-h-0">
                        {workflowState.phase === 'setup' ? (
                            // Setup - Only show chat
                            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                <p>Please enter your question in the chat window on the left.</p>
                            </div>
                        ) : workflowState.phase === 'executionx' ? (
                            // Execution - Show three-panel layout
                            <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow">
                                <div className="grid grid-cols-12 gap-6 h-full p-6">
                                    {/* Step List Panel */}
                                    <div className="col-span-3">
                                        <StepList
                                            steps={workflowSteps}
                                            currentStepIndex={workflowState.currentStepIndex}
                                            stepDetails={stepDetails}
                                            onStepSelect={(index) => setWorkflowState(prev => ({ ...prev, currentStepIndex: index }))}
                                        />
                                    </div>

                                    {/* Work Area Panel */}
                                    <div className="col-span-6">
                                        <WorkArea
                                            currentStep={workflowState.currentStepIndex >= 0 ? workflowSteps[workflowState.currentStepIndex] : null}
                                            stepDetails={workflowState.currentStepIndex >= 0 ? stepDetails[workflowSteps[workflowState.currentStepIndex].id] : null}
                                        />
                                    </div>

                                    {/* Right Sidebar */}
                                    <div className="col-span-3 flex flex-col gap-6">
                                        <div className="flex-1 overflow-hidden">
                                            <InformationPalette
                                                messages={messages}
                                                workflowInputs={workflowInputs}
                                                workflowSteps={workflowSteps}
                                                currentStepIndex={workflowState.currentStepIndex}
                                                stepDetails={stepDetails}
                                            />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <ToolPalette
                                                tools={TOOL_TEMPLATES}
                                                currentStepIndex={workflowState.currentStepIndex}
                                                onAddStep={handleAddStep}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Setup - Show workflow steps
                            <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                    Hmm, something went wrong.
                                </h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InteractiveWorkflowTest; 