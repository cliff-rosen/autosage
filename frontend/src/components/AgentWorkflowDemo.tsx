import React, { useState, useEffect, useRef } from 'react';
import {
    AgentWorkflowOrchestrator,
    WorkflowMessage,
    WorkflowMessageType,
    WorkflowStatus,
    WorkflowStepStatus,
    OrchestrationPhase
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
    const [activeWorkflowChain, setActiveWorkflowChain] = useState<AgentWorkflowChain>(SAMPLE_WORKFLOW_CHAIN);
    const [chainInputValues, setChainInputValues] = useState<Record<string, any>>({});
    const [chainOutputs, setChainOutputs] = useState<Record<string, any>>({});
    const [selectedPhase, setSelectedPhase] = useState('input');
    const [currentSteps, setCurrentSteps] = useState<WorkflowStepStatus[]>([]);
    const [phaseResults, setPhaseResults] = useState<Record<string, any>>({});
    const [status, setStatus] = useState<WorkflowStatus>({
        phase: 'question_development',
        progress: 0,
        currentSteps: [],
        results: {}
    });
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [workflowMessages, setWorkflowMessages] = useState<WorkflowMessage[]>([]);

    // Create a ref to the orchestrator to avoid recreating it on each render
    const orchestratorRef = useRef<AgentWorkflowOrchestrator | null>(null);

    // Initialize the orchestrator if it doesn't exist
    if (!orchestratorRef.current) {
        const workflowEngine = new AgentWorkflowEngine();
        orchestratorRef.current = new AgentWorkflowOrchestrator(workflowEngine);
    }

    // Get the orchestrator from the ref
    const orchestrator = orchestratorRef.current;

    // Handle all workflow messages
    const handleWorkflowMessage = (message: WorkflowMessage) => {
        console.log('Workflow message:', message);

        // Store the message in our array
        setWorkflowMessages(prev => [...prev, message]);

        // Always update status
        setStatus(message.status);
        setCurrentSteps(message.status.currentSteps);

        // Update error state if present
        if (message.status.error) {
            setError(message.status.error);
        }

        switch (message.type) {
            case WorkflowMessageType.STATUS_UPDATE:
                // Update phase selection if not completed/failed
                if (message.status.phase !== 'completed' && message.status.phase !== 'failed') {
                    setSelectedPhase(message.status.phase);
                }
                break;

            case WorkflowMessageType.PHASE_COMPLETE:
                if (message.status.results) {
                    // Update phase results
                    setPhaseResults(prev => ({
                        ...prev,
                        ...message.status.results
                    }));

                    // Update chain outputs
                    setChainOutputs(prev => ({
                        ...prev,
                        ...message.status.results
                    }));
                }
                break;

            case WorkflowMessageType.WORKFLOW_COMPLETE:
                setSelectedPhase('output');
                setIsRunning(false);
                if (message.status.results) {
                    setChainOutputs(message.status.results);
                }
                break;

            case WorkflowMessageType.ERROR:
                setError(message.status.error || 'Unknown error');
                setIsRunning(false);
                break;
        }

        // Update running state based on status
        if (message.status.phase === 'completed' || message.status.phase === 'failed') {
            setIsRunning(false);
            if (message.status.phase === 'completed') {
                setSelectedPhase('output');
            }
        }
    };

    // Set up message handler when the component mounts
    useEffect(() => {
        if (orchestrator) {
            orchestrator.onMessage(handleWorkflowMessage);
        }
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
            setWorkflowMessages([]); // Clear previous messages

            // Execute the workflow chain with the input values
            await orchestrator.executeWorkflowChain(
                activeWorkflowChain,
                chainInputValues
            );
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
        if (!currentSteps || currentSteps.length === 0) {
            return <p>No steps available for this workflow.</p>;
        }

        return (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Current Steps:</h4>
                <ul className="list-none p-0 m-0">
                    {currentSteps.map((step, index) => (
                        <li key={step.id} className="p-3 mb-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-semibold">{index + 1}</span>
                                <strong className="flex-1 font-medium text-gray-800 dark:text-gray-200">{step.name}</strong>
                                <span className={`text-xs px-2 py-1 rounded ${step.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                    step.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    }`}>
                                    {step.status}
                                </span>
                            </div>
                            {step.message && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {step.message}
                                </div>
                            )}
                            {step.result && (
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                                        View Result
                                    </summary>
                                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-48">
                                        {JSON.stringify(step.result, null, 2)}
                                    </pre>
                                </details>
                            )}
                        </li>
                    ))}
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
                            className={`flex flex-col items-center justify-center cursor-pointer p-3 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:-translate-y-1 min-w-[100px] max-w-[150px] ${selectedPhase === phase.id ? 'bg-blue-50 dark:bg-blue-900/20 -translate-y-1 shadow' : ''
                                }`}
                            onClick={() => !isRunning && setSelectedPhase(phase.id)}
                        >
                            <div className={`w-10 h-10 flex items-center justify-center rounded-full mb-3 transition-colors ${selectedPhase === phase.id ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}>
                                {index + 1}
                            </div>
                            <div className={`text-sm text-center whitespace-nowrap ${selectedPhase === phase.id ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                {phase.label}
                            </div>
                            {status.phase === phase.id && (
                                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${status.progress}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Connector */}
                        {index < allPhases.length - 1 && (
                            <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 min-w-[20px] max-w-[100px] z-0" />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    // Render the input phase details
    const renderInputPhaseDetails = () => {
        return (
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {input.schema.is_array ? `${input.schema.type}[]` : input.schema.type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {input.required ? 'Yes' : 'No'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                        {input.schema.description || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // Render the output phase details
    const renderOutputPhaseDetails = () => {
        return (
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {variable.schema.is_array ? `${variable.schema.type}[]` : variable.schema.type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {variable.io_type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {variable.variable_role || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                        {variable.value ? JSON.stringify(variable.value) : '-'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-300">
                                    No workflow state available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Sample Workflow Chain Demo
                {isRunning && (
                    <span className="ml-4 text-sm font-normal text-blue-500">
                        Running... ({status.progress}%)
                    </span>
                )}
            </h2>

            {/* Section 1: Workflow Phases */}
            <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                {renderWorkflowPhases()}
            </div>

            {/* Section 2: Input Area */}
            <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow overflow-auto p-6">
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

            {/* Section 3: Phase Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-auto p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    {selectedPhase === 'input' ? 'Input Phase Details' :
                        selectedPhase === 'output' ? 'Final Results' :
                            `Phase: ${activeWorkflowChain.phases.find(p => p.id === selectedPhase)?.label || selectedPhase}`}
                </h3>

                {selectedPhase === 'input' && renderInputPhaseDetails()}
                {selectedPhase === 'output' && renderOutputPhaseDetails()}
                {selectedPhase !== 'input' && selectedPhase !== 'output' && (
                    <>
                        {renderWorkflowSteps()}
                        {phaseResults[selectedPhase] && (
                            <div className="mt-6">
                                <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Phase Results:</h4>
                                <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto text-sm text-gray-800 dark:text-gray-200">
                                    {JSON.stringify(phaseResults[selectedPhase], null, 2)}
                                </pre>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Section 4: Workflow Messages */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow overflow-auto">
                <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                        Workflow Messages
                        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                            ({workflowMessages.length} messages)
                        </span>
                    </h3>

                    {workflowMessages.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Phase</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">Progress</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {workflowMessages.map((message, index) => (
                                        <tr key={`${message.sessionId}-${index}`}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(message.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${message.type === WorkflowMessageType.STATUS_UPDATE ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                    message.type === WorkflowMessageType.PHASE_COMPLETE ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                        message.type === WorkflowMessageType.WORKFLOW_COMPLETE ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    }`}>
                                                    {message.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {message.status.phase}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${message.status.error ? 'bg-red-500' :
                                                                message.type === WorkflowMessageType.WORKFLOW_COMPLETE ? 'bg-green-500' :
                                                                    'bg-blue-500'
                                                                }`}
                                                            style={{ width: `${message.status.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                                        {message.status.progress}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-4">
                                                    {/* Current steps */}
                                                    {message.status.currentSteps.length > 0 && (
                                                        <details className="group" open>
                                                            <summary className="cursor-pointer flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 hover:text-gray-900 dark:hover:text-gray-100">
                                                                <svg className="w-5 h-5 mr-1.5 transform transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                                Current Steps ({message.status.currentSteps.length})
                                                            </summary>
                                                            <div className="pl-6 space-y-2">
                                                                {message.status.currentSteps.map(step => (
                                                                    <div key={step.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="font-medium text-gray-700 dark:text-gray-300">{step.name}</span>
                                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${step.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                                                step.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                                                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                                }`}>
                                                                                {step.status}
                                                                            </span>
                                                                        </div>
                                                                        {step.message && (
                                                                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                                                {step.message}
                                                                            </div>
                                                                        )}
                                                                        {step.result && (
                                                                            <details className="mt-2">
                                                                                <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                                                                                    View Result
                                                                                </summary>
                                                                                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-48">
                                                                                    {JSON.stringify(step.result, null, 2)}
                                                                                </pre>
                                                                            </details>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </details>
                                                    )}

                                                    {/* Error details */}
                                                    {message.status.error && (
                                                        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r">
                                                            <div className="flex">
                                                                <div className="flex-shrink-0">
                                                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                                <div className="ml-3">
                                                                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                                                                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                                                        {message.status.error}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Results */}
                                                    {message.status.results && Object.keys(message.status.results).length > 0 && (
                                                        <details className="group">
                                                            <summary className="cursor-pointer flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                                                                <svg className="w-5 h-5 mr-1.5 transform transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                                Results ({Object.keys(message.status.results).length})
                                                            </summary>
                                                            <div className="mt-2 pl-6">
                                                                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                                                    <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-96">
                                                                        {JSON.stringify(message.status.results, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        </details>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No workflow messages yet. Start a workflow to see messages here.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgentWorkflowDemo; 