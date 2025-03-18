import { v4 as uuidv4 } from 'uuid';
import {
    ChatMessage,
    SetupStage,
    ExecutionStage
} from './types';
import { WorkflowStep, StepDetails, ToolTemplate } from './types';

export const TOOL_TEMPLATES: ToolTemplate[] = [
    {
        id: 'search',
        name: 'Search Agent',
        description: 'Search and retrieve information from various sources',
        category: 'search',
        icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
    },
    {
        id: 'list_builder',
        name: 'List Builder Agent',
        description: 'Create and manage structured lists of items',
        category: 'list',
        icon: 'M4 6h16M4 12h16M4 18h16'
    },
    {
        id: 'data_analyzer',
        name: 'Data Analyzer Agent',
        description: 'Analyze and process data to extract insights',
        category: 'analysis',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    },
    {
        id: 'text_generator',
        name: 'Text Generator Agent',
        description: 'Generate text content based on input parameters',
        category: 'generation',
        icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
    }
];

export const SAMPLE_WORKFLOW_STEPS: WorkflowStep[] = [
    {
        id: uuidv4(),
        name: 'Compile Beatles Songs',
        description: 'Retrieve a comprehensive list of all Beatles songs from their official discography',
        status: 'pending',
        agentType: 'retrieval',
        result: null
    },
    {
        id: uuidv4(),
        name: 'Retrieve Song Lyrics',
        description: 'Fetch lyrics for each Beatles song from a reliable source',
        status: 'pending',
        agentType: 'retrieval',
        result: null
    },
    {
        id: uuidv4(),
        name: 'Analyze Love References',
        description: 'Count occurrences of the word "love" in each song\'s lyrics',
        status: 'pending',
        agentType: 'analysis',
        result: null
    },
    {
        id: uuidv4(),
        name: 'Tabulate Results',
        description: 'Create a summary table of songs containing the word "love" and their counts',
        status: 'pending',
        agentType: 'answer',
        result: null
    }
];

export const SAMPLE_MESSAGES: ChatMessage[] = [
    {
        id: uuidv4(),
        role: 'assistant',
        content: 'What answer resistant question can I help you run down today?!',
        timestamp: new Date().toISOString(),
        metadata: {
            phase: 'setup',
            subPhase: 'question_development',
            type: 'question'
        }
    }
];

// Message to show after first Send click
export const CLARIFICATION_MESSAGE: ChatMessage = {
    id: uuidv4(),
    role: 'assistant',
    content: 'I\'ll help you analyze the Beatles\' use of the word "love" in their songs. Let\'s first clarify the question and then I will help to design and run a custom agent to handle this. First, to clarify the question, does the word "love" have to be in the lyrics to count or just in the title?',
    timestamp: new Date().toISOString(),
    metadata: {
        phase: 'setup',
        subPhase: 'question_development',
        type: 'clarification'
    }
};

// Messages to show after entering Workflow Development phase
export const WORKFLOW_DEVELOPMENT_MESSAGES: ChatMessage[] = [
    {
        id: uuidv4(),
        role: 'assistant',
        content: 'I understand you want to analyze the Beatles songs for the word "love" in their lyrics. I\'ll create a custom workflow to handle this analysis.',
        timestamp: new Date().toISOString(),
        metadata: {
            phase: 'setup',
            subPhase: 'workflow_development',
            type: 'workflow'
        }
    },
    {
        id: uuidv4(),
        role: 'assistant',
        content: 'Let me design the workflow steps...',
        timestamp: new Date().toISOString(),
        metadata: {
            phase: 'setup',
            subPhase: 'workflow_development',
            type: 'workflow'
        }
    }
];

export const SAMPLE_STEP_DETAILS: Record<string, StepDetails> = {
    [SAMPLE_WORKFLOW_STEPS[0].id]: {
        inputs: {
            query: 'List all Beatles songs',
            timeRange: '1963-1970',
            source: 'Official Beatles Discography'
        },
        outputs: {},
        status: 'pending',
        progress: 0
    },
    [SAMPLE_WORKFLOW_STEPS[1].id]: {
        inputs: {
            songs: {
                totalCount: 213,
                albums: ['Please Please Me', 'With The Beatles', 'A Hard Day\'s Night', 'Beatles for Sale', 'Help!', 'Rubber Soul', 'Revolver', 'Sgt. Pepper\'s Lonely Hearts Club Band', 'Magical Mystery Tour', 'The Beatles (White Album)', 'Yellow Submarine', 'Abbey Road', 'Let It Be']
            }
        },
        outputs: {},
        status: 'pending',
        progress: 0
    },
    [SAMPLE_WORKFLOW_STEPS[2].id]: {
        inputs: {},
        outputs: {},
        status: 'pending',
        progress: 0
    },
    [SAMPLE_WORKFLOW_STEPS[3].id]: {
        inputs: {},
        outputs: {},
        status: 'pending',
        progress: 0
    }
};

export const SAMPLE_WORKFLOW_INPUTS: Record<string, any> = {
    query: 'Analyze Beatles songs for word "love"',
    timeRange: '1963-1970',
    targetWord: 'love',
    outputFormat: 'table'
};

// Define message blocks for each stage transition
export const STAGE_MESSAGE_BLOCKS: Record<SetupStage | ExecutionStage, ChatMessage[]> = {
    // Setup Phase Message Blocks
    initial: [
        {
            id: uuidv4(),
            role: 'assistant',
            content: 'What answer resistant question can I help you run down today?!',
            timestamp: new Date().toISOString(),
            metadata: {
                phase: 'setup',
                subPhase: 'question_development',
                type: 'question'
            }
        }
    ],
    clarification_requested: [
        {
            id: uuidv4(),
            role: 'user',
            content: 'How many Beatles songs contain the word "love" in their lyrics?',
            timestamp: new Date().toISOString(),
            metadata: {
                phase: 'setup',
                subPhase: 'question_development',
                type: 'question'
            }
        },
        {
            id: uuidv4(),
            role: 'assistant',
            content: 'Just to clarify - do you want to count songs where the word "love" appears in the lyrics, or just in the title?',
            timestamp: new Date().toISOString(),
            metadata: {
                phase: 'setup',
                subPhase: 'question_development',
                type: 'clarification'
            }
        }
    ],
    workflow_explanation: [
        {
            id: uuidv4(),
            role: 'user',
            content: 'It has to be lyrics.',
            timestamp: new Date().toISOString(),
            metadata: {
                phase: 'setup',
                subPhase: 'question_development',
                type: 'question'
            }
        }
        ,
        {
            id: uuidv4(),
            role: 'assistant',
            content: 'I understand you want to count songs where "love" appears in the lyrics. I\'ll create a custom workflow to analyze this.',
            timestamp: new Date().toISOString(),
            metadata: {
                phase: 'setup',
                subPhase: 'workflow_development',
                type: 'workflow'
            }
        }
    ],
    workflow_designing: [
        {
            id: uuidv4(),
            role: 'assistant',
            content: 'Designing workflow steps...',
            timestamp: new Date().toISOString(),
            metadata: {
                phase: 'setup',
                subPhase: 'workflow_development',
                type: 'workflow'
            }
        }
    ],
    workflow_ready: [], // No new messages, just shows the workflow

    // Execution Phase Message Blocks
    workflow_started: [
        {
            id: uuidv4(),
            role: 'assistant',
            content: 'Starting workflow execution...',
            timestamp: new Date().toISOString(),
            metadata: {
                phase: 'execution',
                type: 'workflow'
            }
        }
    ],
    compiling_songs: [
        {
            id: uuidv4(),
            role: 'assistant',
            content: 'Compiling list of Beatles songs...',
            timestamp: new Date().toISOString(),
            metadata: {
                phase: 'execution',
                type: 'workflow'
            }
        }
    ],
    retrieving_lyrics: [
        {
            id: uuidv4(),
            role: 'assistant',
            content: 'Retrieving lyrics for each song...',
            timestamp: new Date().toISOString(),
            metadata: {
                phase: 'execution',
                type: 'workflow'
            }
        }
    ],
    analyzing_lyrics: [
        {
            id: uuidv4(),
            role: 'assistant',
            content: 'Analyzing lyrics for occurrences of "love"...',
            timestamp: new Date().toISOString(),
            metadata: {
                phase: 'execution',
                type: 'workflow'
            }
        }
    ],
    tabulating_results: [
        {
            id: uuidv4(),
            role: 'assistant',
            content: 'Tabulating results...',
            timestamp: new Date().toISOString(),
            metadata: {
                phase: 'execution',
                type: 'workflow'
            }
        }
    ],
    workflow_complete: [
        {
            id: uuidv4(),
            role: 'assistant',
            content: 'Workflow execution complete! Here are the results...',
            timestamp: new Date().toISOString(),
            metadata: {
                phase: 'execution',
                type: 'result'
            }
        }
    ]
}; 