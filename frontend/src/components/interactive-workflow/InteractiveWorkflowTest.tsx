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
    ExecutionStage,
    WorkflowPhase
} from './types';
import {
    TOOL_TEMPLATES,
    SAMPLE_STEP_DETAILS,
    SAMPLE_WORKFLOW_INPUTS,
    STAGE_MESSAGE_BLOCKS,
    SAMPLE_WORKFLOW_STEPS
} from './workflow_data_sample';
import WorkflowStatusSummary from './WorkflowStatusSummary';

const InteractiveWorkflowTest: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>(STAGE_MESSAGE_BLOCKS.initial);
    const [inputMessage, setInputMessage] = useState('');
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
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

    // Helper functions for state transitions
    const getStageSequence = (phase: WorkflowPhase) => {
        return phase === 'setup'
            ? ['initial', 'question_received', 'clarification_requested', 'request_confirmation', 'workflow_designing', 'workflow_explanation', 'workflow_ready'] as SetupStage[]
            : ['workflow_started', 'compiling_songs', 'retrieving_lyrics', 'analyzing_lyrics', 'tabulating_results', 'workflow_complete'] as ExecutionStage[];
    };

    const updateMessagesForStage = (stages: (SetupStage | ExecutionStage)[], nextIndex: number, direction: 'forward' | 'backward') => {
        if (direction === 'forward') {
            const nextStage = stages[nextIndex];
            setMessages(prev => [...prev, ...STAGE_MESSAGE_BLOCKS[nextStage as keyof typeof STAGE_MESSAGE_BLOCKS]]);
        } else {
            const previousMessages = stages
                .slice(0, nextIndex + 1)
                .flatMap(stage => STAGE_MESSAGE_BLOCKS[stage as keyof typeof STAGE_MESSAGE_BLOCKS]);
            setMessages(previousMessages);
        }
    };

    const getStepIndexForStage = (stage: ExecutionStage): number => {
        switch (stage) {
            case 'workflow_started': return 0;
            case 'compiling_songs': return 0;
            case 'retrieving_lyrics': return 1;
            case 'analyzing_lyrics': return 2;
            case 'tabulating_results': return 3;
            case 'workflow_complete': return workflowSteps.length - 1;
            default: return 0;
        }
    };

    const updateStepStatuses = (executionStage: ExecutionStage) => {
        const stageToStepIndex = {
            'workflow_started': -1,
            'compiling_songs': 0,
            'retrieving_lyrics': 1,
            'analyzing_lyrics': 2,
            'tabulating_results': 3,
            'workflow_complete': 4
        };

        const currentStageIndex = stageToStepIndex[executionStage];

        setWorkflowSteps(prev => prev.map((step, index) => ({
            ...step,
            status: index < currentStageIndex ? 'completed'
                : index === currentStageIndex ? 'running'
                    : 'pending'
        })));
    };

    const handleStateTransition = async (direction: 'forward' | 'backward' = 'forward') => {
        if (workflowState.isProcessing) return;

        setWorkflowState(prev => ({ ...prev, isProcessing: true }));

        try {
            const currentPhase = workflowState.phase;
            const stages = getStageSequence(currentPhase);
            const currentStage = currentPhase === 'setup' ? workflowState.setupStage : workflowState.executionStage;
            const currentIndex = stages.indexOf(currentStage as (typeof stages)[number]);
            const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;

            // Check if transition is valid
            if (nextIndex < 0 || nextIndex >= stages.length) return;

            const nextStage = stages[nextIndex];

            // Update messages for the new stage
            updateMessagesForStage(stages, nextIndex, direction);

            // Handle special setup phase transitions
            if (currentPhase === 'setup') {
                // Initialize workflow steps when entering design or explanation stages
                if (nextStage === 'workflow_designing' || nextStage === 'workflow_explanation') {
                    setWorkflowSteps(SAMPLE_WORKFLOW_STEPS);
                }

                // Transition to execution phase if moving forward from workflow_ready
                if (nextStage === 'workflow_ready' && direction === 'forward') {
                    setWorkflowState(prev => ({
                        ...prev,
                        phase: 'execution',
                        executionStage: 'workflow_started',
                        setupStage: nextStage,
                        currentStepIndex: 0,
                        isProcessing: false
                    }));
                    return;
                }

                // Update setup stage
                setWorkflowState(prev => ({
                    ...prev,
                    setupStage: nextStage as SetupStage,
                    isProcessing: false
                }));
            } else {
                // In execution phase, sync the step index with the stage
                const newStepIndex = getStepIndexForStage(nextStage as ExecutionStage);

                // Update step statuses based on the new stage
                updateStepStatuses(nextStage as ExecutionStage);

                // Update execution stage and step index
                setWorkflowState(prev => ({
                    ...prev,
                    executionStage: nextStage as ExecutionStage,
                    currentStepIndex: newStepIndex,
                    isProcessing: false
                }));
            }
        } catch (error) {
            console.error('Error during state transition:', error);
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
                        {/* Bot Status Indicator */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <div className="relative">
                                <div className={`w-3 h-3 rounded-full ${workflowState.isProcessing ? 'bg-green-500' : 'bg-gray-400'}`} />
                                {workflowState.isProcessing && (
                                    <span className="absolute inset-0 rounded-full animate-ping bg-green-400 opacity-75" />
                                )}
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                {workflowState.isProcessing ? 'Bot is thinking...' : 'Bot is ready'}
                            </span>
                        </div>
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
                                        <div className="col-span-4">
                                            <StepList
                                                steps={workflowSteps}
                                                currentStepIndex={workflowState.currentStepIndex}
                                                stepDetails={stepDetails}
                                                onStepSelect={(index) => setWorkflowState(prev => ({ ...prev, currentStepIndex: index }))}
                                            />
                                        </div>

                                        {/* Work Area Panel */}
                                        <div className="col-span-3">
                                            <WorkArea
                                                currentStep={workflowState.currentStepIndex >= 0 ? workflowSteps[workflowState.currentStepIndex] : null}
                                                stepDetails={workflowState.currentStepIndex >= 0 ? stepDetails[workflowSteps[workflowState.currentStepIndex].id] : null}
                                            />
                                        </div>

                                        {/* Right Sidebar */}
                                        <div className="col-span-5 flex flex-col gap-6">
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
                                <div className="grid grid-cols-12 gap-6 h-full">
                                    {/* Left and Center Columns with Status Summary */}
                                    <div className={`${isRightSidebarOpen ? 'col-span-7' : 'col-span-12'} flex flex-col gap-6 p-6`}>
                                        {/* Status Summary - Full Width */}
                                        <div className="flex-none w-full">
                                            <div className="relative">
                                                {workflowState.isProcessing && workflowState.phase === 'execution' && (
                                                    <div className="absolute inset-0 rounded-lg">
                                                        <div className="absolute inset-0 rounded-lg border-2 border-blue-500 animate-pulse" />
                                                        <div className="absolute bottom-0 left-0 h-1 w-full bg-blue-500/20">
                                                            <div className="absolute h-full bg-blue-500 animate-pulse" style={{ width: '50%' }} />
                                                        </div>
                                                    </div>
                                                )}
                                                <WorkflowStatusSummary
                                                    steps={workflowSteps}
                                                    stepDetails={stepDetails}
                                                    currentStepIndex={workflowState.currentStepIndex}
                                                />
                                            </div>
                                        </div>

                                        {/* Steps and Work Area Grid */}
                                        <div className="flex-1 grid grid-cols-7 gap-6 min-h-0">
                                            {/* Step List */}
                                            <div className="col-span-4 overflow-auto">
                                                <StepList
                                                    steps={workflowSteps}
                                                    currentStepIndex={workflowState.currentStepIndex}
                                                    stepDetails={stepDetails}
                                                    onStepSelect={(index) => setWorkflowState(prev => ({ ...prev, currentStepIndex: index }))}
                                                />
                                            </div>

                                            {/* Work Area */}
                                            <div className="col-span-3 overflow-auto">
                                                <WorkArea
                                                    currentStep={workflowState.currentStepIndex >= 0 ? workflowSteps[workflowState.currentStepIndex] : null}
                                                    stepDetails={workflowState.currentStepIndex >= 0 ? stepDetails[workflowSteps[workflowState.currentStepIndex].id] : null}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Sidebar Toggle */}
                                    <button
                                        onClick={() => setIsRightSidebarOpen(prev => !prev)}
                                        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-l-lg p-2 shadow-lg z-10 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        aria-label={isRightSidebarOpen ? "Close palette" : "Open palette"}
                                    >
                                        <svg
                                            className={`w-4 h-4 text-gray-600 dark:text-gray-300 transform transition-transform ${isRightSidebarOpen ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d={isRightSidebarOpen ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
                                            />
                                        </svg>
                                    </button>

                                    {/* Right Sidebar */}
                                    <div className={`${isRightSidebarOpen ? 'col-span-5' : 'hidden'} h-full flex flex-col gap-6 p-6 transition-all duration-300 ease-in-out border-l border-gray-200 dark:border-gray-700`}>
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