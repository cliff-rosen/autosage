import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Types for our interactive workflow
type WorkflowPhase = 'question_submission' | 'question_refinement' | 'workflow_planning' | 'step_execution';
type WorkflowStep = {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    agentType: string;
    result?: any;
};

type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    metadata?: {
        phase?: WorkflowPhase;
        stepId?: string;
        type?: 'question' | 'clarification' | 'workflow' | 'result' | 'error';
    };
};

// Add new type for workflow step template
type WorkflowStepTemplate = {
    id: string;
    name: string;
    description: string;
    agentType: string;
};

// Add new type for step details
type StepDetails = {
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    status: string;
    progress: number;
};

const InteractiveWorkflowTest: React.FC = () => {
    // State for workflow phases
    const [currentPhase, setCurrentPhase] = useState<WorkflowPhase>('question_submission');
    const [isQuestionComplete, setIsQuestionComplete] = useState(false);
    const [isWorkflowAgreed, setIsWorkflowAgreed] = useState(false);

    // State for workflow steps
    const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
        {
            id: uuidv4(),
            name: 'Compile Beatles Songs',
            description: 'Retrieve a comprehensive list of all Beatles songs',
            status: 'completed',
            agentType: 'retrieval',
            result: {
                totalSongs: 213,
                albums: ['Please Please Me', 'With The Beatles', 'A Hard Day\'s Night', 'Beatles for Sale', 'Help!', 'Rubber Soul', 'Revolver', 'Sgt. Pepper\'s Lonely Hearts Club Band', 'Magical Mystery Tour', 'The Beatles (White Album)', 'Yellow Submarine', 'Abbey Road', 'Let It Be'],
                timeRange: '1963-1970'
            }
        },
        {
            id: uuidv4(),
            name: 'Retrieve Song Lyrics',
            description: 'Fetch lyrics for each Beatles song',
            status: 'running',
            agentType: 'retrieval',
            result: {
                processedSongs: 150,
                totalSongs: 213,
                progress: 70
            }
        },
        {
            id: uuidv4(),
            name: 'Analyze Love References',
            description: 'Count occurrences of the word "love" in each song',
            status: 'pending',
            agentType: 'analysis',
            result: null
        },
        {
            id: uuidv4(),
            name: 'Tabulate Results',
            description: 'Create a summary table of love references in Beatles songs',
            status: 'pending',
            agentType: 'answer',
            result: null
        }
    ]);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(1);

    // State for chat
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: uuidv4(),
            role: 'user',
            content: 'I want to analyze how many times the Beatles used the word "love" in their songs',
            timestamp: new Date().toISOString(),
            metadata: {
                phase: 'question_submission',
                type: 'question'
            }
        },
        {
            id: uuidv4(),
            role: 'assistant',
            content: 'I\'ll help you analyze the Beatles\' use of the word "love" in their songs. Let\'s create a workflow to compile their songs, retrieve lyrics, analyze the word usage, and create a summary.',
            timestamp: new Date().toISOString(),
            metadata: {
                phase: 'question_refinement',
                type: 'clarification'
            }
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Add initial step details
    const [stepDetails, setStepDetails] = useState<Record<string, StepDetails>>({
        [workflowSteps[0].id]: {
            inputs: {
                query: 'List all Beatles songs',
                timeRange: '1963-1970',
                source: 'Official Beatles Discography'
            },
            outputs: {
                songs: {
                    totalCount: 213,
                    albums: ['Please Please Me', 'With The Beatles', 'A Hard Day\'s Night', 'Beatles for Sale', 'Help!', 'Rubber Soul', 'Revolver', 'Sgt. Pepper\'s Lonely Hearts Club Band', 'Magical Mystery Tour', 'The Beatles (White Album)', 'Yellow Submarine', 'Abbey Road', 'Let It Be'],
                    timeRange: '1963-1970'
                }
            },
            status: 'completed',
            progress: 100
        },
        [workflowSteps[1].id]: {
            inputs: {
                songs: {
                    totalCount: 213,
                    albums: ['Please Please Me', 'With The Beatles', 'A Hard Day\'s Night', 'Beatles for Sale', 'Help!', 'Rubber Soul', 'Revolver', 'Sgt. Pepper\'s Lonely Hearts Club Band', 'Magical Mystery Tour', 'The Beatles (White Album)', 'Yellow Submarine', 'Abbey Road', 'Let It Be']
                }
            },
            outputs: {
                lyrics: {
                    processedSongs: 150,
                    totalSongs: 213,
                    progress: 70,
                    sampleLyrics: {
                        'All You Need Is Love': 'Love, love, love...',
                        'Love Me Do': 'Love, love me do...'
                    }
                }
            },
            status: 'running',
            progress: 70
        },
        [workflowSteps[2].id]: {
            inputs: {},
            outputs: {},
            status: 'pending',
            progress: 0
        },
        [workflowSteps[3].id]: {
            inputs: {},
            outputs: {},
            status: 'pending',
            progress: 0
        }
    });

    // Add initial workflow inputs
    const [workflowInputs, setWorkflowInputs] = useState<Record<string, any>>({
        query: 'Analyze Beatles songs for word "love"',
        timeRange: '1963-1970',
        targetWord: 'love',
        outputFormat: 'table'
    });

    // Refs
    const chatEndRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Add new state for workflow planning
    const [availableStepTemplates, setAvailableStepTemplates] = useState<WorkflowStepTemplate[]>([
        {
            id: 'retrieval',
            name: 'Retrieval Agent',
            description: 'Retrieve information from various sources',
            agentType: 'retrieval'
        },
        {
            id: 'analysis',
            name: 'Analysis Agent',
            description: 'Analyze and process data',
            agentType: 'analysis'
        },
        {
            id: 'answer',
            name: 'Answer Agent',
            description: 'Generate structured answers and summaries',
            agentType: 'answer'
        }
    ]);

    // Add new state for selected template
    const [selectedTemplate, setSelectedTemplate] = useState<WorkflowStepTemplate | null>(null);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle sending a message
    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isProcessing) return;

        const userMessage: ChatMessage = {
            id: uuidv4(),
            role: 'user',
            content: inputMessage,
            timestamp: new Date().toISOString(),
            metadata: {
                phase: currentPhase,
                stepId: currentStepIndex >= 0 ? workflowSteps[currentStepIndex].id : undefined,
                type: getMessageType()
            }
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsProcessing(true);

        try {
            // TODO: Implement actual agent response logic
            const agentResponse: ChatMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: 'This is a placeholder response. The actual agent response will be implemented here.',
                timestamp: new Date().toISOString(),
                metadata: {
                    phase: currentPhase,
                    stepId: currentStepIndex >= 0 ? workflowSteps[currentStepIndex].id : undefined,
                    type: getMessageType()
                }
            };

            setMessages(prev => [...prev, agentResponse]);

            // Handle phase transitions based on agent response
            handlePhaseTransition(agentResponse);
        } catch (error) {
            console.error('Error processing message:', error);
            // Add error message to chat
            setMessages(prev => [...prev, {
                id: uuidv4(),
                role: 'assistant',
                content: 'Sorry, there was an error processing your message. Please try again.',
                timestamp: new Date().toISOString(),
                metadata: {
                    phase: currentPhase,
                    stepId: currentStepIndex >= 0 ? workflowSteps[currentStepIndex].id : undefined,
                    type: 'error'
                }
            }]);
        } finally {
            setIsProcessing(false);
        }
    };

    // Determine message type based on current phase
    const getMessageType = (): 'question' | 'clarification' | 'workflow' | 'result' => {
        switch (currentPhase) {
            case 'question_submission':
            case 'question_refinement':
                return 'question';
            case 'workflow_planning':
                return 'workflow';
            case 'step_execution':
                return 'result';
            default:
                return 'clarification';
        }
    };

    // Handle phase transitions based on agent response
    const handlePhaseTransition = (response: ChatMessage) => {
        switch (currentPhase) {
            case 'question_submission':
                if (isQuestionComplete) {
                    setCurrentPhase('workflow_planning');
                } else {
                    setCurrentPhase('question_refinement');
                }
                break;
            case 'question_refinement':
                if (isQuestionComplete) {
                    setCurrentPhase('workflow_planning');
                }
                break;
            case 'workflow_planning':
                if (isWorkflowAgreed) {
                    setCurrentPhase('step_execution');
                    setCurrentStepIndex(0);
                }
                break;
            case 'step_execution':
                if (currentStepIndex < workflowSteps.length - 1) {
                    setCurrentStepIndex(prev => prev + 1);
                }
                break;
        }
    };

    // Render the current phase indicator
    const renderPhaseIndicator = () => {
        const phases = [
            { id: 'question_submission', label: 'Question Submission' },
            { id: 'question_refinement', label: 'Question Refinement' },
            { id: 'workflow_planning', label: 'Workflow Planning' },
            { id: 'step_execution', label: 'Step Execution' }
        ];

        return (
            <div className="flex items-center justify-between mb-6">
                {phases.map((phase, index) => (
                    <React.Fragment key={phase.id}>
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentPhase === phase.id
                                ? 'bg-blue-500 text-white'
                                : phases.findIndex(p => p.id === currentPhase) > index
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}>
                                {index + 1}
                            </div>
                            <span className={`ml-2 text-sm font-medium ${currentPhase === phase.id
                                ? 'text-blue-500'
                                : phases.findIndex(p => p.id === currentPhase) > index
                                    ? 'text-green-500'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                {phase.label}
                            </span>
                        </div>
                        {index < phases.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-4 ${phases.findIndex(p => p.id === currentPhase) > index
                                ? 'bg-green-500'
                                : 'bg-gray-200 dark:bg-gray-700'
                                }`} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    // Add function to complete question
    const handleCompleteQuestion = () => {
        setIsQuestionComplete(true);
        setCurrentPhase('workflow_planning');
    };

    // Add function to add workflow step
    const handleAddWorkflowStep = () => {
        if (!selectedTemplate) return;

        const newStep: WorkflowStep = {
            id: uuidv4(),
            name: selectedTemplate.name,
            description: selectedTemplate.description,
            status: 'pending',
            agentType: selectedTemplate.agentType
        };

        setWorkflowSteps(prev => [...prev, newStep]);
        setSelectedTemplate(null);
    };

    // Add function to complete workflow planning
    const handleCompleteWorkflow = () => {
        setIsWorkflowAgreed(true);
        setCurrentPhase('step_execution');
        setCurrentStepIndex(0);
    };

    // Add function to update step details
    const updateStepDetails = (stepId: string, details: Partial<StepDetails>) => {
        setStepDetails(prev => ({
            ...prev,
            [stepId]: {
                ...prev[stepId],
                ...details
            }
        }));
    };

    // Add function to update workflow inputs
    const updateWorkflowInputs = (inputs: Record<string, any>) => {
        setWorkflowInputs(prev => ({
            ...prev,
            ...inputs
        }));
    };

    // Render the chat interface
    const renderChat = () => {
        return (
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {currentPhase === 'step_execution' && currentStepIndex >= 0
                            ? `Step ${currentStepIndex + 1}: ${workflowSteps[currentStepIndex]?.name}`
                            : currentPhase === 'question_submission'
                                ? 'Submit Your Question'
                                : currentPhase === 'question_refinement'
                                    ? 'Refine Your Question'
                                    : 'Plan the Workflow'}
                    </h3>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                <div className="mt-1 text-xs opacity-70">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type your message..."
                            disabled={isProcessing}
                            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isProcessing || !inputMessage.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'Processing...' : 'Send'}
                        </button>
                        {currentPhase === 'question_refinement' && !isQuestionComplete && (
                            <button
                                onClick={handleCompleteQuestion}
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                Complete Question
                            </button>
                        )}
                        {currentPhase === 'workflow_planning' && !isWorkflowAgreed && (
                            <button
                                onClick={handleCompleteWorkflow}
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                Complete Workflow
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Update the main layout structure
    return (
        <div className="container mx-auto px-4 py-8 max-w-[2000px]">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                Interactive Workflow Test
            </h2>

            {/* Phase Indicator */}
            {renderPhaseIndicator()}

            {/* Main Content Area - Fixed height container with consistent layout */}
            <div className="flex gap-6 h-[calc(100vh-200px)]">
                {/* Chat Panel - Fixed width and full height */}
                <div className="w-[400px] flex flex-col">
                    {renderChat()}
                </div>

                {/* Main Content Panel - Takes up remaining width */}
                <div className="flex-1 overflow-hidden">
                    {currentPhase === 'question_submission' ? (
                        // Question Submission - Only show chat
                        <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                            <p>Please enter your question in the chat window on the left.</p>
                        </div>
                    ) : currentPhase === 'question_refinement' ? (
                        // Question Refinement - Show refined question
                        <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                Refined Question
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {messages[messages.length - 1]?.role === 'assistant'
                                        ? messages[messages.length - 1].content
                                        : 'Your question will be refined as we discuss it in the chat.'}
                                </p>
                            </div>
                        </div>
                    ) : currentPhase === 'workflow_planning' ? (
                        // Workflow Planning - Show workflow steps
                        <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                Workflow Steps
                            </h3>
                            <div className="space-y-4">
                                {workflowSteps.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <p>No steps added yet. Discuss the workflow in the chat to add steps.</p>
                                    </div>
                                ) : (
                                    workflowSteps.map((step, index) => (
                                        <div
                                            key={step.id}
                                            className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h5 className="font-medium text-gray-800 dark:text-gray-200">
                                                        {index + 1}. {step.name}
                                                    </h5>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {step.description}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {step.agentType}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        // Step Execution - Show four panes
                        <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            {/* Get current step details */}
                            {(() => {
                                const currentStep = workflowSteps[currentStepIndex];
                                const currentStepDetails = stepDetails[currentStep?.id] || {
                                    inputs: {},
                                    outputs: {},
                                    status: 'pending',
                                    progress: 0
                                };
                                return (
                                    <div className="grid grid-cols-4 gap-6 h-[calc(100%-3rem)]">
                                        {/* Step List */}
                                        <div className="overflow-y-auto">
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                                Workflow Steps
                                            </h3>
                                            <div className="space-y-2">
                                                {workflowSteps.map((step, index) => (
                                                    <div
                                                        key={step.id}
                                                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${index === currentStepIndex
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-500'
                                                            }`}
                                                        onClick={() => setCurrentStepIndex(index)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h5 className="font-medium text-gray-800 dark:text-gray-200">
                                                                    {index + 1}. {step.name}
                                                                </h5>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {step.description}
                                                                </p>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${step.status === 'completed'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                : step.status === 'running'
                                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                    : step.status === 'failed'
                                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                                                }`}>
                                                                {step.status}
                                                            </span>
                                                        </div>
                                                        {step.status === 'running' && (
                                                            <div className="mt-2">
                                                                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-blue-500 transition-all duration-500"
                                                                        style={{ width: `${currentStepDetails.progress}%` }}
                                                                    />
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                    {currentStepDetails.progress}%
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Add Step Button */}
                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <button
                                                    className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                                                    onClick={() => {
                                                        // Add a new step after the current one
                                                        const newStep: WorkflowStep = {
                                                            id: uuidv4(),
                                                            name: 'New Step',
                                                            description: 'Add a description for this step',
                                                            status: 'pending',
                                                            agentType: 'analysis'
                                                        };
                                                        setWorkflowSteps(prev => {
                                                            const newSteps = [...prev];
                                                            newSteps.splice(currentStepIndex + 1, 0, newStep);
                                                            return newSteps;
                                                        });
                                                        setStepDetails(prev => ({
                                                            ...prev,
                                                            [newStep.id]: {
                                                                inputs: {},
                                                                outputs: {},
                                                                status: 'pending',
                                                                progress: 0
                                                            }
                                                        }));
                                                    }}
                                                >
                                                    Add Step After This
                                                </button>
                                            </div>
                                        </div>

                                        {/* Step Details */}
                                        <div className="overflow-y-auto">
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                                Step Details
                                            </h3>
                                            {currentStep ? (
                                                <div className="space-y-4">
                                                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Description
                                                        </h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {currentStep.description}
                                                        </p>
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Agent Type
                                                        </h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {currentStep.agentType}
                                                        </p>
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Status
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentStep.status === 'completed'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                : currentStep.status === 'running'
                                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                    : currentStep.status === 'failed'
                                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                                                }`}>
                                                                {currentStep.status}
                                                            </span>
                                                            {currentStep.status === 'running' && (
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {currentStepDetails.progress}%
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    Select a step to view details
                                                </p>
                                            )}
                                        </div>

                                        {/* Information Palette (formerly Variables) */}
                                        <div className="col-span-2 overflow-y-auto">
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                                Information Palette
                                            </h3>
                                            {currentStep ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    {Object.entries({
                                                        ...currentStepDetails.inputs,
                                                        ...currentStepDetails.outputs
                                                    }).map(([key, value]) => (
                                                        <div
                                                            key={key}
                                                            className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 cursor-move hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                                                            draggable
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                {/* Icon based on value type */}
                                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                                    {Array.isArray(value) ? (
                                                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                                        </svg>
                                                                    ) : typeof value === 'object' ? (
                                                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                                        </svg>
                                                                    ) : (
                                                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                                            {key}
                                                                        </span>
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {Array.isArray(value) ? `${value.length} items` :
                                                                                typeof value === 'object' ? 'Object' :
                                                                                    typeof value}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                                        {Array.isArray(value) ?
                                                                            `${value.length} items` :
                                                                            typeof value === 'object' ?
                                                                                Object.keys(value).length + ' properties' :
                                                                                String(value)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    Select a step to view information
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InteractiveWorkflowTest; 