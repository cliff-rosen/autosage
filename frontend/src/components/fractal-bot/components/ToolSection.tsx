import React from 'react';
import { ToolPalette } from '../../interactive-workflow/ToolPalette';
import { ToolTemplate } from '../../interactive-workflow/types';

interface ToolSectionProps {
    tools: ToolTemplate[];
    currentStepIndex: number;
    onAddStep: (step: any) => void;
}

export const ToolSection: React.FC<ToolSectionProps> = ({
    tools,
    currentStepIndex,
    onAddStep
}) => {
    return (
        <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <ToolPalette
                tools={tools}
                currentStepIndex={currentStepIndex}
                onAddStep={onAddStep}
            />
        </div>
    );
}; 