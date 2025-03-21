import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatSection } from './components/ChatSection';
import { AssetsSection } from './components/AssetsSection';
import { WorkspaceSection } from './components/WorkspaceSection';
import { ToolsSection } from './components/ToolsSection';
import { WorkflowNavigation } from './components/WorkflowNavigation';
import {
    WorkflowStep,
    ChatMessage,
    StepDetails,
    WorkflowState,
    Stage,
    StageData,
    InformationAsset
} from './types/state';
import { FRACTAL_BOT_STATE } from './data/fractal_bot_data';

const FractalBot: React.FC = () => {
    const [currentStage, setCurrentStage] = useState<Stage>('initial');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [workflowState, setWorkflowState] = useState<WorkflowState>({
        phase: 'setup',
        currentStepIndex: 0,
        isProcessing: false
    });
    const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
    const [stepDetails, setStepDetails] = useState<Record<string, StepDetails>>({});
    const [isToolSearchOpen, setIsToolSearchOpen] = useState(false);
    const [isMoreToolsOpen, setIsMoreToolsOpen] = useState(false);
    const [toolSearchQuery, setToolSearchQuery] = useState('');

    // Initialize chat with initial stage messages
    useEffect(() => {
        const initialState = FRACTAL_BOT_STATE['initial'];
        setMessages(initialState.messages);
    }, []);

    // Handle state transitions
    const handleStateTransition = async (direction: 'forward' | 'backward' = 'forward') => {
        if (workflowState.isProcessing) return;

        setWorkflowState(prev => ({ ...prev, isProcessing: true }));

        try {
            const currentStageData = FRACTAL_BOT_STATE[currentStage];
            const nextStages = direction === 'forward' ? currentStageData.nextStages : currentStageData.prevStages;

            if (nextStages.length === 0) {
                setWorkflowState(prev => ({ ...prev, isProcessing: false }));
                return;
            }

            const nextStage = nextStages[0];
            const nextStageData = FRACTAL_BOT_STATE[nextStage];

            // Generate song list when transitioning to compiling_songs stage
            if (nextStage === 'compiling_songs' && direction === 'forward') {
                const songListStep: WorkflowStep = {
                    id: uuidv4(),
                    name: 'Generate Beatles Song List',
                    description: 'Create a comprehensive list of Beatles songs',
                    status: 'running',
                    agentType: 'user',
                    level: 0,
                    tools: []
                };

                // Add the step
                setWorkflowSteps(prev => [...prev, songListStep]);

                // Add step details
                setStepDetails(prev => ({
                    ...prev,
                    [songListStep.id]: {
                        id: songListStep.id,
                        status: 'running',
                        assets: [],
                        content: 'Generating Beatles song list...'
                    }
                }));

                // Simulate song list generation
                setTimeout(() => {
                    const songList: InformationAsset = {
                        id: 'beatlesSongList',
                        stepId: songListStep.id,
                        type: 'analysis_output',
                        name: 'Beatles Song List',
                        content: [
                            'Hey Jude',
                            'Let It Be',
                            'Yesterday',
                            'All You Need Is Love',
                            'Help!',
                            'Come Together',
                            'Here Comes the Sun',
                            'Something',
                            'While My Guitar Gently Weeps',
                            'A Day in the Life'
                        ],
                        metadata: {
                            timestamp: new Date().toISOString(),
                            tags: ['songs', 'beatles', 'list']
                        }
                    };

                    // Update step status and add asset
                    setStepDetails(prev => ({
                        ...prev,
                        [songListStep.id]: {
                            id: songListStep.id,
                            status: 'completed',
                            assets: [songList],
                            content: 'Beatles song list generated successfully.'
                        }
                    }));

                    // Update workflow step status
                    setWorkflowSteps(prev =>
                        prev.map(step =>
                            step.id === songListStep.id
                                ? { ...step, status: 'completed' }
                                : step
                        )
                    );
                }, 2000);
            }

            // Update messages based on direction
            if (direction === 'backward') {
                // When going backward, rebuild message history up to this point
                const messageHistory: ChatMessage[] = [];
                let stage: Stage = nextStage;

                while (stage) {
                    const stageData = FRACTAL_BOT_STATE[stage];
                    messageHistory.unshift(...stageData.messages);
                    stage = stageData.prevStages[0];
                }

                setMessages(messageHistory);
                setWorkflowSteps([]);
                setStepDetails({});
            } else {
                // When going forward, append new state data
                setMessages(prev => [...prev, ...nextStageData.messages]);
            }

            // Update phase if transitioning between setup and execution
            const isTransitioningToExecution =
                currentStage === 'workflow_ready' &&
                nextStage === 'workflow_started' &&
                direction === 'forward';

            setWorkflowState(prev => ({
                ...prev,
                phase: isTransitioningToExecution ? 'execution' : prev.phase,
                currentStepIndex: isTransitioningToExecution ? 0 : prev.currentStepIndex,
                isProcessing: false
            }));

            setCurrentStage(nextStage);

        } catch (error) {
            console.error('Error during state transition:', error);
            setWorkflowState(prev => ({ ...prev, isProcessing: false }));
        }
    };

    // Handle completing the workflow
    const handleCompleteWorkflow = () => {
        if (currentStage === 'workflow_ready') {
            handleStateTransition('forward');
        }
    };

    // Handle step selection
    const handleStepSelect = (stepId: string) => {
        const findStepIndex = (steps: WorkflowStep[], id: string): number => {
            for (let i = 0; i < steps.length; i++) {
                if (steps[i].id === id) return i;
                const subSteps = steps[i].subSteps || [];
                const subIndex = findStepIndex(subSteps, id);
                if (subIndex !== -1) return i;
            }
            return -1;
        };

        const steps = workflowSteps || [];
        const index = findStepIndex(steps, stepId);
        if (index !== -1) {
            setWorkflowState(prev => ({ ...prev, currentStepIndex: index }));
        }
    };

    // Handle restart
    const handleRestart = () => {
        const initialState = FRACTAL_BOT_STATE['initial'];

        setWorkflowState({
            phase: 'setup',
            currentStepIndex: 0,
            isProcessing: false
        });
        setCurrentStage('initial');
        setMessages(initialState.messages);
        setInputMessage('');
        setWorkflowSteps([]);
        setStepDetails({});
        setIsToolSearchOpen(false);
        setIsMoreToolsOpen(false);
        setToolSearchQuery('');
    };

    // Handle sending a message
    const handleSendMessage = () => {
        if (!inputMessage.trim()) return;

        // Create and add the user message
        const userMessage: ChatMessage = {
            id: uuidv4(),
            role: 'user',
            content: inputMessage,
            timestamp: new Date().toISOString(),
            metadata: {
                phase: workflowState.phase,
                type: 'question'
            }
        };

        // Add the message to the chat
        setMessages(prev => [...prev, userMessage]);

        // Clear the input
        setInputMessage('');

        // Trigger the state transition
        handleStateTransition('forward');
    };

    // Handle tool search
    const handleToolSearch = () => {
        setIsToolSearchOpen(true);
    };

    // Handle more tools
    const handleMoreTools = () => {
        setIsMoreToolsOpen(true);
    };

    // Handle search close
    const handleSearchClose = () => {
        setIsToolSearchOpen(false);
        setToolSearchQuery('');
    };

    // Handle more tools close
    const handleMoreToolsClose = () => {
        setIsMoreToolsOpen(false);
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    FractalBot Demonstration
                </h2>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden p-4 pb-2">
                {/* Chat */}
                <div className="w-1/4 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mr-4">
                    <ChatSection
                        messages={messages}
                        inputMessage={inputMessage}
                        isProcessing={workflowState.isProcessing}
                        currentPhase={workflowState.phase}
                        currentStepIndex={workflowState.currentStepIndex}
                        workflowSteps={workflowSteps}
                        isQuestionComplete={currentStage === 'workflow_ready'}
                        isWorkflowAgreed={currentStage === 'workflow_ready'}
                        onSendMessage={handleSendMessage}
                        onInputChange={setInputMessage}
                        onCompleteWorkflow={handleCompleteWorkflow}
                        onPhaseTransition={() => handleStateTransition('forward')}
                    />
                </div>

                {/* Assets */}
                <div className="w-1/4 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mr-4">
                    <AssetsSection
                        steps={workflowSteps}
                        stepDetails={stepDetails}
                        currentStepId={workflowSteps[workflowState.currentStepIndex]?.id || null}
                    />
                </div>

                {/* Work Area */}
                <div className="w-1/4 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mr-4">
                    <WorkspaceSection
                        steps={workflowSteps}
                        stepDetails={stepDetails}
                        currentStepId={workflowSteps[workflowState.currentStepIndex]?.id || null}
                    />
                </div>

                {/* Tools */}
                <div className="w-1/4 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <ToolsSection
                        currentStep={workflowSteps[workflowState.currentStepIndex] || null}
                        isToolSearchOpen={isToolSearchOpen}
                        isMoreToolsOpen={isMoreToolsOpen}
                        toolSearchQuery={toolSearchQuery}
                        onToolSearch={handleToolSearch}
                        onMoreTools={handleMoreTools}
                        onSearchClose={handleSearchClose}
                        onMoreToolsClose={handleMoreToolsClose}
                        onToolSearchQueryChange={setToolSearchQuery}
                    />
                </div>
            </div>

            {/* Navigation Controls - Full Width */}
            <div className="flex-none p-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <WorkflowNavigation
                    steps={workflowSteps}
                    currentStepId={workflowSteps[workflowState.currentStepIndex]?.id || null}
                    currentStage={currentStage}
                    onStepSelect={handleStepSelect}
                    onNext={() => handleStateTransition('forward')}
                    onBack={() => handleStateTransition('backward')}
                    onRestart={handleRestart}
                    isProcessing={workflowState.isProcessing}
                />
            </div>
        </div>
    );
};

export default FractalBot; 