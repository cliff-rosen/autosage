import React from 'react';
import { WorkflowStep, Stage } from '../types/state';

interface WorkflowNavigationProps {
    steps: WorkflowStep[];
    currentStepId: string | null;
    currentStage: Stage;
    onStepSelect: (stepId: string) => void;
    onNext: () => void;
    onBack: () => void;
    onRestart: () => void;
    isProcessing: boolean;
}

export const WorkflowNavigation: React.FC<WorkflowNavigationProps> = ({
    steps,
    currentStepId,
    currentStage,
    onStepSelect,
    onNext,
    onBack,
    onRestart,
    isProcessing
}) => {
    const isInitialStage = currentStage === 'initial';
    const isLastStage = currentStage === 'workflow_complete';

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <button
                    onClick={onBack}
                    disabled={isProcessing || isInitialStage}
                    className={`px-4 py-2 rounded-md font-medium ${isProcessing || isInitialStage
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                >
                    <div className="flex items-center">
                        <svg
                            className="w-5 h-5 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Back
                    </div>
                </button>

                <button
                    onClick={onNext}
                    disabled={isProcessing || isLastStage}
                    className={`px-4 py-2 rounded-md font-medium ${isProcessing || isLastStage
                        ? 'bg-blue-200 text-blue-500 cursor-not-allowed dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                        }`}
                >
                    <div className="flex items-center">
                        Next
                        <svg
                            className="w-5 h-5 ml-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </div>
                </button>
            </div>

            <div className="flex items-center">
                <button
                    onClick={onRestart}
                    disabled={isProcessing}
                    className={`px-4 py-2 rounded-md font-medium ${isProcessing
                        ? 'bg-red-200 text-red-500 cursor-not-allowed dark:bg-red-900 dark:text-red-300'
                        : 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                        }`}
                >
                    <div className="flex items-center">
                        <svg
                            className="w-5 h-5 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        Restart
                    </div>
                </button>
            </div>
        </div>
    );
}; 