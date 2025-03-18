import React, { useRef, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, WorkflowPhase, SetupSubPhase, WorkflowStep } from './types';

interface ChatPanelProps {
    messages: ChatMessage[];
    inputMessage: string;
    isProcessing: boolean;
    currentPhase: WorkflowPhase;
    currentSubPhase: SetupSubPhase;
    currentStepIndex: number;
    workflowSteps: WorkflowStep[];
    isQuestionComplete: boolean;
    isWorkflowAgreed: boolean;
    onSendMessage: (message: ChatMessage) => void;
    onInputChange: (value: string) => void;
    onCompleteWorkflow: () => void;
    onPhaseTransition: (response: ChatMessage) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [localInputMessage, setLocalInputMessage] = useState(inputMessage);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        setLocalInputMessage(inputMessage);
    }, [inputMessage]);

    const handleSendMessage = () => {
        if (!inputMessage.trim()) return;

        // Send the user's actual message
        onSendMessage({
            id: uuidv4(),
            role: 'user',
            content: inputMessage,
            timestamp: new Date().toISOString(),
            metadata: {
                phase: currentPhase,
                subPhase: currentSubPhase,
                type: getMessageType()
            }
        });

        // Clear the input after sending
        setLocalInputMessage('');
        onInputChange('');
    };

    // Determine message type based on current phase
    const getMessageType = (): 'question' | 'clarification' | 'workflow' | 'result' => {
        switch (currentPhase) {
            case 'setup':
                return 'question';
            case 'execution':
                return 'result';
            default:
                return 'clarification';
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Chat Header */}
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {currentPhase === 'execution' && currentStepIndex >= 0
                        ? `Step ${currentStepIndex + 1}: ${workflowSteps[currentStepIndex]?.name}`
                        : currentPhase === 'setup'
                            ? 'AutoSage'
                            : 'Execution'}
                </h3>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                }`}
                        >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <div className="mt-1 text-xs opacity-70">
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="flex-none p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={localInputMessage}
                        onChange={(e) => {
                            setLocalInputMessage(e.target.value);
                            onInputChange(e.target.value);
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message..."
                        disabled={isProcessing}
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isProcessing || !localInputMessage.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Processing...' : 'Send'}
                    </button>
                    {currentPhase === 'setup' && currentSubPhase === 'question_development' && isQuestionComplete && (
                        <button
                            onClick={onCompleteWorkflow}
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            Develop Workflow
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}; 