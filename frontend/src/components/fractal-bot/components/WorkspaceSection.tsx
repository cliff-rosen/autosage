import React from 'react';
import { FractalWorkflowVisualizer } from '../../interactive-workflow/FractalWorkflowVisualizer';
import { WorkflowStep, StepDetails } from '../../interactive-workflow/types';

interface WorkspaceSectionProps {
    steps: WorkflowStep[];
    stepDetails: Record<string, StepDetails>;
    currentStepId: string | null;
    onStepSelect: (stepId: string) => void;
    onAddSubStep: (parentId: string) => void;
}

export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({
    steps,
    stepDetails,
    currentStepId,
    onStepSelect,
    onAddSubStep
}) => {
    return (
        <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <FractalWorkflowVisualizer
                steps={steps}
                stepDetails={stepDetails}
                currentStepId={currentStepId}
                onStepSelect={onStepSelect}
                onAddSubStep={onAddSubStep}
            />
        </div>
    );
}; 