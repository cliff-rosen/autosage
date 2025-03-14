import React, { useState, useEffect } from 'react';
import { AgentWorkflowEngine, WorkflowJob, JobResult } from '../lib/workflow/agent/AgentWorkflowEngine';
import { developQuestionWorkflowTemplate } from '../types/workflow-templates';
import { WorkflowVariable, WorkflowVariableRole, WorkflowStepType, WorkflowStep } from '../types/workflows';
import { asVarName } from '../types/workflow-templates';

/**
 * A component for testing the AgentWorkflowEngine.runJob functionality
 */
const TestComponent: React.FC = () => {
    // State for workflow inputs
    const [inputValues, setInputValues] = useState<Record<string, string>>({
        initial_question: ''
    });

    // State for workflow execution
    const [isRunning, setIsRunning] = useState(false);
    const [jobResult, setJobResult] = useState<JobResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [statusUpdates, setStatusUpdates] = useState<any[]>([]);

    // Use the workflow template directly - it now already has two steps
    const [workflow, setWorkflow] = useState(developQuestionWorkflowTemplate);

    // Create a ref to the engine to avoid recreating it on each render
    const engineRef = React.useRef<AgentWorkflowEngine | null>(null);

    // Initialize the engine if it doesn't exist
    if (!engineRef.current) {
        engineRef.current = new AgentWorkflowEngine();
    }

    // Get the engine from the ref
    const engine = engineRef.current;

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setInputValues(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle status update
    const handleStatusUpdate = (status: any) => {
        console.log('Status zzz:', status);
        setStatusUpdates(prev => [...prev, status]);
    };

    // Start the workflow
    const startWorkflow = async () => {
        try {
            // Reset state
            setError(null);
            setIsRunning(true);
            setJobResult(null);
            setStatusUpdates([]);

            // Create workflow variables from input values
            const workflowVariables: WorkflowVariable[] = [];

            // Add input values to workflow variables
            Object.entries(inputValues).forEach(([name, value]) => {
                // Find the variable in the workflow state
                const existingVar = workflow.state?.find((v: WorkflowVariable) => v.name === asVarName(name));

                if (existingVar) {
                    workflowVariables.push({
                        ...existingVar,
                        value,
                        variable_role: WorkflowVariableRole.USER_INPUT
                    });
                }
            });

            // Create the job
            const job: WorkflowJob = {
                workflow: {
                    ...workflow,
                    agent_workflow_type: 'simple'
                },
                inputs: workflowVariables,
                statusCallback: handleStatusUpdate
            };

            console.log('Starting workflow job:', job);

            // Run the job
            const result = await engine.runJob(job);
            console.log('Job result:', result);

            // Update state
            setJobResult(result);
        } catch (error) {
            console.error('Error starting workflow:', error);
            setError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsRunning(false);
        }
    };

    // Render the workflow steps
    const renderWorkflowSteps = () => {
        if (!workflow || !workflow.steps || workflow.steps.length === 0) {
            return <p>No steps available for this workflow.</p>;
        }

        return (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Workflow Steps:</h4>
                <ul className="list-none p-0 m-0">
                    {workflow.steps.map((step: WorkflowStep, index: number) => {
                        // Find the matching status update for this step
                        const stepStatus = statusUpdates.find(
                            update => update.stepId === step.step_id && update.status !== 'running'
                        );

                        return (
                            <li key={step.step_id.toString()} className="p-3 mb-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-semibold">{index + 1}</span>
                                    <strong className="flex-1 font-medium text-gray-800 dark:text-gray-200">{step.label || `Step ${index + 1}`}</strong>

                                    {/* Step status indicator */}
                                    {stepStatus ? (
                                        <span className={`text-xs px-2 py-1 rounded ${stepStatus.status === 'completed'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}>
                                            {stepStatus.status}
                                        </span>
                                    ) : (
                                        <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                            {isRunning && statusUpdates.some(update => update.stepId === step.step_id)
                                                ? 'running'
                                                : 'pending'}
                                        </span>
                                    )}
                                </div>

                                {step.description && <p className="my-2 text-sm text-gray-600 dark:text-gray-400">{step.description}</p>}

                                {step.tool && (
                                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">{step.tool.name} ({step.tool.tool_type})</p>
                                        {step.tool.description && <p className="text-gray-600 dark:text-gray-400 mb-3 text-xs">{step.tool.description}</p>}

                                        {/* Tool Input Mappings */}
                                        {step.parameter_mappings && Object.keys(step.parameter_mappings).length > 0 && (
                                            <div className="mb-3">
                                                <h6 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 border-b border-gray-200 dark:border-gray-700 pb-1">Input Mappings:</h6>
                                                <ul className="list-none p-0 m-0 space-y-1">
                                                    {Object.entries(step.parameter_mappings).map(([paramName, varName]) => (
                                                        <li key={paramName} className="flex items-center text-xs">
                                                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded mr-2">
                                                                {paramName}
                                                            </span>
                                                            <span className="text-gray-500 dark:text-gray-400 mx-1">←</span>
                                                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded">
                                                                {String(varName)}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Tool Output Mappings */}
                                        {step.output_mappings && Object.keys(step.output_mappings).length > 0 && (
                                            <div>
                                                <h6 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 border-b border-gray-200 dark:border-gray-700 pb-1">Output Mappings:</h6>
                                                <ul className="list-none p-0 m-0 space-y-1">
                                                    {Object.entries(step.output_mappings).map(([outputName, varName]) => (
                                                        <li key={outputName} className="flex items-center text-xs">
                                                            <span className="px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded mr-2">
                                                                {outputName}
                                                            </span>
                                                            <span className="text-gray-500 dark:text-gray-400 mx-1">→</span>
                                                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded">
                                                                {String(varName)}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step execution details */}
                                {stepStatus && stepStatus.result && (
                                    <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                        <h6 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Execution Result:</h6>
                                        <pre className="text-xs overflow-auto p-2 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded">
                                            {JSON.stringify(stepStatus.result, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    };

    // Render the workflow variables
    const renderWorkflowVariables = () => {
        if (!workflow || !workflow.state || workflow.state.length === 0) {
            return null;
        }

        // Get the latest status update for each variable
        const variableValues: Record<string, any> = {};

        // First, initialize with the initial values
        workflow.state.forEach((variable: WorkflowVariable) => {
            variableValues[variable.name.toString()] = variable.value || '';
        });

        // Then update with any values from status updates
        statusUpdates.forEach(update => {
            if (update.result?.outputs) {
                Object.entries(update.result.outputs).forEach(([varName, value]) => {
                    variableValues[varName] = value;
                });
            }
        });

        // Finally, update with job result outputs
        if (jobResult?.outputs) {
            Object.entries(jobResult.outputs).forEach(([varName, value]) => {
                variableValues[varName] = value;
            });
        }

        return (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Workflow Variables:</h4>
                <div className="grid grid-cols-1 gap-4">
                    {workflow.state.map((variable: WorkflowVariable) => (
                        <div key={variable.name.toString()} className="p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-gray-800 dark:text-gray-200">{variable.name.toString()}</div>
                                <span className={`text-xs px-2 py-1 rounded ${variable.io_type === 'input'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : variable.io_type === 'output'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                    }`}>
                                    {variable.io_type}
                                    {variable.variable_role ? ` (${variable.variable_role})` : ''}
                                </span>
                            </div>
                            {variable.schema.description && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">{variable.schema.description}</div>
                            )}
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                <p className="text-gray-700 dark:text-gray-300">
                                    {variableValues[variable.name.toString()] || '(empty)'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render the workflow outputs
    const renderWorkflowOutputs = () => {
        if (!jobResult || !jobResult.outputs) {
            return null;
        }

        return (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Workflow Outputs:</h4>
                <div className="grid grid-cols-1 gap-4">
                    {Object.entries(jobResult.outputs).map(([key, value]) => (
                        <div key={key} className="p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                            <div className="font-medium text-gray-800 dark:text-gray-200 mb-2">{key}</div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                {typeof value === 'object' ? (
                                    <pre className="text-sm overflow-auto text-gray-800 dark:text-gray-200">{JSON.stringify(value, null, 2)}</pre>
                                ) : (
                                    <p className="text-gray-700 dark:text-gray-300">{String(value)}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                AgentWorkflowEngine Test
            </h1>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Workflow Inputs</h2>

                <div className="space-y-4">
                    {workflow.state?.filter((v: WorkflowVariable) => v.io_type === 'input').map((variable: WorkflowVariable) => (
                        <div key={variable.name.toString()} className="flex flex-col gap-1.5">
                            <label className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                {variable.name.toString()}
                            </label>
                            {variable.schema.description && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{variable.schema.description}</div>
                            )}
                            <input
                                type="text"
                                name={variable.name.toString()}
                                value={inputValues[variable.name.toString()] || ''}
                                onChange={handleInputChange}
                                placeholder={`Enter ${variable.name.toString()}...`}
                                disabled={isRunning}
                                className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                            />
                        </div>
                    ))}

                    <button
                        onClick={startWorkflow}
                        disabled={isRunning}
                        className="mt-4 px-4 py-2.5 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isRunning ? 'Running...' : 'Start Workflow'}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                        {error}
                    </div>
                )}
            </div>

            {/* Workflow Steps */}
            {renderWorkflowSteps()}

            {/* Workflow Variables */}
            {renderWorkflowVariables()}

            {/* Workflow Outputs */}
            {renderWorkflowOutputs()}

            {/* Status Updates */}
            {statusUpdates.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Status Updates:</h4>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                        <pre className="text-xs text-gray-800 dark:text-gray-200">{JSON.stringify(statusUpdates, null, 2)}</pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestComponent; 