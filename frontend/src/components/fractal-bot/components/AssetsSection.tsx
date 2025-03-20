import React from 'react';
import { InformationAssetPalette } from '../../interactive-workflow/InformationAssetPalette';
import { WorkflowStep, StepDetails } from '../../interactive-workflow/types';

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
    return (
        <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <InformationAssetPalette
                steps={steps}
                stepDetails={stepDetails}
                currentStepId={currentStepId}
            />
        </div>
    );
}; 