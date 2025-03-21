import React, { useState, useEffect, useCallback } from 'react';
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
    InformationAsset,
    WorkspaceItem
} from './types/state';
import { demoStates } from './data/fractal_bot_data';

const FractalBot: React.FC = () => {
    const [currentStateIndex, setCurrentStateIndex] = useState<number>(0);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [workflowState, setWorkflowState] = useState<WorkflowState>({
        phase: 'setup',
        currentStepIndex: 0,
        isProcessing: false
    });
    const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
    const [stepDetails, setStepDetails] = useState<Record<string, StepDetails>>({});
    const [assets, setAssets] = useState<InformationAsset[]>([]);
    const [workspaceItems, setWorkspaceItems] = useState<WorkspaceItem[]>([]);
    const [isToolSearchOpen, setIsToolSearchOpen] = useState(false);
    const [isMoreToolsOpen, setIsMoreToolsOpen] = useState(false);
    const [toolSearchQuery, setToolSearchQuery] = useState('');

    // Initialize with initial state
    useEffect(() => {
        const initialState = demoStates[0];
        setMessages(initialState.addedMessages);
        setWorkflowState(prev => ({ ...prev, phase: initialState.phase }));
    }, []);

    // Get current step data
    const getCurrentStepData = useCallback(() => {
        if (!workflowSteps.length || workflowState.currentStepIndex < 0) return null;

        const step = workflowSteps[workflowState.currentStepIndex];
        if (!step) return null;

        const details = stepDetails[step.id];
        return {
            id: step.id,
            name: step.name,
            description: step.description,
            status: step.status,
            content: details?.content
        };
    }, [workflowSteps, workflowState.currentStepIndex, stepDetails]);

    // Get previous step data
    const getPreviousStepData = useCallback(() => {
        if (!workflowSteps.length || workflowState.currentStepIndex <= 0) return undefined;

        const prevStep = workflowSteps[workflowState.currentStepIndex - 1];
        if (!prevStep) return undefined;

        const details = stepDetails[prevStep.id];
        return {
            id: prevStep.id,
            name: prevStep.name,
            description: prevStep.description,
            status: prevStep.status as 'completed' | 'error',
            content: details?.content
        };
    }, [workflowSteps, workflowState.currentStepIndex, stepDetails]);

    // Get current work items
    const getCurrentWorkItems = useCallback(() => {
        if (!workflowSteps.length || workflowState.currentStepIndex < 0) return [];

        const currentStep = workflowSteps[workflowState.currentStepIndex];
        if (!currentStep) return [];

        return workspaceItems.filter(item =>
            item.stepId === currentStep.id ||
            (workflowState.currentStepIndex > 0 && item.stepId === workflowSteps[workflowState.currentStepIndex - 1].id)
        );
    }, [workflowSteps, workflowState.currentStepIndex, workspaceItems]);

    // Handle state transitions
    const handleStateTransition = async (direction: 'forward' | 'backward' = 'forward') => {
        if (workflowState.isProcessing) return;

        setWorkflowState(prev => ({ ...prev, isProcessing: true }));

        try {
            const nextIndex = direction === 'forward'
                ? Math.min(currentStateIndex + 1, demoStates.length - 1)
                : Math.max(currentStateIndex - 1, 0);

            if (nextIndex === currentStateIndex) {
                setWorkflowState(prev => ({ ...prev, isProcessing: false }));
                return;
            }

            const currentState = demoStates[currentStateIndex];
            const nextState = demoStates[nextIndex];

            if (direction === 'backward') {
                // When going backward, rebuild state up to this point
                const messageHistory: ChatMessage[] = [];
                const assetHistory: InformationAsset[] = [];
                const workspaceHistory: WorkspaceItem[] = [];
                let steps: WorkflowStep[] = [];
                let details: Record<string, StepDetails> = {};

                // Rebuild state by accumulating changes up to the target index
                for (let i = 0; i <= nextIndex; i++) {
                    const state = demoStates[i];
                    messageHistory.push(...state.addedMessages);
                    assetHistory.push(...state.addedAssets);
                    workspaceHistory.push(...state.addedWorkspaceItems);

                    if (state.workflowSteps) {
                        steps = state.workflowSteps;
                    }
                    if (state.stepDetails) {
                        details = { ...details, ...state.stepDetails };
                    }
                }

                setMessages(messageHistory);
                setAssets(assetHistory);
                setWorkspaceItems(workspaceHistory);
                setWorkflowSteps(steps);
                setStepDetails(details);
            } else {
                // When going forward, append new state data
                setMessages(prev => [...prev, ...nextState.addedMessages]);
                setAssets(prev => [...prev, ...nextState.addedAssets]);
                setWorkspaceItems(prev => [...prev, ...nextState.addedWorkspaceItems]);

                if (nextState.workflowSteps) {
                    setWorkflowSteps(nextState.workflowSteps);
                }
                if (nextState.stepDetails) {
                    setStepDetails(prev => ({ ...prev, ...nextState.stepDetails }));
                }
            }

            // Update phase
            setWorkflowState(prev => ({
                ...prev,
                phase: nextState.phase,
                currentStepIndex: nextState.workflowSteps ? nextState.workflowSteps.length - 1 : 0,
                isProcessing: false
            }));

            setCurrentStateIndex(nextIndex);

        } catch (error) {
            console.error('Error during state transition:', error);
            setWorkflowState(prev => ({ ...prev, isProcessing: false }));
        }
    };

    // Handle completing the workflow
    const handleCompleteWorkflow = () => {
        const currentState = demoStates[currentStateIndex];
        if (currentState.stage === 'workflow_ready') {
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
        const initialState = demoStates[0];
        setCurrentStateIndex(0);
        setWorkflowState({
            phase: initialState.phase,
            currentStepIndex: 0,
            isProcessing: false
        });
        setMessages(initialState.addedMessages);
        setAssets([]);
        setWorkspaceItems([]);
        setWorkflowSteps([]);
        setStepDetails({});
        setInputMessage('');
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

    // Handle file upload
    const handleFileUpload = useCallback((file: File) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target?.result;
            const newAsset: InformationAsset = {
                id: uuidv4(),
                type: 'data',
                name: file.name,
                content: content,
                metadata: {
                    timestamp: new Date().toISOString(),
                    tags: ['uploaded', file.type],
                }
            };

            setAssets(prev => [...prev, newAsset]);
        };

        reader.readAsText(file);
    }, []);

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
                <div className="w-[400px] flex-shrink-0 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mr-4">
                    <ChatSection
                        messages={messages}
                        inputMessage={inputMessage}
                        isProcessing={workflowState.isProcessing}
                        currentPhase={workflowState.phase}
                        currentStepIndex={workflowState.currentStepIndex}
                        workflowSteps={workflowSteps}
                        isQuestionComplete={demoStates[currentStateIndex].stage === 'workflow_ready'}
                        isWorkflowAgreed={demoStates[currentStateIndex].stage === 'workflow_ready'}
                        onSendMessage={handleSendMessage}
                        onInputChange={setInputMessage}
                        onCompleteWorkflow={handleCompleteWorkflow}
                        onPhaseTransition={() => handleStateTransition('forward')}
                    />
                </div>

                {/* Assets */}
                <div className="w-[400px] flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mr-4">
                    <AssetsSection
                        assets={assets}
                        currentStepId={workflowSteps[workflowState.currentStepIndex]?.id || null}
                        onUpload={handleFileUpload}
                    />
                </div>

                {/* Work Area with Tools */}
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="flex-1 overflow-hidden">
                        <WorkspaceSection
                            currentStep={getCurrentStepData()}
                            previousStep={getPreviousStepData()}
                            workItems={getCurrentWorkItems()}
                        >
                            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                <ToolsSection
                                    currentStep={workflowSteps[workflowState.currentStepIndex] || null}
                                    isToolSearchOpen={isToolSearchOpen}
                                    isMoreToolsOpen={isMoreToolsOpen}
                                    toolSearchQuery={toolSearchQuery}
                                    onToolSearch={() => setIsToolSearchOpen(true)}
                                    onMoreTools={() => setIsMoreToolsOpen(true)}
                                    onSearchClose={() => setIsToolSearchOpen(false)}
                                    onMoreToolsClose={() => setIsMoreToolsOpen(false)}
                                    onToolSearchQueryChange={setToolSearchQuery}
                                />
                            </div>
                        </WorkspaceSection>
                    </div>
                </div>
            </div>

            {/* Navigation Controls - Full Width */}
            <div className="flex-none p-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <WorkflowNavigation
                    steps={workflowSteps}
                    currentStepId={workflowSteps[workflowState.currentStepIndex]?.id || null}
                    currentStage={demoStates[currentStateIndex].stage}
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