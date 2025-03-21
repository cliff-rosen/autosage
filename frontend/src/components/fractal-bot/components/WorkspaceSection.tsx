import React, { useState, useEffect, useRef } from 'react';
import { WorkflowStep, StepDetails, WorkspaceItem } from '../types/state';

interface WorkspaceSectionProps {
    currentStep: {
        id: string;
        name: string;
        description: string;
        status: 'pending' | 'running' | 'completed' | 'error';
        content?: string;
    } | null;
    previousStep?: {
        id: string;
        name: string;
        description: string;
        status: 'completed' | 'error';
        content?: string;
    };
    workItems: WorkspaceItem[];
    children?: React.ReactNode;
}

export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({
    currentStep,
    previousStep,
    workItems,
    children
}) => {
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Check if we should show the scroll indicator
    useEffect(() => {
        const checkScroll = () => {
            if (scrollContainerRef.current) {
                const { scrollTop } = scrollContainerRef.current;
                setShowScrollIndicator(scrollTop < 10 && previousStep !== undefined);
            }
        };

        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', checkScroll);
            checkScroll(); // Initial check
        }

        return () => {
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', checkScroll);
            }
        };
    }, [previousStep]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Work Area
                </h3>
            </div>
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 relative scroll-smooth"
            >
                {/* Scroll Indicator */}
                {showScrollIndicator && (
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-center">
                        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm px-4 py-2 rounded-b-lg shadow-sm animate-bounce">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                                Scroll to see previous steps
                            </div>
                        </div>
                    </div>
                )}

                {/* Previous Steps (if any) */}
                {previousStep && (
                    <div className="mb-6 opacity-75 hover:opacity-100 transition-opacity">
                        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-base font-medium text-gray-700 dark:text-gray-300">
                                    {previousStep.name}
                                </h4>
                                <span className={`px-2 py-1 text-xs rounded-full ${previousStep.status === 'completed'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {previousStep.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {previousStep.description}
                            </p>
                            {previousStep.content && (
                                <div className="bg-gray-100 dark:bg-gray-700/30 rounded-lg p-3">
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {previousStep.content}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Current Step Section */}
                {currentStep && (
                    <div className="mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-base font-medium text-gray-900 dark:text-gray-100">
                                    {currentStep.name}
                                </h4>
                                <span className={`px-2 py-1 text-xs rounded-full ${currentStep.status === 'completed'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : currentStep.status === 'error'
                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                            : currentStep.status === 'running'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                    }`}>
                                    {currentStep.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {currentStep.description}
                            </p>
                            {currentStep.content && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {currentStep.content}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Work Items Section */}
                {workItems.length > 0 && (
                    <div className="space-y-4">
                        {workItems.map(item => (
                            <div
                                key={item.id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {item.title}
                                    </h4>
                                    <span className={`px-2 py-1 text-xs rounded-full ${item.status === 'completed'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : item.status === 'failed' || item.status === 'error'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}>
                                        {item.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {item.description}
                                </p>
                                {item.statusMessage && (
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        {item.statusMessage}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {children}
            </div>
        </div>
    );
};

export type { WorkspaceSectionProps }; 