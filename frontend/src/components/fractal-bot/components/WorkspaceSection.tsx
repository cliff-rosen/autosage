import React from 'react';
import { Agent } from '../types/state';

export interface WorkspaceSectionProps {
    agents: Agent[];
}

export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({ agents }) => {
    // Get the current agent (only in_progress)
    const currentAgent = agents.find(agent => agent.status === 'in_progress');

    // Get recently used agents (all completed agents, sorted by completion time)
    const recentlyUsedAgents = agents
        .filter(agent => agent.status === 'completed')
        .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime());

    // Get favorite agents (for demo, we'll just show some sample favorites)
    const favoriteAgents = agents.filter(agent =>
        ['Document Merge Agent', 'Contact Merge Agent'].includes(agent.title) &&
        agent.status !== 'in_progress' && // Exclude current agent from favorites
        !recentlyUsedAgents.some(recent => recent.id === agent.id) // Exclude recently used agents
    );

    const renderAgentCard = (agent: Agent) => (
        <div
            key={agent.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 relative
                      ${agent.status === 'in_progress' ? 'animate-glow-pulse' : ''}`}
        >
            {agent.status === 'in_progress' && (
                <div className="absolute bottom-0 left-0 right-0 h-1">
                    <div className="h-full bg-blue-500 dark:bg-blue-400 animate-workflow-progress"></div>
                </div>
            )}

            <div className="flex items-center justify-between mb-2">
                <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    {agent.title}
                    {agent.status === 'in_progress' && (
                        <div className="animate-flowing-dot text-blue-500">●</div>
                    )}
                </h4>
                <span className={`px-2 py-1 text-xs rounded-full ${agent.status === 'completed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : agent.status === 'error'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : agent.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                    {agent.status}
                </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
                {agent.description}
            </p>
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            {/* Header with Search/Browse */}
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Agents
                    </h3>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            Search
                        </button>
                        <button className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            Browse
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Current Agent Section */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Current Agent</h4>
                    {currentAgent ? (
                        renderAgentCard(currentAgent)
                    ) : (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">No agents currently in use</p>
                        </div>
                    )}
                </div>

                {/* Recently Used Agents Section */}
                {recentlyUsedAgents.length > 0 && (
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Recently Used</h4>
                        <div className="space-y-3">
                            {recentlyUsedAgents.map(renderAgentCard)}
                        </div>
                    </div>
                )}

                {/* Favorite Agents Section */}
                {favoriteAgents.length > 0 && (
                    <div className="p-4">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Favorites</h4>
                        <div className="space-y-3">
                            {favoriteAgents.map(renderAgentCard)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}; 