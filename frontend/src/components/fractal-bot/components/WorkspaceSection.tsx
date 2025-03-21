import React from 'react';
import { Agent } from '../types/state';

export interface WorkspaceSectionProps {
    agents: Agent[];
}

export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({ agents }) => {
    return (
        <div className="h-full flex flex-col">
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Agents
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                    {agents.map(agent => (
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
                    ))}
                </div>
            </div>
        </div>
    );
}; 