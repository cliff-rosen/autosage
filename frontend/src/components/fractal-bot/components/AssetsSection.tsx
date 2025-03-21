import React from 'react';
import { WorkflowStep, StepDetails } from '../types/state';

interface AssetsSectionProps {
    steps: WorkflowStep[];
    stepDetails: Record<string, StepDetails>;
    currentStepId: string | null;
}

export const AssetsSection: React.FC<AssetsSectionProps> = ({
    steps,
    stepDetails,
    currentStepId
}) => {
    const currentStep = currentStepId ? steps.find(step => step.id === currentStepId) : null;
    const currentStepAssets = currentStepId ? stepDetails[currentStepId]?.assets || [] : [];

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assets</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {currentStep && (
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {currentStep.name}
                        </h4>
                        {currentStepAssets.length > 0 ? (
                            <div className="space-y-2">
                                {currentStepAssets.map((asset) => (
                                    <div
                                        key={asset.id}
                                        className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {asset.name || asset.title}
                                            </h5>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {asset.type}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            {Array.isArray(asset.content) ? (
                                                <ul className="list-disc list-inside">
                                                    {asset.content.map((item, index) => (
                                                        <li key={index}>{item}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <pre className="whitespace-pre-wrap">
                                                    {JSON.stringify(asset.content, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                        {asset.metadata?.tags && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {asset.metadata.tags.map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                No assets available for this step
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}; 