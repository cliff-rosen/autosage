import React, { useState, useEffect } from 'react';
import { AgentWorkflowService } from '../lib/workflow/agent/AgentWorkflowService';
import {
    AgentWorkflowChain,
    SAMPLE_WORKFLOW_CHAIN,
    AgentWorkflow
} from '../types/agent-workflows';
import {
    getWorkflowSignature,
    getWorkflowSignatureDescription,
    WorkflowStep,
    WorkflowSignature,
    WorkflowVariable,
    WorkflowVariableRole
} from '../types/workflows';

// Helper functions for phase display
const getPhaseProgress = (phaseId: string): number => {
    // In a real app, this would be calculated based on actual progress
    // For demo purposes, we'll return a random value between 10 and 100
    return Math.floor(Math.random() * 90) + 10;
};

const AgentWorkflowDemo: React.FC = () => {
    // Input values for the workflow
    const [inputValues, setInputValues] = useState<Record<string, any>>({ question: '' });
    const [status, setStatus] = useState<any | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPhase, setSelectedPhase] = useState('input');
    const [activeWorkflowChain, setActiveWorkflowChain] = useState<AgentWorkflowChain>(SAMPLE_WORKFLOW_CHAIN);
    const [currentWorkflowSteps, setCurrentWorkflowSteps] = useState<any[]>([]);
    const [phaseResults, setPhaseResults] = useState<Record<string, any>>({});
    const [chainOutputs, setChainOutputs] = useState<Record<string, any>>({});
    // New state variables for workflow details
    const [selectedWorkflow, setSelectedWorkflow] = useState<AgentWorkflow | null>(null);
    const [workflowSignature, setWorkflowSignature] = useState<WorkflowSignature | null>(null);
    const [workflowDescription, setWorkflowDescription] = useState<string>('');
    // New state for workflow inputs
    const [workflowInputs, setWorkflowInputs] = useState<any[]>([]);

    // Create a ref to the service to avoid recreating it on each render
    const serviceRef = React.useRef<AgentWorkflowService | null>(null);

    // Initialize the service if it doesn't exist
    if (!serviceRef.current) {
        serviceRef.current = new AgentWorkflowService();
    }

    // Get the service from the ref
    const service = serviceRef.current;

    // Handle status change events
    const handleStatusChange = (event: any) => {
        setStatus(event.status);

        // Update running state based on status
        if (event.status.currentPhase === 'completed' || event.status.currentPhase === 'failed') {
            setIsRunning(false);

            // If completed, select the output phase
            if (event.status.currentPhase === 'completed') {
                setSelectedPhase('output');

                // Update chain outputs with final results
                if (event.status.outputs) {
                    // Just use the outputs directly, roles are already defined in the workflow chain
                    setChainOutputs(event.status.outputs);
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

    // Set up event listeners when the component mounts
    useEffect(() => {
        service.onStatusChange(handleStatusChange);

        // Clean up event listeners when the component unmounts
        return () => {
            service.offStatusChange(handleStatusChange);
        };
    }, [service]);

    // Load the selected workflow when the phase changes
    useEffect(() => {
        const loadSelectedWorkflow = async () => {
            // Only load workflow for actual phases (not input or output)
            if (selectedPhase !== 'input' && selectedPhase !== 'output') {
                try {
                    const phase = activeWorkflowChain.phases.find(p => p.id === selectedPhase);
                    if (phase) {
                        const workflowResult = phase.workflow();
                        const workflow = workflowResult instanceof Promise
                            ? await workflowResult
                            : workflowResult;

                        setSelectedWorkflow(workflow);

                        // Get the workflow signature and description
                        const signature = getWorkflowSignature(workflow);
                        setWorkflowSignature(signature);

                        const description = getWorkflowSignatureDescription(workflow);
                        setWorkflowDescription(description);

                        // Set the current workflow steps
                        setCurrentWorkflowSteps(workflow.steps);
                    }
                } catch (error) {
                    console.error('Error loading workflow:', error);
                    setError('Failed to load workflow details');
                }
            } else {
                // Clear workflow details when input or output is selected
                setSelectedWorkflow(null);
                setWorkflowSignature(null);
                setWorkflowDescription('');
                setCurrentWorkflowSteps([]);
            }
        };

        loadSelectedWorkflow();
    }, [selectedPhase, activeWorkflowChain]);

    // Handle input change for dynamic inputs
    const handleInputChange = (
        inputNameOrEvent: string | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        valueOrInputName?: any
    ) => {
        // If first parameter is a string (input name) and second is a value
        if (typeof inputNameOrEvent === 'string') {
            const inputName = inputNameOrEvent;
            const value = valueOrInputName;

            setWorkflowInputs(prev => ({
                ...prev,
                [inputName]: value
            }));
        }
        // If first parameter is an event and second is input name
        else {
            const e = inputNameOrEvent;
            const inputName = valueOrInputName as string;

            setInputValues(prev => ({
                ...prev,
                [inputName]: e.target.value
            }));
        }
    };

    // Load workflow inputs when the component mounts or the workflow chain changes
    useEffect(() => {
        const loadWorkflowInputs = async () => {
            try {
                // Get inputs from the workflow chain's state
                if (activeWorkflowChain && activeWorkflowChain.state) {
                    // Filter for input variables from the chain state
                    const chainInputs = activeWorkflowChain.state.filter(
                        (variable: any) => variable.io_type === 'input'
                    );

                    if (chainInputs.length > 0) {
                        setWorkflowInputs(chainInputs.map((input: any) => ({
                            name: input.name,
                            schema: input.schema,
                            required: input.required || false,
                            description: input.schema?.description || ''
                        })));

                        // Initialize input values with empty strings for each input
                        const initialInputs: Record<string, string> = {};
                        chainInputs.forEach((input: any) => {
                            initialInputs[input.name.toString()] = '';
                        });
                        setInputValues(initialInputs);
                        return;
                    }
                }

                // Fallback to a default question input if no chain inputs are defined
                setWorkflowInputs([{
                    name: 'question',
                    schema: {
                        type: 'string',
                        is_array: false,
                        description: 'The question to answer'
                    },
                    required: true
                }]);
                setInputValues({ question: '' });
            } catch (error) {
                console.error('Error loading workflow chain inputs:', error);
                setError('Failed to load workflow inputs');
            }
        };

        loadWorkflowInputs();
    }, [activeWorkflowChain]);

    // Start the workflow
    const startWorkflow = async () => {
        // Validate inputs
        const missingInputs = workflowInputs.filter(input =>
            input.required && !inputValues[input.name]?.trim()
        );

        if (missingInputs.length > 0) {
            setError(`Please fill in all required inputs: ${missingInputs.map(i => i.name).join(', ')}`);
            return;
        }

        try {
            // Reset state
            setError(null);
            setIsRunning(true);
            setSelectedPhase(activeWorkflowChain.phases[0].id);
            setPhaseResults({});
            setChainOutputs({});

            // Use the existing variables from the workflow chain's state and just update their values
            const workflowVariables: WorkflowVariable[] = [];

            if (activeWorkflowChain.state) {
                // Clone the state variables and update input values
                activeWorkflowChain.state.forEach((variable: any) => {
                    if (variable.io_type === 'input') {
                        // Update the input value from the form
                        workflowVariables.push({
                            ...variable,
                            value: inputValues[variable.name] || ''
                        });
                    }
                });
            }

            // Start the workflow with the input values as WorkflowVariable array
            await service.executeWorkflowChain(workflowVariables, activeWorkflowChain);
        } catch (error) {
            console.error('Error starting workflow:', error);
            setError('Failed to start workflow');
            setIsRunning(false);
        }
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
                    {currentWorkflowSteps.map((step: WorkflowStep, index) => (
                        <li key={step.step_id.toString()} className="p-3 mb-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-semibold">{index + 1}</span>
                                <strong className="flex-1 font-medium text-gray-800 dark:text-gray-200">{step.label || `Step ${index + 1}`}</strong>
                                <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">{step.step_type}</span>
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
                                                            {varName.toString()}
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
                                                            {varName.toString()}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    // New function to render workflow signature details
    const renderWorkflowSignature = () => {
        if (!workflowSignature || !activeWorkflowChain) {
            return null;
        }

        // Find mappings between workflow signature variables and chain state variables
        const findChainMappings = (varName: string) => {
            if (!activeWorkflowChain.state) return [];

            // Find all chain state variables that map to/from this signature variable
            return activeWorkflowChain.state.filter(chainVar => {
                // Check if the variable names match or if there's a mapping relationship
                return chainVar.name.toString() === varName;
            });
        };

        return (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Workflow Signature:</h4>
                <div className="flex flex-wrap gap-3 mb-4 p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-baseline gap-2">
                        <span className="font-medium text-gray-600 dark:text-gray-400">ID:</span>
                        <span className="text-gray-800 dark:text-gray-200">{workflowSignature.id}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Name:</span>
                        <span className="text-gray-800 dark:text-gray-200">{workflowSignature.name}</span>
                    </div>
                    {workflowSignature.description && (
                        <div className="flex items-baseline gap-2">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Description:</span>
                            <span className="text-gray-800 dark:text-gray-200">{workflowSignature.description}</span>
                        </div>
                    )}
                    <div className="flex items-baseline gap-2">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Steps:</span>
                        <span className="text-gray-800 dark:text-gray-200">{workflowSignature.stepCount}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Has Evaluation Steps:</span>
                        <span className="text-gray-800 dark:text-gray-200">{workflowSignature.hasEvaluationSteps ? 'Yes' : 'No'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
                            Inputs ({workflowSignature.inputs.length})
                        </h5>
                        {workflowSignature.inputs.length > 0 ? (
                            <ul className="list-none p-0 m-0">
                                {workflowSignature.inputs.map(input => {
                                    const varName = input.name.toString();
                                    const chainMappings = findChainMappings(varName);

                                    return (
                                        <li key={varName} className="py-2 px-1 border-b border-gray-100 dark:border-gray-800 last:border-0 mb-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <strong className="text-gray-800 dark:text-gray-200">{varName}</strong>
                                                {input.required && (
                                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded">Required</span>
                                                )}
                                                {input.variable_role && (
                                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium rounded">
                                                        {input.variable_role}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                Type: {input.schema.is_array ? `${input.schema.type}[]` : input.schema.type}
                                            </div>
                                            {input.schema.description && (
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    Description: {input.schema.description}
                                                </div>
                                            )}

                                            {/* Show chain state mappings */}
                                            {chainMappings.length > 0 && (
                                                <div className="mt-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Chain State Mappings:
                                                    </div>
                                                    <ul className="list-none p-0 m-0 space-y-1">
                                                        {chainMappings.map((chainVar, idx) => (
                                                            <li key={idx} className="flex items-center text-xs">
                                                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded">
                                                                    {varName}
                                                                </span>
                                                                <span className="text-gray-500 dark:text-gray-400 mx-1">→</span>
                                                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                                                                    Chain: {chainVar.name.toString()}
                                                                </span>
                                                                {chainVar.variable_role && (
                                                                    <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs rounded">
                                                                        {chainVar.variable_role}
                                                                    </span>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-gray-600 dark:text-gray-400 text-sm">No inputs defined</p>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
                            Outputs ({workflowSignature.outputs.length})
                        </h5>
                        {workflowSignature.outputs.length > 0 ? (
                            <ul className="list-none p-0 m-0">
                                {workflowSignature.outputs.map(output => {
                                    const varName = output.name.toString();
                                    const chainMappings = findChainMappings(varName);

                                    return (
                                        <li key={varName} className="py-2 px-1 border-b border-gray-100 dark:border-gray-800 last:border-0 mb-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <strong className="text-gray-800 dark:text-gray-200">{varName}</strong>
                                                {output.variable_role === 'final' && (
                                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium rounded">Final</span>
                                                )}
                                                {output.variable_role && output.variable_role !== 'final' && (
                                                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs font-medium rounded">
                                                        {output.variable_role}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                Type: {output.schema.is_array ? `${output.schema.type}[]` : output.schema.type}
                                            </div>
                                            {output.schema.description && (
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    Description: {output.schema.description}
                                                </div>
                                            )}

                                            {/* Show chain state mappings */}
                                            {chainMappings.length > 0 && (
                                                <div className="mt-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Chain State Mappings:
                                                    </div>
                                                    <ul className="list-none p-0 m-0 space-y-1">
                                                        {chainMappings.map((chainVar, idx) => (
                                                            <li key={idx} className="flex items-center text-xs">
                                                                <span className="px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                                                                    {varName}
                                                                </span>
                                                                <span className="text-gray-500 dark:text-gray-400 mx-1">→</span>
                                                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                                                                    Chain: {chainVar.name.toString()}
                                                                </span>
                                                                {chainVar.variable_role && (
                                                                    <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs rounded">
                                                                        {chainVar.variable_role}
                                                                    </span>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-gray-600 dark:text-gray-400 text-sm">No outputs defined</p>
                        )}
                    </div>
                </div>

                {/* Chain State Variables Section */}
                {activeWorkflowChain.state && activeWorkflowChain.state.length > 0 && (
                    <div className="mt-4 bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
                            Workflow Chain State Variables
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeWorkflowChain.state.map((chainVar, idx) => {
                                const varName = chainVar.name.toString();
                                const ioType = chainVar.io_type;
                                const role = chainVar.variable_role;

                                // Find if this chain variable maps to any signature variable
                                const matchingSignatureVar = [...workflowSignature.inputs, ...workflowSignature.outputs]
                                    .find(sigVar => sigVar.name.toString() === varName);

                                return (
                                    <div key={idx} className="p-2 border border-gray-100 dark:border-gray-800 rounded">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <strong className="text-gray-800 dark:text-gray-200">{varName}</strong>
                                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${ioType === 'input'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                }`}>
                                                {ioType}
                                            </span>
                                            {role && (
                                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs font-medium rounded">
                                                    {role}
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Type: {chainVar.schema.is_array ? `${chainVar.schema.type}[]` : chainVar.schema.type}
                                        </div>

                                        {/* Show mapping to signature if exists */}
                                        {matchingSignatureVar && (
                                            <div className="mt-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Maps to Signature:
                                                </div>
                                                <div className="flex items-center text-xs">
                                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                                                        Chain: {varName}
                                                    </span>
                                                    <span className="text-gray-500 dark:text-gray-400 mx-1">→</span>
                                                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded">
                                                        Signature: {matchingSignatureVar.name.toString()}
                                                    </span>
                                                    {matchingSignatureVar.variable_role && (
                                                        <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs rounded">
                                                            {matchingSignatureVar.variable_role}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Developer section with raw signature description */}
                <div className="mt-4 border-t border-dashed border-gray-300 dark:border-gray-700 pt-4">
                    <details>
                        <summary className="cursor-pointer text-gray-600 dark:text-gray-400 font-medium text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded inline-block hover:bg-gray-200 dark:hover:bg-gray-700">
                            Developer View
                        </summary>
                        <pre className="mt-2 p-4 bg-gray-900 text-gray-200 rounded-md font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                            {workflowDescription}
                        </pre>
                    </details>
                </div>
            </div>
        );
    };

    // Render the chain outputs
    const renderChainOutputs = () => {
        // Filter the workflow chain state for output variables with FINAL role
        const finalOutputs = activeWorkflowChain.state?.filter(
            (variable: any) =>
                variable.io_type === 'output' &&
                variable.variable_role === WorkflowVariableRole.FINAL
        ) || [];

        if (finalOutputs.length === 0) {
            return <p>No outputs available yet.</p>;
        }

        return (
            <div className="mt-6">
                <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Chain Outputs:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {finalOutputs.map((variable: any) => {
                        // Get the variable name and value
                        const key = variable.name;
                        const value = variable.value || chainOutputs[key] || '';

                        return (
                            <div key={key} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 m-0">{key.toString().replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</h5>
                                    <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded">Final Output</span>
                                </div>
                                <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                                    {typeof value === 'object' && value !== null ? (
                                        <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
                                    ) : (
                                        <p className="m-0">{String(value || '')}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
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

    // Render the detail panel for the selected phase
    const renderDetailPanel = () => {
        switch (selectedPhase) {
            case 'input':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow min-h-[300px]">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Initial Inputs</h3>
                        <div className="flex flex-col gap-4 mb-5">
                            {workflowInputs.length > 0 ? (
                                workflowInputs.map(input => (
                                    <div key={input.name.toString()} className="flex flex-col gap-1.5">
                                        <label className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                            {input.name.toString()}
                                            {input.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        {input.schema.description && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{input.schema.description}</div>
                                        )}
                                        {input.schema.type === 'string' && input.schema.is_array ? (
                                            <textarea
                                                value={inputValues[input.name.toString()] || ''}
                                                onChange={(e) => handleInputChange(e, input.name.toString())}
                                                placeholder={`Enter ${input.name.toString()}...`}
                                                disabled={isRunning}
                                                rows={4}
                                                className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={inputValues[input.name.toString()] || ''}
                                                onChange={(e) => handleInputChange(e, input.name.toString())}
                                                placeholder={`Enter ${input.name.toString()}...`}
                                                disabled={isRunning}
                                                className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                                            />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-medium text-sm text-gray-700 dark:text-gray-300">Question</label>
                                    <input
                                        type="text"
                                        value={inputValues.question || ''}
                                        onChange={(e) => handleInputChange(e, 'question')}
                                        placeholder="Enter your question..."
                                        disabled={isRunning}
                                        className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                                    />
                                </div>
                            )}
                            <button
                                onClick={startWorkflow}
                                disabled={isRunning || (workflowInputs.length === 0 && !inputValues.question?.trim())}
                                className="mt-2 px-4 py-2.5 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors self-start disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isRunning ? 'Processing...' : 'Submit'}
                            </button>
                        </div>
                        {error && <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">{error}</div>}
                    </div>
                );

            case 'output':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow min-h-[300px]">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Workflow Results</h3>
                        {renderChainOutputs()}
                        <button
                            onClick={() => setSelectedPhase('input')}
                            disabled={isRunning}
                            className="mt-4 px-4 py-2.5 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Ask Another Question
                        </button>
                    </div>
                );

            default:
                // Find the phase in the workflow chain
                const phase = activeWorkflowChain.phases.find(p => p.id === selectedPhase);

                if (!phase) {
                    return <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow min-h-[300px]">Select a phase to view details</div>;
                }

                return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow min-h-[300px]">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">{phase.label}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{phase.description}</p>

                        <div className="mt-4">
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-500"
                                    style={{ width: `${getPhaseProgress(selectedPhase)}%` }}
                                ></div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Progress: {getPhaseProgress(selectedPhase)}%</p>
                        </div>

                        {/* Display workflow signature */}
                        {renderWorkflowSignature()}

                        {/* Display the workflow steps */}
                        {renderWorkflowSteps()}

                        {/* Display phase results if available */}
                        {phaseResults[selectedPhase] && (
                            <div className="mt-6">
                                <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Phase Results:</h4>
                                <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto text-sm">{JSON.stringify(phaseResults[selectedPhase], null, 2)}</pre>
                            </div>
                        )}

                        {/* Display chain outputs so far */}
                        {Object.keys(chainOutputs).length > 0 && (
                            <div className="mt-6">
                                <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Chain Outputs So Far:</h4>
                                {renderChainOutputs()}
                            </div>
                        )}
                    </div>
                );
        }
    };

    // Function to render workflow inputs
    const renderWorkflowInputs = () => {
        if (!workflowSignature) {
            return null;
        }

        // Helper function to check if all required inputs are provided
        const canStartWorkflow = () => {
            if (!workflowSignature) return false;

            return workflowSignature.inputs
                .filter(input => input.required)
                .every(input => {
                    const inputName = input.name.toString();
                    const value = workflowInputs[inputName as keyof typeof workflowInputs];
                    return value !== undefined && value !== '';
                });
        };

        return (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Workflow Inputs:</h4>
                <div className="grid grid-cols-1 gap-4">
                    {workflowSignature.inputs.map((input) => {
                        const inputName = input.name.toString();
                        const inputValue = workflowInputs[inputName as keyof typeof workflowInputs] || '';
                        const isRequired = input.required;

                        return (
                            <div key={inputName} className="bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <label htmlFor={`input-${inputName}`} className="font-medium text-gray-700 dark:text-gray-300">
                                            {inputName}
                                        </label>
                                        {isRequired && (
                                            <span className="px-1.5 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded">
                                                Required
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {input.schema.is_array ? `${input.schema.type}[]` : input.schema.type}
                                    </div>
                                </div>

                                {input.schema.description && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        {input.schema.description}
                                    </div>
                                )}

                                {input.schema.type === 'string' && (
                                    <div className="mt-1">
                                        <textarea
                                            id={`input-${inputName}`}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
                                            value={inputValue as string}
                                            onChange={(e) => handleInputChange(inputName, e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                )}

                                {input.schema.type === 'boolean' && (
                                    <div className="mt-1">
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                id={`input-${inputName}`}
                                                type="checkbox"
                                                className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                                                checked={inputValue === true}
                                                onChange={(e) => handleInputChange(inputName, e.target.checked)}
                                            />
                                            <span className="ml-2 text-gray-700 dark:text-gray-300">
                                                {inputValue === true ? 'True' : 'False'}
                                            </span>
                                        </label>
                                    </div>
                                )}

                                {input.schema.type === 'number' && (
                                    <div className="mt-1">
                                        <input
                                            id={`input-${inputName}`}
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
                                            value={inputValue as number}
                                            onChange={(e) => handleInputChange(inputName, parseFloat(e.target.value))}
                                        />
                                    </div>
                                )}

                                {/* For array inputs */}
                                {input.schema.is_array && (
                                    <div className="mt-1">
                                        <textarea
                                            id={`input-${inputName}`}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
                                            value={Array.isArray(inputValue) ? JSON.stringify(inputValue, null, 2) : inputValue as string}
                                            onChange={(e) => {
                                                try {
                                                    const parsedValue = JSON.parse(e.target.value);
                                                    handleInputChange(inputName, parsedValue);
                                                } catch (error) {
                                                    // Allow invalid JSON during typing
                                                    handleInputChange(inputName, e.target.value);
                                                }
                                            }}
                                            rows={5}
                                        />
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Enter valid JSON array
                                        </div>
                                    </div>
                                )}

                                {/* For object inputs */}
                                {input.schema.type === 'object' && !input.schema.is_array && (
                                    <div className="mt-1">
                                        <textarea
                                            id={`input-${inputName}`}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
                                            value={typeof inputValue === 'object' ? JSON.stringify(inputValue, null, 2) : inputValue as string}
                                            onChange={(e) => {
                                                try {
                                                    const parsedValue = JSON.parse(e.target.value);
                                                    handleInputChange(inputName, parsedValue);
                                                } catch (error) {
                                                    // Allow invalid JSON during typing
                                                    handleInputChange(inputName, e.target.value);
                                                }
                                            }}
                                            rows={5}
                                        />
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Enter valid JSON object
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 flex justify-end">
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={startWorkflow}
                        disabled={!canStartWorkflow()}
                    >
                        Start Workflow
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Sample Workflow Chain Demo</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                This demo shows how multiple workflows can be chained together, with outputs from one workflow becoming inputs to the next.
            </p>

            {/* Workflow Phases - Top Section */}
            {renderWorkflowPhases()}

            {/* Detail Panel - Bottom Section */}
            {renderDetailPanel()}
        </div>
    );
};

export default AgentWorkflowDemo; 