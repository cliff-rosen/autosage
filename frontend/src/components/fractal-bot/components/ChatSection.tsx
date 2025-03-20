import React from 'react';
import { ChatPanel } from '../../interactive-workflow/ChatPanel';
import { ChatMessage, WorkflowPhase, SetupSubPhase, WorkflowStep } from '../../interactive-workflow/types';

interface ChatSectionProps {
    messages: ChatMessage[];
    inputMessage: string;
    isProcessing: boolean;
    currentPhase: WorkflowPhase;
    currentSubPhase: SetupSubPhase;
    currentStepIndex: number;
    workflowSteps: WorkflowStep[];
    isQuestionComplete: boolean;
    isWorkflowAgreed: boolean;
    onSendMessage: () => void;
    onInputChange: (value: string) => void;
    onCompleteWorkflow: () => void;
    onPhaseTransition: () => void;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
    messages,
    inputMessage,
    isProcessing,
    currentPhase,
    currentSubPhase,
    currentStepIndex,
    workflowSteps,
    isQuestionComplete,
    isWorkflowAgreed,
    onSendMessage,
    onInputChange,
    onCompleteWorkflow,
    onPhaseTransition
}) => {
    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <ChatPanel
                messages={messages}
                inputMessage={inputMessage}
                isProcessing={isProcessing}
                currentPhase={currentPhase}
                currentSubPhase={currentSubPhase}
                currentStepIndex={currentStepIndex}
                workflowSteps={workflowSteps}
                isQuestionComplete={isQuestionComplete}
                isWorkflowAgreed={isWorkflowAgreed}
                onSendMessage={onSendMessage}
                onInputChange={onInputChange}
                onCompleteWorkflow={onCompleteWorkflow}
                onPhaseTransition={onPhaseTransition}
            />
        </div>
    );
}; 