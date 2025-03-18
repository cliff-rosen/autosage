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
    SAMPLE_WORKFLOW_STEPS,
    SAMPLE_ASSET_DATA
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
            <div className="flex-1 flex overflow-hidden">
                {workflowState.phase === 'setup' ? (
                    <>
                        {/* Chat Panel */}
                        <div className="w-[400px] flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden m-4">
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
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow m-4">
                            {workflowState.setupStage === 'workflow_designing' ? (
                                <div className="h-full w-full flex flex-col items-center justify-center">
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
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                    <p>Please use the navigation controls above to move through the workflow stages.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    // Execution Phase Layout - Three Panel Design
                    <div className="flex h-full">
                        {/* Chat Panel */}
                        <div className="w-[400px] flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden m-4">
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

                        {/* Main Content Area */}
                        <div className="flex-1 flex">
                            {/* Workflow Steps List */}
                            <div className="w-[300px] bg-gray-800 shadow-sm m-4 mr-0 p-4 overflow-y-auto">
                                <h3 className="font-semibold text-gray-100 mb-4">Workflow Steps</h3>
                                <div className="space-y-2">
                                    {workflowSteps.map((step, index) => (
                                        <div
                                            key={step.id}
                                            className={`flex items-center p-3 cursor-pointer transition-all duration-200 ${index === workflowState.currentStepIndex
                                                ? 'bg-gray-900 border-l-4 border-blue-500 relative -mr-4 pr-8'
                                                : 'bg-gray-800'
                                                }`}
                                            onClick={() => setWorkflowState(prev => ({ ...prev, currentStepIndex: index }))}
                                        >
                                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${step.status === 'running' ? 'bg-blue-500 animate-pulse' :
                                                    step.status === 'completed' ? 'bg-green-500' :
                                                        step.status === 'failed' ? 'bg-red-500' :
                                                            'bg-gray-500'
                                                    }`} />
                                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{step.name}</span>
                                            </div>
                                            {index === workflowState.currentStepIndex && (
                                                <div className="ml-2 flex-shrink-0">
                                                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Current Step Details */}
                            <div className="w-[600px] bg-gray-900 shadow-sm m-4 ml-0 p-4 overflow-y-auto">
                                <div className="h-full">
                                    <h3 className="font-semibold text-gray-100 mb-4">Step Details</h3>
                                    {workflowState.currentStepIndex >= 0 && workflowSteps.length > 0 && workflowSteps[workflowState.currentStepIndex] && (
                                        <div className="space-y-4">
                                            {/* Step Description with Status */}
                                            <div className="p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-medium text-gray-100">
                                                        {workflowSteps[workflowState.currentStepIndex].name}
                                                    </h4>
                                                    <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-800">
                                                        <div className={`w-2 h-2 rounded-full ${workflowSteps[workflowState.currentStepIndex].status === 'running' ? 'bg-blue-500 animate-pulse' :
                                                            workflowSteps[workflowState.currentStepIndex].status === 'completed' ? 'bg-green-500' :
                                                                workflowSteps[workflowState.currentStepIndex].status === 'failed' ? 'bg-red-500' :
                                                                    'bg-gray-500'
                                                            }`} />
                                                        <span className="text-sm text-blue-700 dark:text-blue-300 capitalize">
                                                            {workflowSteps[workflowState.currentStepIndex].status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {workflowSteps[workflowState.currentStepIndex].description}
                                                </p>
                                            </div>

                                            {/* Asset Visualization */}
                                            {workflowState.executionStage === 'compiling_songs' && (
                                                <div className="p-8 flex flex-col items-center animate-pulse">
                                                    <div className="relative">
                                                        <svg className="w-16 h-16 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                        </svg>
                                                        <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping"></div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">Song List</div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {SAMPLE_ASSET_DATA.songList.totalSongs} songs across {SAMPLE_ASSET_DATA.songList.albums.length} albums
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {workflowState.executionStage === 'retrieving_lyrics' && (
                                                <div className="p-8 flex flex-col items-center animate-pulse">
                                                    <div className="relative">
                                                        <svg className="w-16 h-16 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping"></div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">Lyrics Database</div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            Processing lyrics: {SAMPLE_ASSET_DATA.lyricsDatabase.totalProcessed} of {SAMPLE_ASSET_DATA.lyricsDatabase.totalProcessed + SAMPLE_ASSET_DATA.lyricsDatabase.remainingToProcess}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {workflowState.executionStage === 'analyzing_lyrics' && (
                                                <div className="p-8 flex flex-col items-center animate-pulse">
                                                    <div className="relative">
                                                        <svg className="w-16 h-16 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                        </svg>
                                                        <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping"></div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">Analysis Results</div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            Found "love" in {SAMPLE_ASSET_DATA.analysis.songsWithLove} of {SAMPLE_ASSET_DATA.analysis.totalSongs} songs
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {workflowState.executionStage === 'tabulating_results' && (
                                                <div className="p-8 flex flex-col items-center animate-pulse">
                                                    <div className="relative">
                                                        <svg className="w-16 h-16 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping"></div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">Results Summary</div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            Generating final statistics and report...
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {workflowState.executionStage === 'workflow_complete' && (
                                                <div className="p-8 flex flex-col items-center">
                                                    <div className="relative">
                                                        <svg className="w-16 h-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 animate-ping"></div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">Final Results</div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {SAMPLE_ASSET_DATA.result.summary}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Side Panel with Palettes */}
                            <div className={`fixed right-0 top-0 h-full w-[400px] bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 transform ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                                <div className="h-full flex flex-col">
                                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Palettes</h3>
                                            <button
                                                onClick={() => setIsRightSidebarOpen(false)}
                                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        <div className="h-[70%]">
                                            <InformationPalette
                                                messages={messages}
                                                workflowInputs={workflowInputs}
                                                workflowSteps={workflowSteps}
                                                currentStepIndex={workflowState.currentStepIndex}
                                                stepDetails={stepDetails}
                                            />
                                        </div>
                                        <div className="h-[30%]">
                                            <ToolPalette
                                                tools={TOOL_TEMPLATES}
                                                currentStepIndex={workflowState.currentStepIndex}
                                                onAddStep={handleAddStep}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Toggle Button for Side Panel */}
                            <button
                                onClick={() => setIsRightSidebarOpen(true)}
                                className={`fixed right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-l-lg shadow-lg p-2 transition-all duration-300 z-50 ${isRightSidebarOpen ? 'translate-x-[400px]' : 'translate-x-0'}`}
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InteractiveWorkflowTest; 