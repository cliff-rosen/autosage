import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatSection } from './components/ChatSection';
import { AssetsSection } from './components/AssetsSection';
import { WorkspaceSection } from './components/WorkspaceSection';
import { ToolSection } from './components/ToolSection';
import WorkflowNavigation from '../interactive-workflow/WorkflowNavigation';
import {
    WorkflowStep,
    ChatMessage,
    StepDetails,
    WorkflowState,
    SetupStage,
    ExecutionStage,
    WorkflowPhase,
    SetupSubPhase
} from '../interactive-workflow/types';
import {
    TOOL_TEMPLATES,
    SAMPLE_STEP_DETAILS,
    SAMPLE_WORKFLOW_STEPS
} from '../interactive-workflow/workflow_data_sample';
import { FRACTAL_BOT_MESSAGES, Stage } from './data/fractal_bot_data';

const FractalBot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [workflowState, setWorkflowState] = useState<WorkflowState>({
        phase: 'setup',
        setupStage: 'initial',
        executionStage: 'workflow_started',
        currentStepIndex: 0,
        isProcessing: false
    });
    const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
    const [stepDetails, setStepDetails] = useState<Record<string, StepDetails>>(SAMPLE_STEP_DETAILS);

    // Initialize chat with initial stage messages
    useEffect(() => {
        const initialMessages = FRACTAL_BOT_MESSAGES['initial'];
        setMessages(initialMessages || []);
    }, []);

    // Helper function to get messages for a stage
    const getStageMessages = (stage: Stage): ChatMessage[] => {
        const messages = FRACTAL_BOT_MESSAGES[stage];
        return messages || [];
    };

    // Helper function to map SetupStage to SetupSubPhase
    const getSubPhaseFromStage = (stage: SetupStage): SetupSubPhase => {
        switch (stage) {
            case 'initial':
            case 'question_received':
            case 'clarification_requested':
            case 'request_confirmation':
                return 'question_development';
            case 'workflow_designing':
                return 'workflow_designing';
            case 'workflow_ready':
                return 'workflow_ready';
            default:
                return 'question_development';
        }
    };

    // Handle state transitions
    const handleStateTransition = async (direction: 'forward' | 'backward' = 'forward') => {
        if (workflowState.isProcessing) return;

        setWorkflowState(prev => ({ ...prev, isProcessing: true }));

        try {
            const currentPhase = workflowState.phase;
            const setupStages: SetupStage[] = ['initial', 'question_received', 'clarification_requested', 'request_confirmation', 'workflow_designing', 'workflow_explanation', 'workflow_ready'];
            const executionStages: ExecutionStage[] = ['workflow_started', 'compiling_songs', 'retrieving_lyrics', 'analyzing_lyrics', 'tabulating_results', 'workflow_complete'];

            const stages = currentPhase === 'setup' ? setupStages : executionStages;
            const currentStage = currentPhase === 'setup' ? workflowState.setupStage : workflowState.executionStage;
            const currentIndex = stages.indexOf(currentStage);
            const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;

            // Check if transition is valid
            if (nextIndex < 0 || nextIndex >= stages.length) return;

            const nextStage = stages[nextIndex];

            // Update messages for the new stage
            if (currentPhase === 'setup') {
                const setupStage = nextStage as SetupStage;

                if (direction === 'backward') {
                    // When going backward, rebuild message history up to this point
                    const messageHistory: ChatMessage[] = [];
                    for (let i = 0; i <= nextIndex; i++) {
                        const stageMessages = getStageMessages(stages[i] as SetupStage);
                        messageHistory.push(...stageMessages);
                    }
                    setMessages(messageHistory);
                } else {
                    // When going forward, append new messages
                    const stageMessages = getStageMessages(setupStage);
                    setMessages(prev => [...prev, ...stageMessages]);
                }

                // Initialize workflow steps when entering design or explanation stages
                if (setupStage === 'workflow_designing' || setupStage === 'workflow_explanation') {
                    setWorkflowSteps(SAMPLE_WORKFLOW_STEPS);
                }

                // Transition to execution phase if moving forward from workflow_ready
                if (setupStage === 'workflow_ready' && direction === 'forward') {
                    setWorkflowState(prev => ({
                        ...prev,
                        phase: 'execution',
                        executionStage: 'workflow_started',
                        setupStage,
                        currentStepIndex: 0,
                        isProcessing: false
                    }));
                    return;
                }

                // Update setup stage
                setWorkflowState(prev => ({
                    ...prev,
                    setupStage,
                    isProcessing: false
                }));
            } else {
                const executionStage = nextStage as ExecutionStage;

                if (direction === 'backward') {
                    // When going backward in execution phase, rebuild message history
                    const setupMessages: ChatMessage[] = [];
                    for (const stage of setupStages) {
                        setupMessages.push(...getStageMessages(stage));
                    }
                    const executionMessages: ChatMessage[] = [];
                    for (let i = 0; i <= nextIndex; i++) {
                        executionMessages.push(...getStageMessages(executionStages[i]));
                    }
                    setMessages([...setupMessages, ...executionMessages]);
                } else {
                    // When going forward, append new messages
                    const stageMessages = getStageMessages(executionStage);
                    setMessages(prev => [...prev, ...stageMessages]);
                }

                // Update execution stage
                setWorkflowState(prev => ({
                    ...prev,
                    executionStage,
                    currentStepIndex: direction === 'forward' ? prev.currentStepIndex + 1 : prev.currentStepIndex - 1,
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

    // Handle adding a new step
    const handleAddStep = (newStep: WorkflowStep) => {
        setWorkflowSteps(prev => {
            const newSteps = [...prev];
            newSteps.splice(workflowState.currentStepIndex + 1, 0, newStep);
            return newSteps;
        });

        const newStepDetails: StepDetails = {
            inputs: {},
            outputs: {},
            status: 'pending',
            progress: 0,
            assets: []
        };

        setStepDetails(prev => ({
            ...prev,
            [newStep.id]: newStepDetails
        }));
    };

    // Handle adding a sub-step
    const handleAddSubStep = (parentId: string) => {
        const newStep: WorkflowStep = {
            id: uuidv4(),
            name: 'New Sub-step',
            description: 'Description of the new sub-step',
            status: 'pending',
            agentType: 'user',
            parentId,
            level: 1,
            tools: []
        };

        setWorkflowSteps(prev => {
            const newSteps = [...prev];
            const parentIndex = newSteps.findIndex(step => step.id === parentId);
            if (parentIndex !== -1) {
                if (!newSteps[parentIndex].subSteps) {
                    newSteps[parentIndex].subSteps = [];
                }
                newSteps[parentIndex].subSteps.push(newStep);
            }
            return newSteps;
        });

        const newStepDetails: StepDetails = {
            inputs: {},
            outputs: {},
            status: 'pending',
            progress: 0,
            assets: []
        };

        setStepDetails(prev => ({
            ...prev,
            [newStep.id]: newStepDetails
        }));
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
        setWorkflowState({
            phase: 'setup',
            setupStage: 'initial',
            executionStage: 'workflow_started',
            currentStepIndex: 0,
            isProcessing: false
        });
        setMessages([]);
        setInputMessage('');
        setWorkflowSteps([]);
        setStepDetails(SAMPLE_STEP_DETAILS);
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
                subPhase: getSubPhaseFromStage(workflowState.setupStage),
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
                        currentSubPhase={getSubPhaseFromStage(workflowState.setupStage)}
                        currentStepIndex={workflowState.currentStepIndex}
                        workflowSteps={workflowSteps}
                        isQuestionComplete={workflowState.setupStage === 'workflow_ready'}
                        isWorkflowAgreed={workflowState.setupStage === 'workflow_ready'}
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

                {/* Workspace */}
                <div className="w-1/4 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mr-4">
                    <WorkspaceSection
                        steps={workflowSteps}
                        stepDetails={stepDetails}
                        currentStepId={workflowSteps[workflowState.currentStepIndex]?.id || null}
                        onStepSelect={handleStepSelect}
                        onAddSubStep={handleAddSubStep}
                    />
                </div>

                {/* Tools */}
                <div className="w-1/4 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <ToolSection
                        tools={TOOL_TEMPLATES}
                        currentStepIndex={workflowState.currentStepIndex}
                        onAddStep={handleAddStep}
                    />
                </div>
            </div>

            {/* Navigation Controls - Full Width */}
            <div className="flex-none p-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <WorkflowNavigation
                    phase={workflowState.phase}
                    setupStage={workflowState.setupStage}
                    executionStage={workflowState.executionStage}
                    isProcessing={workflowState.isProcessing}
                    onNext={() => handleStateTransition('forward')}
                    onBack={() => handleStateTransition('backward')}
                    onRestart={handleRestart}
                />
            </div>
        </div>
    );
};

export default FractalBot; 