import React from 'react';
import { WorkflowStep } from '../types/state';

interface Tool {
    id: string;
    name: string;
    description: string;
    category: string;
    icon?: string;
}

interface ToolsSectionProps {
    currentStep: WorkflowStep | null;
    isToolSearchOpen: boolean;
    isMoreToolsOpen: boolean;
    toolSearchQuery: string;
    onToolSearch: () => void;
    onMoreTools: () => void;
    onSearchClose: () => void;
    onMoreToolsClose: () => void;
    onToolSearchQueryChange: (query: string) => void;
}

const TOOL_CATEGORIES = [
    { id: 'analysis', name: 'Analysis', icon: '📊' },
    { id: 'data', name: 'Data Processing', icon: '🔄' },
    { id: 'visualization', name: 'Visualization', icon: '📈' },
    { id: 'nlp', name: 'Natural Language', icon: '📝' },
    { id: 'ml', name: 'Machine Learning', icon: '🤖' },
    { id: 'utilities', name: 'Utilities', icon: '🛠️' },
];

const SAMPLE_TOOLS: Tool[] = [
    {
        id: 'text-analysis',
        name: 'Text Analysis',
        description: 'Analyze text content for sentiment, entities, and more',
        category: 'analysis',
    },
    {
        id: 'data-cleaning',
        name: 'Data Cleaning',
        description: 'Clean and preprocess data for analysis',
        category: 'data',
    },
    {
        id: 'chart-generator',
        name: 'Chart Generator',
        description: 'Generate various types of charts and visualizations',
        category: 'visualization',
    },
];

export const ToolsSection: React.FC<ToolsSectionProps> = ({
    currentStep,
    isToolSearchOpen,
    isMoreToolsOpen,
    toolSearchQuery,
    onToolSearch,
    onMoreTools,
    onSearchClose,
    onMoreToolsClose,
    onToolSearchQueryChange,
}) => {
    const filteredTools = SAMPLE_TOOLS.filter((tool) =>
        tool.name.toLowerCase().includes(toolSearchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tools</h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={onToolSearch}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </button>
                        <button
                            onClick={onMoreTools}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {currentStep?.tools && currentStep.tools.length > 0 ? (
                    <div className="space-y-2">
                        {currentStep.tools.map((tool) => (
                            <div
                                key={tool.id}
                                className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow"
                            >
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                    {tool.name}
                                </h4>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {tool.description}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No tools available for this step
                    </p>
                )}
            </div>

            {/* Tool Search Modal */}
            {isToolSearchOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Search Tools
                                </h3>
                                <button
                                    onClick={onSearchClose}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                            <input
                                type="text"
                                value={toolSearchQuery}
                                onChange={(e) => onToolSearchQueryChange(e.target.value)}
                                placeholder="Search tools..."
                                className="mt-4 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                            />
                        </div>
                        <div className="p-4 max-h-96 overflow-y-auto">
                            {filteredTools.map((tool) => (
                                <div
                                    key={tool.id}
                                    className="p-3 mb-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                >
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                        {tool.name}
                                    </h4>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        {tool.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* More Tools Modal */}
            {isMoreToolsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Tool Categories
                                </h3>
                                <button
                                    onClick={onMoreToolsClose}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-2 gap-4">
                                {TOOL_CATEGORIES.map((category) => (
                                    <button
                                        key={category.id}
                                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{category.icon}</span>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                    {category.name}
                                                </h4>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 