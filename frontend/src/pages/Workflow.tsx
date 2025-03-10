import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Types
import {
    WorkflowStep,
    WorkflowStepType
} from '../types/workflows';

// Context
import { useWorkflows } from '../context/WorkflowContext';

// Page components
import WorkflowConfig from '../components/WorkflowConfig';
import WorkflowStepsList from '../components/WorkflowStepsList';
import StepDetail from '../components/StepDetail';
import WorkflowNavigation from '../components/WorkflowNavigation';
import WorkflowMenuBar from '../components/WorkflowMenuBar';
import InputStepRunner from '../components/InputStepRunner';


const Workflow: React.FC = () => {
    const { workflowId } = useParams();
    const navigate = useNavigate();
    const {
        workflow,
        activeStep,
        stepExecuted,
        stepRequestsInput,
        hasUnsavedChanges,
        isLoading,
        isExecuting,
        loadWorkflow,
        setActiveStep,
        setStepRequestsInput,
        executeCurrentStep,
        setStepExecuted,
        moveToNextStep,
        moveToPreviousStep,
        updateWorkflowByAction,
        updateWorkflowStep,
        resetWorkflow,
        resetWorkflowState,
    } = useWorkflows();

    // State
    const [showConfig, setShowConfig] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const savedState = localStorage.getItem('workflowNavCollapsed');
        return savedState ? JSON.parse(savedState) : false;
    });
    const [showInputModal, setShowInputModal] = useState(true);

    // Derived state
    const workflowSteps = useMemo(() => workflow?.steps || [], [workflow]);

    const currentStep = useMemo(() => {
        if (!workflow || !workflowSteps.length) return null;

        // Find the step with the index matching activeStep
        if (typeof activeStep === 'number' && activeStep >= 0 && activeStep < workflowSteps.length) {
            return workflowSteps[activeStep];
        }

        return null;
    }, [workflow, workflowSteps, activeStep]);

    // Event handlers
    const handleToggleCollapse = useCallback(() => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('workflowNavCollapsed', JSON.stringify(newState));
    }, [isCollapsed]);

    const handleBack = useCallback(() => {
        moveToPreviousStep();
    }, [moveToPreviousStep]);

    const handleNext = useCallback(async (): Promise<void> => {
        moveToNextStep();
    }, [moveToNextStep]);

    const handleStepClick = useCallback((index: number) => {
        if (index >= 0 && index < workflowSteps.length) {
            setActiveStep(index);
        }
    }, [workflowSteps, setActiveStep]);

    const handleToggleEditMode = useCallback(() => {
        setIsEditMode(!isEditMode);
    }, [isEditMode]);

    const handleNewQuestion = useCallback(async (): Promise<void> => {
        resetWorkflow();
    }, [resetWorkflow]);

    const handleExecute = useCallback(() => {
        executeCurrentStep();
    }, [executeCurrentStep]);

    const handleInputSubmit = useCallback(() => {
        setShowInputModal(false);
        setStepRequestsInput(false);
        executeCurrentStep();
    }, [executeCurrentStep, setStepRequestsInput]);

    const handleInputCancel = useCallback(() => {
        setShowInputModal(false);
    }, []);

    const handleStepReorder = useCallback((reorderedSteps: WorkflowStep[]) => {
        updateWorkflowByAction({
            type: 'REORDER_STEPS',
            payload: {
                reorder: {
                    reorderedSteps
                }
            }
        });
    }, [updateWorkflowByAction]);

    const handleAddStep = useCallback(() => {
        if (!workflow) return;

        updateWorkflowByAction({
            type: 'ADD_STEP',
            payload: {}
        });
    }, [workflow, updateWorkflowByAction]);

    const handleStepUpdate = useCallback((step: WorkflowStep) => {
        updateWorkflowStep(step);
    }, [updateWorkflowStep]);

    const handleStepDelete = useCallback((stepId: string) => {
        updateWorkflowByAction({
            type: 'DELETE_STEP',
            payload: {
                stepId
            }
        });
    }, [updateWorkflowByAction]);

    // Effects
    useEffect(() => {
        const loadWorkflowData = async () => {
            try {
                if (workflowId) {
                    await loadWorkflow(workflowId);
                } else {
                    setError('No workflow ID provided');
                }
            } catch (err) {
                console.error('Error loading workflow:', err);
                setError('Failed to load workflow');
            }
        };

        loadWorkflowData();
    }, [workflowId, loadWorkflow]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);

    useEffect(() => {
        if (stepRequestsInput) {
            setShowInputModal(true);
        }
    }, [stepRequestsInput]);

    useEffect(() => {
        if (workflowSteps.length > 0 && (activeStep < 0 || activeStep >= workflowSteps.length)) {
            // If activeStep is out of bounds, set it to the first step
            setActiveStep(0);
        }
    }, [workflowSteps, activeStep, setActiveStep]);

    // Add event listener for closing the WorkflowVariables overlay
    useEffect(() => {
        const handleCloseWorkflowVariables = () => {
            setShowConfig(false);
        };

        window.addEventListener('closeWorkflowVariables', handleCloseWorkflowVariables);

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener('closeWorkflowVariables', handleCloseWorkflowVariables);
        };
    }, []);

    // Render conditionally after all hooks have been called
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <div className="text-center">
                        <div className="text-red-500 dark:text-red-400 text-5xl mb-4">⚠️</div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Workflow</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                        <button
                            onClick={() => navigate('/workflows')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Back to Workflows
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading || !workflow) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent dark:border-blue-400 dark:border-t-transparent mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading workflow...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
            <WorkflowMenuBar
                isEditMode={isEditMode}
                onToggleEditMode={handleToggleEditMode}
            />
            <div className="flex flex-1 overflow-hidden">
                {/* Left Navigation */}
                <div className={`border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col ${isCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 ease-in-out`}>
                    {/* Header */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <div className="p-4 flex items-center justify-between">
                            {!isCollapsed && (
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                    {workflow.name}
                                </h2>
                            )}
                            <button
                                onClick={handleToggleCollapse}
                                className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                title={isCollapsed ? "Expand" : "Collapse"}
                            >
                                <svg className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Workflow Config Button */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <div className="p-2">
                            <button
                                onClick={() => setShowConfig(!showConfig)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                                    ${showConfig
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-1 ring-blue-700/10 dark:ring-blue-400/10'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 8h8" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h4" />
                                </svg>
                                <span>Workflow Variables</span>
                                <svg
                                    className={`w-4 h-4 ml-auto transition-transform ${showConfig ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Collapsed View */}
                    {isCollapsed && (
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <div className="p-2">
                                <button
                                    onClick={() => setShowConfig(!showConfig)}
                                    className={`w-full flex justify-center p-2 rounded-md transition-colors
                                        ${showConfig
                                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 ring-1 ring-blue-700/10 dark:ring-blue-400/10'
                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400'
                                        }`}
                                    title="Workflow Variables"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 8h8" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h4" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Show Steps List when not in config mode */}
                    {!showConfig && (
                        <WorkflowStepsList
                            steps={workflowSteps}
                            activeStep={activeStep}
                            isEditMode={isEditMode}
                            onStepClick={handleStepClick}
                            onAddStep={handleAddStep}
                            onReorder={handleStepReorder}
                            onStepDelete={handleStepDelete}
                            isCollapsed={isCollapsed}
                        />
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="container mx-auto px-4 py-6">
                        <div className="flex-1 space-y-6">
                            {showConfig ? (
                                <WorkflowConfig />
                            ) : (
                                <>
                                    {/* Step Detail */}
                                    <div>
                                        {stepRequestsInput ? (
                                            <InputStepRunner
                                                isOpen={showInputModal}
                                                onClose={handleInputCancel}
                                                onInputSubmit={handleInputSubmit}
                                            />
                                        ) : (
                                            currentStep ? (
                                                <StepDetail
                                                    step={currentStep}
                                                    isEditMode={isEditMode}
                                                    stepExecuted={stepExecuted}
                                                    isExecuting={isExecuting}
                                                    onStepUpdate={handleStepUpdate}
                                                    onStepDelete={handleStepDelete}
                                                />
                                            ) : (
                                                <div className="text-center py-8">
                                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                                        No steps in this workflow yet. Click the "Add Step" button to get started.
                                                    </p>
                                                    <button
                                                        onClick={handleAddStep}
                                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        Add First Step
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {currentStep && (
                                        <WorkflowNavigation
                                            isEditMode={isEditMode}
                                            activeStep={activeStep}
                                            isInputRequired={stepRequestsInput}
                                            totalSteps={workflowSteps.length}
                                            step_type={currentStep?.step_type as WorkflowStepType || WorkflowStepType.ACTION}
                                            isLoading={isLoading || isExecuting}
                                            stepExecuted={stepExecuted}
                                            onBack={handleBack}
                                            onNext={handleNext}
                                            onExecute={handleExecute}
                                            onRestart={handleNewQuestion}
                                            onInputSubmit={handleInputSubmit}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Workflow; 