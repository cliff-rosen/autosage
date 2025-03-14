import React, { useState, useEffect, useRef } from 'react';

/**
 * Props for the AgentWorkflowStatusDisplay component
 */
interface AgentWorkflowStatusDisplayProps {
    // The current status object from the AgentWorkflowOrchestrator
    status: any;
    // Optional maximum height for the status display container
    maxHeight?: string;
    // Optional className for additional styling
    className?: string;
}

/**
 * Component that displays status updates from the AgentWorkflowOrchestrator
 * in a scrolling log format rather than replacing previous updates
 */
const AgentWorkflowStatusDisplay: React.FC<AgentWorkflowStatusDisplayProps> = ({
    status,
    maxHeight = '300px',
    className = '',
}) => {
    // State to store all status messages
    const [statusMessages, setStatusMessages] = useState<Array<{
        message: string;
        timestamp: string;
        type: 'info' | 'success' | 'error' | 'warning';
    }>>([]);

    // Ref to the status container for auto-scrolling
    const statusContainerRef = useRef<HTMLDivElement>(null);

    // Process the status object and add new messages when it changes
    useEffect(() => {
        if (!status) return;

        // Create a new message based on the status
        const newMessage = createMessageFromStatus(status);
        if (newMessage) {
            setStatusMessages(prev => [...prev, newMessage]);
        }
    }, [status]);

    // Auto-scroll to the bottom when new messages are added
    useEffect(() => {
        if (statusContainerRef.current) {
            statusContainerRef.current.scrollTop = statusContainerRef.current.scrollHeight;
        }
    }, [statusMessages]);

    // Helper function to create a message object from the status
    const createMessageFromStatus = (status: any): { message: string; timestamp: string; type: 'info' | 'success' | 'error' | 'warning' } | null => {
        if (!status) return null;

        const timestamp = new Date().toISOString();
        let message = '';
        let type: 'info' | 'success' | 'error' | 'warning' = 'info';

        // Determine the message and type based on the status
        if (status.error) {
            message = `Error: ${status.error}`;
            type = 'error';
        } else if (status.currentPhase === 'completed') {
            message = 'Workflow completed successfully';
            type = 'success';
        } else if (status.currentPhase === 'failed') {
            message = 'Workflow failed';
            type = 'error';
        } else if (status.currentWorkflowStatus?.state?.steps) {
            // Get the latest step status
            const steps = status.currentWorkflowStatus.state.steps;
            if (steps.length > 0) {
                const latestStep = steps[steps.length - 1];
                message = `[${status.currentPhase}] Step ${latestStep.id}: ${latestStep.name} - ${latestStep.status}`;

                if (latestStep.status === 'completed') {
                    type = 'success';
                } else if (latestStep.status === 'failed') {
                    type = 'error';
                } else {
                    type = 'info';
                }
            } else {
                message = `[${status.currentPhase}] Progress: ${status.progress}%`;
            }
        } else {
            message = `[${status.currentPhase}] Progress: ${status.progress}%`;
        }

        return { message, timestamp, type };
    };

    // Format the timestamp for display
    const formatTimestamp = (timestamp: string): string => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    };

    return (
        <div
            className={`bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
        >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 rounded-t-lg">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Workflow Status Updates</h3>
            </div>
            <div
                ref={statusContainerRef}
                className="p-3 overflow-y-auto font-mono text-sm"
                style={{ maxHeight }}
            >
                {statusMessages.length === 0 ? (
                    <div className="text-gray-500 dark:text-gray-400 italic">No status updates yet</div>
                ) : (
                    statusMessages.map((msg, index) => (
                        <div
                            key={index}
                            className={`mb-1 pb-1 border-b border-gray-100 dark:border-gray-800 ${msg.type === 'error' ? 'text-red-600 dark:text-red-400' :
                                msg.type === 'success' ? 'text-green-600 dark:text-green-400' :
                                    msg.type === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                                        'text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            <span className="text-gray-500 dark:text-gray-500 mr-2">[{formatTimestamp(msg.timestamp)}]</span>
                            {msg.message}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AgentWorkflowStatusDisplay; 