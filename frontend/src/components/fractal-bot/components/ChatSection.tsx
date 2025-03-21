import React from 'react';
import { ChatMessage, WorkflowStep } from '../types/state';

interface ChatSectionProps {
    messages: ChatMessage[];
    inputMessage: string;
    isProcessing: boolean;
    currentPhase: 'setup' | 'execution';
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
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`mb-4 ${message.role === 'assistant'
                            ? 'bg-blue-50 dark:bg-blue-900 rounded-lg p-3'
                            : 'bg-gray-50 dark:bg-gray-700 rounded-lg p-3'
                            }`}
                    >
                        <p className="text-sm text-gray-900 dark:text-gray-100">{message.content}</p>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                        placeholder="Type your message..."
                        value={inputMessage}
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                onSendMessage();
                            }
                        }}
                    />
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={onSendMessage}
                        disabled={isProcessing}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}; 