import { v4 as uuidv4 } from 'uuid';
import { DemoScript, DemoState } from '../fractal_bot_data';
import { Phase } from '../../types/state';

// Sample song data
const BEATLES_SONGS = [
    'Hey Jude',
    'Let It Be',
    'Yesterday',
    'All You Need Is Love',
    'Help!',
    'Come Together',
    'Here Comes the Sun',
    'Something',
    'While My Guitar Gently Weeps',
    'A Day in the Life'
];

// Define constant IDs for assets
const ASSET_IDS = {
    SONG_LIST: 'beatles-song-list',
    LYRICS_COLLECTION: 'beatles-lyrics',
    COMPARISON_REPORT: 'song-list-comparison'
} as const;

// Define constant IDs for agents
const AGENT_IDS = {
    SONG_LIST: 'song-list-agent',
    LYRICS_RETRIEVAL: 'lyrics-retrieval-agent',
    LIST_COMPARISON: 'list-comparison-agent'
} as const;

// Create the demo states array
const demoStates: DemoState[] = [
    {
        stage: 'initial',
        description: 'Initial greeting from FractalBot',
        phase: 'setup',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'Hello! I\'m FractalBot. What question can I help you with today?',
            timestamp: new Date().toISOString()
        }],
        addedAssets: [],
        workspaceUpdates: {
            added: [],
            updated: []
        },
        assetUpdates: []
    },
    {
        stage: 'question_received',
        description: 'User asks about Beatles love songs analysis',
        phase: 'setup',
        addedMessages: [{
            id: uuidv4(),
            role: 'user',
            type: 'text',
            content: 'Can you analyze how often the Beatles used the word "love" in their songs?',
            timestamp: new Date().toISOString()
        }],
        addedAssets: [],
        workspaceUpdates: {
            added: [],
            updated: []
        },
        assetUpdates: []
    },
    {
        stage: 'workflow_designing',
        description: 'FractalBot proposes workflow steps',
        phase: 'setup',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'action_prompt',
            content: 'I\'ll help you analyze the Beatles\' use of "love". I\'ll launch the following agents to help:\n\n1. Song List Agent - to compile a comprehensive list of Beatles songs\n2. Lyrics Retrieval Agent - to fetch lyrics for each song\n3. Analysis Agent - to process and analyze the lyrics\n\nWould you like me to proceed with this plan?',
            timestamp: new Date().toISOString(),
            actionButton: {
                label: 'Launch Agents',
                action: 'start_workflow'
            }
        }],
        addedAssets: [],
        workspaceUpdates: {
            added: [],
            updated: []
        },
        assetUpdates: []
    },
    {
        stage: 'workflow_started',
        description: 'User accepts the workflow',
        phase: 'setup',
        addedMessages: [{
            id: uuidv4(),
            role: 'user',
            type: 'text',
            content: 'Yes, let\'s proceed with the analysis.',
            timestamp: new Date().toISOString()
        }],
        addedAssets: [],
        workspaceUpdates: {
            added: [],
            updated: []
        },
        assetUpdates: []
    },
    {
        stage: 'compiling_songs',
        description: 'Generate list of Beatles songs',
        phase: 'execution',
        addedMessages: [
            {
                id: uuidv4(),
                role: 'assistant',
                content: "I've launched the Song List Agent to compile a comprehensive list of Beatles songs for our analysis.",
                timestamp: new Date().toISOString(),
                type: 'text'
            }
        ],
        workspaceUpdates: {
            added: [
                {
                    id: AGENT_IDS.SONG_LIST,
                    title: 'Song List Agent',
                    description: 'Compiling a comprehensive list of Beatles songs for analysis',
                    status: 'in_progress',
                    createdAt: new Date().toISOString()
                }
            ],
            updated: []
        },
        addedAssets: [{
            id: ASSET_IDS.SONG_LIST,
            type: 'data',
            name: 'Beatles Song List',
            content: BEATLES_SONGS,
            ready: false,
            metadata: {
                timestamp: new Date().toISOString(),
                tags: ['songs', 'beatles'],
                agentId: AGENT_IDS.SONG_LIST
            }
        }],
        assetUpdates: []
    },
    {
        stage: 'songs_compiled',
        description: 'Song list generated',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'action_prompt',
            content: 'The Song List Agent has completed its task. I\'ll now launch the Lyrics Retrieval Agent to fetch the lyrics for each song. Would you like to proceed?',
            timestamp: new Date().toISOString(),
            actionButton: {
                label: 'Fetch Lyrics',
                action: 'retrieve_lyrics'
            }
        }],
        workspaceUpdates: {
            added: [],
            updated: [
                {
                    id: AGENT_IDS.SONG_LIST,
                    updates: {
                        status: 'completed',
                        completedAt: new Date().toISOString()
                    }
                }
            ]
        },
        addedAssets: [],
        assetUpdates: [{
            id: ASSET_IDS.SONG_LIST,
            updates: {
                ready: true
            }
        }]
    },
    {
        stage: 'lyrics_retrieval_started',
        description: 'Starting lyrics retrieval',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'Launching the Lyrics Retrieval Agent now.',
            timestamp: new Date().toISOString()
        }],
        workspaceUpdates: {
            added: [
                {
                    id: AGENT_IDS.LYRICS_RETRIEVAL,
                    title: 'Lyrics Retrieval Agent',
                    description: 'Fetching lyrics for all Beatles songs from verified sources',
                    status: 'in_progress',
                    createdAt: new Date().toISOString()
                }
            ],
            updated: []
        },
        addedAssets: [{
            id: ASSET_IDS.LYRICS_COLLECTION,
            type: 'data',
            name: 'Beatles Lyrics Collection',
            content: 'Lyrics for all Beatles songs',
            ready: false,
            metadata: {
                timestamp: new Date().toISOString(),
                tags: ['lyrics', 'beatles'],
                agentId: AGENT_IDS.LYRICS_RETRIEVAL
            }
        }],
        assetUpdates: []
    },
    {
        stage: 'analysis_started',
        description: 'FractalBot starts analyzing song lyrics',
        phase: 'execution',
        addedMessages: [
            {
                id: uuidv4(),
                role: 'assistant',
                content: "The Lyrics Retrieval Agent has completed its task. Would you like me to launch the Analysis Agent to process the lyrics and analyze the usage of 'love'?",
                timestamp: new Date().toISOString(),
                type: 'action_prompt',
                actionButton: {
                    label: 'Start Analysis',
                    action: 'start_analysis'
                }
            }
        ],
        workspaceUpdates: {
            added: [],
            updated: [
                {
                    id: AGENT_IDS.LYRICS_RETRIEVAL,
                    updates: {
                        status: 'completed',
                        completedAt: new Date().toISOString()
                    }
                }
            ]
        },
        addedAssets: [],
        assetUpdates: [{
            id: ASSET_IDS.LYRICS_COLLECTION,
            updates: {
                ready: true
            }
        }]
    },
    {
        stage: 'user_added_asset',
        description: 'User mentions adding a new asset for comparison',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'user',
            type: 'text',
            content: "Actually I added a new asset to the list which is an old list of Beatles songs. Can you analyze that and compare it with the song list you created?",
            timestamp: new Date().toISOString()
        }],
        workspaceUpdates: {
            added: [],
            updated: []
        },
        addedAssets: [],
        assetUpdates: []
    },
    {
        stage: 'comparison_proposed',
        description: 'FractalBot proposes to launch List Comparison Agent',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'action_prompt',
            content: "I'll help you compare the two song lists. I'll launch the List Comparison Agent to analyze both lists and generate a detailed comparison report. Would you like me to proceed?",
            timestamp: new Date().toISOString(),
            actionButton: {
                label: 'Start Comparison',
                action: 'start_comparison'
            }
        }],
        workspaceUpdates: {
            added: [],
            updated: []
        },
        addedAssets: [],
        assetUpdates: []
    },
    {
        stage: 'comparison_started',
        description: 'List Comparison Agent begins analysis',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: "I've launched the List Comparison Agent. It will analyze both song lists and generate a detailed comparison report.",
            timestamp: new Date().toISOString()
        }],
        workspaceUpdates: {
            added: [
                {
                    id: AGENT_IDS.LIST_COMPARISON,
                    title: 'List Comparison Agent',
                    description: 'Comparing the original and user-provided Beatles song lists',
                    status: 'in_progress',
                    createdAt: new Date().toISOString()
                }
            ],
            updated: []
        },
        addedAssets: [{
            id: ASSET_IDS.COMPARISON_REPORT,
            type: 'data',
            name: 'Beatles Song Lists Comparison Report',
            content: 'Detailed comparison of original and user-provided Beatles song lists',
            ready: false,
            metadata: {
                timestamp: new Date().toISOString(),
                tags: ['comparison', 'analysis', 'beatles', 'songs'],
                icon: '🔄',
                type: 'comparison',
                agentId: AGENT_IDS.LIST_COMPARISON
            }
        }],
        assetUpdates: []
    },
    {
        stage: 'comparison_completed',
        description: 'List Comparison Agent completes analysis',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: "The List Comparison Agent has completed its analysis. I've added the comparison report to your assets. Would you like me to walk you through the key findings?",
            timestamp: new Date().toISOString()
        }],
        workspaceUpdates: {
            added: [],
            updated: [
                {
                    id: AGENT_IDS.LIST_COMPARISON,
                    updates: {
                        status: 'completed',
                        completedAt: new Date().toISOString()
                    }
                }
            ]
        },
        addedAssets: [],
        assetUpdates: [{
            id: ASSET_IDS.COMPARISON_REPORT,
            updates: {
                ready: true
            }
        }]
    }
];

// Create and export the Beatles demo script
export const beatlesDemoScript: DemoScript = {
    id: 'beatles-analysis',
    name: 'Beatles Song Analysis',
    description: 'Analyze the Beatles\' use of the word "love" in their songs',
    states: demoStates
}; 