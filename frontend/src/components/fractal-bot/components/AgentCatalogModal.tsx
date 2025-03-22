import React from 'react';

interface AgentCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
    agents: {
        id: string;
        name: string;
        description: string;
        icon: string;
    }[];
}

const AGENT_CATEGORIES: AgentCategory[] = [
    {
        id: 'document',
        name: 'Document Processing',
        description: 'Agents for handling documents, text, and content',
        icon: '📄',
        agents: [
            {
                id: 'doc-merge',
                name: 'Document Merge',
                description: 'Merge multiple documents into a single cohesive document',
                icon: '📑'
            },
            {
                id: 'doc-analyze',
                name: 'Document Analysis',
                description: 'Analyze documents for key information and insights',
                icon: '🔍'
            },
            {
                id: 'fact-checker',
                name: 'Fact Checker',
                description: 'Verify and validate information across multiple sources',
                icon: '✅'
            }
        ]
    },
    {
        id: 'data',
        name: 'Data Processing',
        description: 'Agents for handling structured data and analytics',
        icon: '📊',
        agents: [
            {
                id: 'data-merge',
                name: 'Data Merge',
                description: 'Merge and deduplicate data from multiple sources',
                icon: '🔄'
            },
            {
                id: 'data-clean',
                name: 'Data Cleaning',
                description: 'Clean and standardize data for analysis',
                icon: '🧹'
            }
        ]
    },
    {
        id: 'communication',
        name: 'Communication',
        description: 'Agents for handling messages and notifications',
        icon: '💬',
        agents: [
            {
                id: 'email',
                name: 'Email Agent',
                description: 'Handle email communications and responses',
                icon: '📧'
            },
            {
                id: 'notification',
                name: 'Notification Agent',
                description: 'Manage and send notifications across platforms',
                icon: '🔔'
            }
        ]
    },
    {
        id: 'automation',
        name: 'Automation',
        description: 'Agents for automating repetitive tasks',
        icon: '⚡',
        agents: [
            {
                id: 'workflow',
                name: 'Workflow Automation',
                description: 'Automate complex workflows and processes',
                icon: '⚙️'
            },
            {
                id: 'scheduler',
                name: 'Task Scheduler',
                description: 'Schedule and manage recurring tasks',
                icon: '⏰'
            }
        ]
    }
];

interface AgentCatalogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectAgent: (agentId: string) => void;
}

export const AgentCatalogModal: React.FC<AgentCatalogModalProps> = ({
    isOpen,
    onClose,
    onSelectAgent
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex-none p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Agent Catalog
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 gap-6">
                        {AGENT_CATEGORIES.map(category => (
                            <div
                                key={category.id}
                                className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-2xl">{category.icon}</span>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                        {category.name}
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {category.description}
                                </p>
                                <div className="space-y-2">
                                    {category.agents.map(agent => (
                                        <button
                                            key={agent.id}
                                            onClick={() => onSelectAgent(agent.id)}
                                            className="w-full text-left p-3 rounded-md hover:bg-white dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{agent.icon}</span>
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {agent.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {agent.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}; 