import React from 'react';
import { ChatMessage, WorkflowStep, StepDetails } from './types';

interface InformationPaletteProps {
    messages: ChatMessage[];
    workflowInputs: Record<string, any>;
    workflowSteps: WorkflowStep[];
    currentStepIndex: number;
    stepDetails: Record<string, StepDetails>;
}

export const InformationPalette: React.FC<InformationPaletteProps> = ({
    messages,
    workflowInputs,
    workflowSteps,
    currentStepIndex,
    stepDetails
}) => {
    const accumulatedInfo: Record<string, any> = {};

    // Get improved question from messages
    const improvedQuestion = messages.find(m =>
        m.role === 'assistant' &&
        m.metadata?.phase === 'setup' &&
        m.metadata?.subPhase === 'question_development'
    )?.content;
    if (improvedQuestion) {
        accumulatedInfo['Improved Question'] = improvedQuestion;
    }

    // Add workflow inputs
    Object.entries(workflowInputs).forEach(([key, value]) => {
        accumulatedInfo[key] = value;
    });

    // Add completed steps' information
    workflowSteps.forEach((step, index) => {
        if (index <= currentStepIndex) {
            const currentStepDetails = stepDetails[step.id];
            if (currentStepDetails) {
                Object.entries(currentStepDetails.inputs).forEach(([key, value]) => {
                    accumulatedInfo[key] = value;
                });
                Object.entries(currentStepDetails.outputs).forEach(([key, value]) => {
                    accumulatedInfo[key] = value;
                });
            }
        }
    });

    return (
        <div className="h-full overflow-y-auto bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Information Palette
            </h3>
            <div className="space-y-4">
                {Object.entries(accumulatedInfo).map(([key, value]) => (
                    <div
                        key={key}
                        className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-blue-100 dark:border-blue-800"
                    >
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {key}
                        </h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {typeof value === 'object' ? (
                                <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(value, null, 2)}
                                </pre>
                            ) : (
                                String(value)
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}; 