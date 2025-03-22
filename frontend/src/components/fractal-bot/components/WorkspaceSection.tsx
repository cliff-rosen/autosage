import React, { useState } from 'react';
import { Agent } from '../types/state';
import { AgentCatalogModal } from './AgentCatalogModal';

export interface WorkspaceSectionProps {
    agents: Agent[];
}

export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({ agents }) => {
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);

    // Get the current agent (only in_progress)
    const currentAgent = agents.find(agent => agent.status === 'in_progress');

    // Get recently used agents (all completed agents, sorted by completion time)
    const recentlyUsedAgents = agents
        .filter(agent =>
            agent.status === 'completed' &&
            agent.title !== 'Fact Checker' // Exclude Fact Checker from recently used
        )
        .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime());

    // Get favorite agents (for demo, we'll just show some sample favorites)
    const favoriteAgents = agents.filter(agent =>
        agent.title === 'Fact Checker' &&
        agent.status !== 'in_progress' // Only exclude if it's currently in progress
    );

    const handleSelectAgent = (agentId: string) => {
        // TODO: Implement agent selection logic
        console.log('Selected agent:', agentId);
        setIsCatalogOpen(false);
    };

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
            {/* Header with Browse Button */}
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Agents
                    </h3>
                    <button
                        onClick={() => setIsCatalogOpen(true)}
                        className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200 flex items-center gap-2 group"
                    >
                        <svg
                            className="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                        </svg>
                        Browse Agents
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Current Agent Section */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Current Agent</h4>
                    <div className="space-y-2">
                        {currentAgent ? (
                            renderAgentCard(currentAgent)
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-[88px] flex items-center justify-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No agents currently in use
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recently Used Agents */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Recently Used
                    </h4>
                    <div className="space-y-2">
                        {recentlyUsedAgents.length > 0 ? (
                            recentlyUsedAgents.map(agent => renderAgentCard(agent))
                        ) : (
                            <div className="p-4 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 border border-dashed border-gray-200/50 dark:border-gray-700/50">
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                    Completed agents will appear here
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Favorite Agents Section */}
                <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Favorites</h4>
                    <div className="space-y-2">
                        {favoriteAgents.length > 0 ? (
                            favoriteAgents.map(agent => renderAgentCard(agent))
                        ) : (
                            <div className="p-4 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 border border-dashed border-gray-200/50 dark:border-gray-700/50">
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                    Favorite agents will appear here
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Agent Catalog Modal */}
            <AgentCatalogModal
                isOpen={isCatalogOpen}
                onClose={() => setIsCatalogOpen(false)}
                onSelectAgent={handleSelectAgent}
            />
        </div>
    );
}; 