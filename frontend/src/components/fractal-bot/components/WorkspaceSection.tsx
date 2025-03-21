import React from 'react';
import { WorkflowStep, StepDetails } from '../types/state';

interface WorkspaceSectionProps {
    steps: WorkflowStep[];
    stepDetails: Record<string, StepDetails>;
    currentStepId: string | null;
}

export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({
    steps,
    stepDetails,
    currentStepId,
}) => {
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Work Area</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                    {steps.map((step, index) => {
                        const isActive = step.id === currentStepId;
                        const isPast = index < (steps.findIndex(s => s.id === currentStepId) || 0);
                        const isFuture = index > (steps.findIndex(s => s.id === currentStepId) || 0);
                        const stepDetail = stepDetails[step.id];

                        return (
                            <div
                                key={step.id}
                                className={`border rounded-lg transition-all duration-200 ${isActive
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : isPast
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                        : isFuture
                                            ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
                                            : 'border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                <div
                                    className={`p-4 flex items-center justify-between cursor-pointer ${isActive || isPast
                                        ? 'text-gray-900 dark:text-gray-100'
                                        : 'text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className={`w-6 h-6 flex items-center justify-center rounded-full ${isActive
                                                ? 'bg-blue-500 text-white'
                                                : isPast
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-300 dark:bg-gray-600'
                                                }`}
                                        >
                                            {isPast ? (
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            ) : (
                                                <span>{index + 1}</span>
                                            )}
                                        </div>
                                        <span className="font-medium">{step.name}</span>
                                    </div>
                                    <span
                                        className={`text-sm ${step.status === 'completed'
                                            ? 'text-green-500'
                                            : step.status === 'running'
                                                ? 'text-blue-500'
                                                : step.status === 'failed'
                                                    ? 'text-red-500'
                                                    : 'text-gray-400'
                                            }`}
                                    >
                                        {step.status}
                                    </span>
                                </div>
                                {isActive && stepDetail && (
                                    <div className="px-4 pb-4">
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="prose dark:prose-invert max-w-none">
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    {step.description}
                                                </p>
                                                {stepDetail.content && (
                                                    <div className="mt-4">
                                                        <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                                                            <code>{stepDetail.content}</code>
                                                        </pre>
                                                    </div>
                                                )}
                                                {stepDetail.assets && stepDetail.assets.length > 0 && (
                                                    <div className="mt-4 space-y-2">
                                                        {stepDetail.assets.map((asset) => (
                                                            <div
                                                                key={asset.id}
                                                                className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow"
                                                            >
                                                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                                    {asset.name || asset.title}
                                                                </h4>
                                                                <div className="mt-2">
                                                                    {Array.isArray(asset.content) ? (
                                                                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                                                                            {asset.content.map(
                                                                                (item, index) => (
                                                                                    <li key={index}>
                                                                                        {item}
                                                                                    </li>
                                                                                )
                                                                            )}
                                                                        </ul>
                                                                    ) : (
                                                                        <pre className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                                                                            {JSON.stringify(
                                                                                asset.content,
                                                                                null,
                                                                                2
                                                                            )}
                                                                        </pre>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}; 