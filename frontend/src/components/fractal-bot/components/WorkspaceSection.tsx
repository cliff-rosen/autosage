import React from 'react';
import { Task } from '../types/state';

export interface WorkspaceSectionProps {
    tasks: Task[];
}

export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({ tasks }) => {
    return (
        <div className="h-full flex flex-col">
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Tasks
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                    {tasks.map(task => (
                        <div
                            key={task.id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-base font-medium text-gray-900 dark:text-gray-100">
                                    {task.title}
                                </h4>
                                <span className={`px-2 py-1 text-xs rounded-full ${task.status === 'completed'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : task.status === 'error'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        : task.status === 'in_progress'
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                    }`}>
                                    {task.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {task.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}; 