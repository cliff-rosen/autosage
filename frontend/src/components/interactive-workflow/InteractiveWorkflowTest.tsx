import React, { useState, useEffect } from 'react';
import { PhaseIndicator } from './PhaseIndicator';
import { ChatPanel } from './ChatPanel';
import { StepList } from './StepList';
import { WorkArea } from './WorkArea';
import { InformationPalette } from './InformationPalette';
import { ToolPalette } from './ToolPalette';
import WorkflowNavigation from './WorkflowNavigation';
import {
    WorkflowStep,
    ChatMessage,
    StepDetails,
    WorkflowState,
    SetupStage,
    ExecutionStage
} from './types';
import {
    TOOL_TEMPLATES,
    SAMPLE_STEP_DETAILS,
    SAMPLE_WORKFLOW_INPUTS,
    STAGE_MESSAGE_BLOCKS,
    SAMPLE_WORKFLOW_STEPS
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

    const handleStateTransition = async (direction: 'forward' | 'backward' = 'forward') => {
        console.log('handleStateTransition', workflowState, direction);
        if (workflowState.isProcessing) return;

        setWorkflowState(prev => ({ ...prev, isProcessing: true }));

        try {
            if (workflowState.phase === 'setup') {
                const setupStages: SetupStage[] = ['initial', 'clarification_requested', 'request_confirmation', 'workflow_designing', 'workflow_explanation', 'workflow_ready'];
                const currentIndex = setupStages.indexOf(workflowState.setupStage);
                const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;

                if (nextIndex >= 0 && nextIndex < setupStages.length) {
                    const nextStage = setupStages[nextIndex];

                    // Add messages for the next stage
                    if (direction === 'forward') {
                        setMessages(prev => [...prev, ...STAGE_MESSAGE_BLOCKS[nextStage]]);
                    } else {
                        // For backward navigation, reset messages to the previous stage
                        const previousMessages = [];
                        for (let i = 0; i <= nextIndex; i++) {
                            previousMessages.push(...STAGE_MESSAGE_BLOCKS[setupStages[i]]);
                        }
                        setMessages(previousMessages);
                    }

                    // Update workflow steps if needed
                    if (nextStage === 'workflow_designing' || nextStage === 'workflow_explanation') {
                        setWorkflowSteps(SAMPLE_WORKFLOW_STEPS);
                    }

                    // Handle transition to execution phase
                    if (nextStage === 'workflow_ready' && direction === 'forward') {
                        setWorkflowState(prev => ({
                            ...prev,
                            phase: 'execution',
                            executionStage: 'workflow_started',
                            setupStage: nextStage
                        }));
                    } else {
                        setWorkflowState(prev => ({ ...prev, setupStage: nextStage }));
                    }
                }
            } else if (workflowState.phase === 'execution') {
                const executionStages: ExecutionStage[] = ['workflow_started', 'compiling_songs', 'retrieving_lyrics', 'analyzing_lyrics', 'tabulating_results', 'workflow_complete'];
                const currentIndex = executionStages.indexOf(workflowState.executionStage);
                const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;

                if (nextIndex >= 0 && nextIndex < executionStages.length) {
                    const nextStage = executionStages[nextIndex];

                    // Add messages for the next stage
                    if (direction === 'forward') {
                        setMessages(prev => [...prev, ...STAGE_MESSAGE_BLOCKS[nextStage]]);
                    } else {
                        // For backward navigation, reset messages to the previous stage
                        const previousMessages = [];
                        for (let i = 0; i <= nextIndex; i++) {
                            previousMessages.push(...STAGE_MESSAGE_BLOCKS[executionStages[i]]);
                        }
                        setMessages(previousMessages);
                    }

                    setWorkflowState(prev => ({ ...prev, executionStage: nextStage }));
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
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Interactive Workflow Test
                </h2>
            </div>

            {/* Navigation */}
            <WorkflowNavigation
                phase={workflowState.phase}
                setupStage={workflowState.setupStage}
                executionStage={workflowState.executionStage}
                isProcessing={workflowState.isProcessing}
                onNext={() => handleStateTransition('forward')}
                onBack={() => handleStateTransition('backward')}
                onRestart={handleRestart}
            />

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden">
                <div className="flex gap-6 h-full p-4">
                    {/* Chat Panel */}
                    <div className="w-[400px] flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
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
                            onSendMessage={() => handleStateTransition('forward')}
                            onInputChange={setInputMessage}
                            onCompleteWorkflow={handleCompleteWorkflow}
                            onPhaseTransition={() => handleStateTransition('forward')}
                        />
                    </div>

                    {/* Main Content Panel */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                        {workflowState.phase === 'setup' ? (
                            // Setup - Show chat or loading animation
                            workflowState.setupStage === 'workflow_designing' ? (
                                <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow">
                                    <div className="text-center space-y-8">
                                        {/* Flowing Dots Animation */}
                                        <div className="relative px-8">
                                            <div className="flex space-x-6">
                                                {[0, 1, 2, 3, 4].map((i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-4 h-4 rounded-full 
                                                            bg-blue-500 
                                                            ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900
                                                            dark:bg-blue-400
                                                            animate-pulse`}
                                                        style={{ animationDelay: `${i * 0.15}s` }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                                            Designing your workflow...
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            This will only take a moment
                                        </div>
                                    </div>
                                </div>
                            ) : workflowState.setupStage === 'workflow_explanation' ? (
                                // Simple workflow steps presentation
                                <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow p-8">
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
                                        Proposed Workflow Steps
                                    </h3>
                                    <div className="space-y-4">
                                        {workflowSteps.map((step, index) => (
                                            <div
                                                key={step.id}
                                                className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                                            >
                                                <div className="flex-none w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                        {step.name}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {step.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : workflowState.setupStage === 'workflow_ready' ? (
                                // Show the workflow steps in a three-panel layout
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
                                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                    <p>Please use the navigation controls above to move through the workflow stages.</p>
                                </div>
                            )
                        ) : workflowState.phase === 'execution' ? (
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