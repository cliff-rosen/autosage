import React from 'react';
import { WorkflowStep, StepDetails, WorkspaceItem } from '../types/state';

interface WorkspaceSectionProps {
    steps: WorkflowStep[];
    stepDetails: Record<string, StepDetails>;
    currentStepId: string | null;
    workspaceItems: WorkspaceItem[];
    children?: React.ReactNode;
}

export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({
    steps,
    stepDetails,
    currentStepId,
    workspaceItems,
    children
}) => {
    const currentStep = currentStepId ? steps.find(step => step.id === currentStepId) : null;
    const currentStepDetails = currentStepId ? stepDetails[currentStepId] : null;

    return (
        <div className="h-full flex flex-col">
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Work Area
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {currentStep && (
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {currentStep.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {currentStep.description}
                        </p>
                        {currentStepDetails?.content && (
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {currentStepDetails.content}
                                </p>
                            </div>
                        )}
                    </div>
                )}
                {workspaceItems.map(item => (
                    <div
                        key={item.id}
                        className="mb-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            {item.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            {item.description}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${item.status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : item.status === 'failed'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                {item.status}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            {children}
        </div>
    );
};

export type { WorkspaceSectionProps }; 