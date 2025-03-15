import React, { useState, useEffect, useRef } from 'react';
import {
    AgentWorkflowOrchestrator,
    StatusChangeEvent,
    PhaseCompleteEvent,
    WorkflowCompleteEvent,
    OrchestrationStatus
} from '../lib/workflow/agent/AgentWorkflowOrchestrator';
import { AgentWorkflowEngine } from '../lib/workflow/agent/AgentWorkflowEngine';
import {
    AgentWorkflowChain,
    SAMPLE_WORKFLOW_CHAIN
} from '../types/agent-workflows';
import {
    WorkflowStep,
    WorkflowVariable,
} from '../types/workflows';

// Helper functions for phase display
const getPhaseProgress = (phaseId: string): number => {
    // In a real app, this would be calculated based on actual progress
    // For demo purposes, we'll return a random value between 10 and 100
    return Math.floor(Math.random() * 90) + 10;
};

const AgentWorkflowDemo: React.FC = () => {
    // Replace inputValues with chainInputValues
    const [chainInputValues, setChainInputValues] = useState<Record<string, any>>({});
    const [status, setStatus] = useState<OrchestrationStatus | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPhase, setSelectedPhase] = useState('input');
    const [activeWorkflowChain, setActiveWorkflowChain] = useState<AgentWorkflowChain>(SAMPLE_WORKFLOW_CHAIN);
    const [currentWorkflowSteps, setCurrentWorkflowSteps] = useState<any[]>([]);
    const [phaseResults, setPhaseResults] = useState<Record<string, any>>({});
    const [chainOutputs, setChainOutputs] = useState<Record<string, any>>({});

    // Create a ref to the orchestrator to avoid recreating it on each render
    const orchestratorRef = useRef<AgentWorkflowOrchestrator | null>(null);

    // Initialize the orchestrator if it doesn't exist
    if (!orchestratorRef.current) {
        const workflowEngine = new AgentWorkflowEngine();
        orchestratorRef.current = new AgentWorkflowOrchestrator(workflowEngine);
    }

    // Get the orchestrator from the ref
    const orchestrator = orchestratorRef.current;

    // Handle status change events
    const handleStatusChange = (event: StatusChangeEvent) => {
        setStatus(event.status);

        // Update running state based on status
        if (event.status.currentPhase === 'completed' || event.status.currentPhase === 'failed') {
            setIsRunning(false);

            // If completed, select the output phase
            if (event.status.currentPhase === 'completed') {
                setSelectedPhase('output');

                // Update chain outputs with final results from the status
                if (event.status.results) {
                    // Extract outputs from the results, ensuring they are objects
                    const outputs = Object.values(event.status.results)
                        .filter((result): result is Record<string, any> =>
                            result !== null && typeof result === 'object'
                        )
                        .reduce((acc, result) => ({
                            ...acc,
                            ...result
                        }), {} as Record<string, any>);

                    setChainOutputs(outputs);
                }
            }
        } else {
            // Set the selected phase to the current phase
            setSelectedPhase(event.status.currentPhase);
        }

        // Update current workflow steps if available
        if (event.status.currentWorkflowStatus?.state?.steps) {
            setCurrentWorkflowSteps(event.status.currentWorkflowStatus.state.steps);
        }

        // Update error state
        if (event.status.currentPhase === 'failed' && event.status.error) {
            setError(event.status.error);
        }
    };

    // Handle phase complete events
    const handlePhaseComplete = (event: PhaseCompleteEvent) => {
        console.log('qqq handlePhaseComplete', event);
        // Update phase results
        setPhaseResults(prev => ({
            ...prev,
            [event.phase]: event.result
        }));

        // Update the workflow chain state with the phase results
        if (event.result) {
            const phase = activeWorkflowChain.phases.find(p => p.id === event.phase);
            if (phase) {
                // For each output mapping in this phase
                Object.entries(phase.outputs_mappings).forEach(([workflowVar, chainVar]) => {
                    const value = event.result[workflowVar];
                    if (value !== undefined) {
                        // Update chain outputs
                        setChainOutputs(prev => ({
                            ...prev,
                            [chainVar]: value
                        }));
                        // Update the activeWorkflowChain state
                        setActiveWorkflowChain(prev => ({
                            ...prev,
                            state: prev?.state?.map((v: WorkflowVariable) => v.name === chainVar ? { ...v, value } : v) || []
                        }));
                    }
                });
            }
        }
    };

    // Handle workflow complete events
    const handleWorkflowComplete = (event: WorkflowCompleteEvent) => {
        // Get the current orchestrator status
        const currentStatus = orchestrator?.getStatus();
        if (currentStatus?.results) {
            // Extract outputs from all phase results, ensuring they are objects
            const outputs = Object.values(currentStatus.results)
                .filter((result): result is Record<string, any> =>
                    result !== null && typeof result === 'object'
                )
                .reduce((acc, result) => ({
                    ...acc,
                    ...result
                }), {} as Record<string, any>);

            setChainOutputs(outputs);
        }
        setSelectedPhase('output');
        setIsRunning(false);
    };

    // Handle error events
    const handleError = (event: { error: string }) => {
        setError(event.error);
        setIsRunning(false);
    };

    // Set up event listeners when the component mounts
    useEffect(() => {
        if (orchestrator) {
            orchestrator.onStatusChange(handleStatusChange);
            orchestrator.onPhaseComplete(handlePhaseComplete);
            orchestrator.onWorkflowComplete(handleWorkflowComplete);
            orchestrator.onError(handleError);
        }

        // Clean up event listeners when the component unmounts
        return () => {
            // Note: In a real implementation, we would need to remove the event listeners
            // but the current interface doesn't provide methods for that
        };
    }, [orchestrator]);

    // Handle input change for dynamic inputs
    const handleInputChange = (
        inputName: string,
        value: any
    ) => {
        setChainInputValues(prev => ({
            ...prev,
            [inputName]: value
        }));
    };

    // Get required inputs from chain state
    const getChainInputs = (): WorkflowVariable[] => {
        if (!activeWorkflowChain?.state || !Array.isArray(activeWorkflowChain.state)) return [];

        return (activeWorkflowChain.state as WorkflowVariable[]).filter(
            (variable: WorkflowVariable) => variable.io_type === 'input'
        );
    };

    // Check if all required inputs are provided
    const areRequiredInputsProvided = () => {
        const chainInputs = getChainInputs();
        return chainInputs.every((input: WorkflowVariable) => {
            if (input.required) {
                const value = chainInputValues[input.name];
                return value !== undefined && value !== '';
            }
            return true;
        });
    };

    // Start the workflow
    const startWorkflow = async () => {
        try {
            // Reset state
            setError(null);
            setIsRunning(true);
            setSelectedPhase(activeWorkflowChain.phases[0].id);
            setPhaseResults({});
            setChainOutputs({});

            // Get all chain state variables
            const chainState = activeWorkflowChain.state || [];

            // Create workflow variables by combining chain state with input values
            const inputVariables = chainState.map((variable: WorkflowVariable) => ({
                ...variable,
                value: chainInputValues[variable.name] || variable.value
            }));

            // Start the workflow with the prepared variables
            await orchestrator.executeWorkflowChain(inputVariables, activeWorkflowChain);
        } catch (error) {
            console.error('Error starting workflow:', error);
            setError('Failed to start workflow');
            setIsRunning(false);
        }
    };

    // Render input fields based on chain state
    const renderInputFields = () => {
        const chainInputs = getChainInputs();

        if (chainInputs.length === 0) {
            return <p>No inputs required for this workflow chain.</p>;
        }

        return (
            <div className="flex flex-col gap-4">
                {chainInputs.map((input: WorkflowVariable) => (
                    <div key={input.name.toString()} className="flex flex-col gap-1.5">
                        <label className="font-medium text-sm text-gray-700 dark:text-gray-300">
                            {input.name.toString()}
                            {input.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {input.schema.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                {input.schema.description}
                            </div>
                        )}
                        <input
                            type="text"
                            value={chainInputValues[input.name] || ''}
                            onChange={(e) => handleInputChange(input.name, e.target.value)}
                            placeholder={`Enter ${input.name}...`}
                            disabled={isRunning}
                            className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                        />
                    </div>
                ))}
                <button
                    onClick={startWorkflow}
                    disabled={isRunning || !areRequiredInputsProvided()}
                    className="mt-2 px-4 py-2.5 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors self-start disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isRunning ? 'Processing...' : 'Submit'}
                </button>
            </div>
        );
    };

    // Render the workflow steps with more details
    const renderWorkflowSteps = () => {
        if (!currentWorkflowSteps || currentWorkflowSteps.length === 0) {
            return <p>No steps available for this workflow.</p>;
        }

        return (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Workflow Steps:</h4>
                <ul className="list-none p-0 m-0">
                    {currentWorkflowSteps.map((step: WorkflowStep, index) => {
                        // Safely get the step ID, defaulting to the index if not available
                        const stepId = step?.step_id?.toString() || `step-${index}`;
                        // Safely get the step label
                        const stepLabel = step?.label || `Step ${index + 1}`;
                        // Safely get the step type
                        const stepType = step?.step_type || 'unknown';
                        // Safely get the step description
                        const stepDescription = step?.description || '';
                        // Safely get the tool information
                        const tool = step?.tool || null;

                        return (
                            <li key={stepId} className="p-3 mb-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-semibold">{index + 1}</span>
                                    <strong className="flex-1 font-medium text-gray-800 dark:text-gray-200">{stepLabel}</strong>
                                    <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">{stepType}</span>
                                </div>

                                {stepDescription && (
                                    <p className="my-2 text-sm text-gray-600 dark:text-gray-400">{stepDescription}</p>
                                )}

                                {tool && (
                                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {tool.name || 'Unnamed Tool'} ({tool.tool_type || 'unknown'})
                                        </p>
                                        {tool.description && (
                                            <p className="text-gray-600 dark:text-gray-400 mb-3 text-xs">{tool.description}</p>
                                        )}

                                        {/* Tool Input Mappings */}
                                        {step.parameter_mappings && Object.keys(step.parameter_mappings).length > 0 && (
                                            <div className="mb-3">
                                                <h6 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 border-b border-gray-200 dark:border-gray-700 pb-1">
                                                    Input Mappings:
                                                </h6>
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
                                                <h6 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 border-b border-gray-200 dark:border-gray-700 pb-1">
                                                    Output Mappings:
                                                </h6>
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
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    };

    // Render the workflow phases in the top panel
    const renderWorkflowPhases = () => {
        // Always include input and output phases
        const allPhases = [
            { id: 'input', label: 'Initial Inputs' },
            ...activeWorkflowChain.phases,
            { id: 'output', label: 'Final Output' }
        ];

        return (
            <div className="flex items-center justify-between mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto min-h-[120px]">
                {allPhases.map((phase, index) => (
                    <React.Fragment key={phase.id}>
                        {/* Phase item */}
                        <div
                            className={`flex flex-col items-center justify-center cursor-pointer p-3 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:-translate-y-1 min-w-[100px] max-w-[150px] ${selectedPhase === phase.id ? 'bg-blue-50 dark:bg-blue-900/20 -translate-y-1 shadow' : ''}`}
                            onClick={() => !isRunning && setSelectedPhase(phase.id)}
                        >
                            <div className={`w-10 h-10 flex items-center justify-center rounded-full mb-3 transition-colors ${selectedPhase === phase.id ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                {index + 1}
                            </div>
                            <div className={`text-sm text-center whitespace-nowrap ${selectedPhase === phase.id ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                                {phase.label}
                            </div>
                        </div>

                        {/* Connector (only between phases, not after the last one) */}
                        {index < allPhases.length - 1 && (
                            <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 min-w-[20px] max-w-[100px] z-0" />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };


    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Sample Workflow Chain Demo</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                This demo shows how multiple workflows can be chained together, with outputs from one workflow becoming inputs to the next.
            </p>

            {/* Section 1: Workflow Phases - Fixed Height Top Section */}
            <div className="h-32 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                {renderWorkflowPhases()}
            </div>

            {/* Section 2: Input Area - Fixed Height Middle Section */}
            <div className="h-64 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow overflow-auto p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Workflow Inputs
                </h3>
                {renderInputFields()}
                {error && (
                    <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                        {error}
                    </div>
                )}
            </div>

            {/* Section 3: Phase Details - Fixed Height Bottom Section */}
            <div className="h-[32rem] bg-white dark:bg-gray-800 rounded-lg shadow overflow-auto">
                {selectedPhase === 'input' ? (
                    <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                            Input Phase Details
                        </h3>
                        <div className="space-y-4">
                            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">Required Inputs</h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-900">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Required</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {getChainInputs().map((input: WorkflowVariable) => (
                                            <tr key={input.name.toString()}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{input.name.toString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {input.schema.is_array ? `${input.schema.type}[]` : input.schema.type}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {input.required ? 'Yes' : 'No'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {input.schema.description || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : selectedPhase === 'output' ? (
                    <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                            Chain Variables
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IO Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {Array.isArray(activeWorkflowChain?.state) && activeWorkflowChain.state.length > 0 ? (
                                        activeWorkflowChain.state.map((variable: WorkflowVariable) => (
                                            <tr key={variable.name.toString()}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                    {variable.name.toString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {variable.schema.is_array ? `${variable.schema.type}[]` : variable.schema.type}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {variable.io_type}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {variable.variable_role || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {chainOutputs[variable.name] ?
                                                        JSON.stringify(chainOutputs[variable.name]) :
                                                        chainInputValues[variable.name] ?
                                                            JSON.stringify(chainInputValues[variable.name]) :
                                                            variable.value ?
                                                                JSON.stringify(variable.value) :
                                                                '-'
                                                    }
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                                No workflow state available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                            {activeWorkflowChain.phases.find(p => p.id === selectedPhase)?.label || 'Phase Details'}
                        </h3>
                        <div className="space-y-4">
                            {/* Progress bar */}
                            <div>
                                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${getPhaseProgress(selectedPhase)}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Progress: {getPhaseProgress(selectedPhase)}%</p>
                            </div>

                            {/* Phase steps */}
                            {renderWorkflowSteps()}

                            {/* Phase results if available */}
                            {phaseResults[selectedPhase] && (
                                <div className="mt-6">
                                    <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Phase Results:</h4>
                                    <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto text-sm">
                                        {JSON.stringify(phaseResults[selectedPhase], null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentWorkflowDemo; 