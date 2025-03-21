import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from '../types/state';
import { MarkdownRenderer } from '../../common/MarkdownRenderer';

export interface ChatSectionProps {
    messages: ChatMessage[];
    inputMessage: string;
    isProcessing: boolean;
    onSendMessage: () => void;
    onInputChange: (message: string) => void;
    onActionButtonClick: (action: string) => void;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
    messages,
    inputMessage,
    isProcessing,
    onSendMessage,
    onInputChange,
    onActionButtonClick
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
        if (!localInputMessage.trim()) return;
        onSendMessage();
        setLocalInputMessage('');
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Chat
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                    {messages.map((message, index) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-4 ${message.role === 'assistant'
                                    ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
                                    : 'bg-blue-500 text-white'
                                    }`}
                            >
                                <div className={message.role === 'user' ? 'text-white' : ''}>
                                    <MarkdownRenderer content={message.content} />
                                </div>
                                {message.actionButton && (
                                    <button
                                        onClick={() => onActionButtonClick(message.actionButton!.action)}
                                        className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        {message.actionButton.label}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="flex-none p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={localInputMessage}
                        onChange={(e) => {
                            setLocalInputMessage(e.target.value);
                            onInputChange(e.target.value);
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isProcessing}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isProcessing || !localInputMessage.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Processing...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
}; 