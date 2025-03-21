import { v4 as uuidv4 } from 'uuid';
import {
    ChatMessage,
    Stage,
    StageData,
    InformationAsset,
    WorkspaceItem,
    WorkflowStep
} from '../types/state';

// Define the stage data blocks type
export type StageDataBlocks = {
    [K in Stage]: StageData;
};

// Sample song data
export const BEATLES_SONGS = [
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

export const BEATLES_LYRICS = {
    'Hey Jude': "Hey Jude, don't make it bad\nTake a sad song and make it better...",
    'Let It Be': "When I find myself in times of trouble\nMother Mary comes to me...",
    'Yesterday': "Yesterday, all my troubles seemed so far away\nNow it looks as though they're here to stay...",
    'All You Need Is Love': "Love, love, love\nLove, love, love\nLove, love, love...",
    'Help!': "Help! I need somebody\nHelp! Not just anybody\nHelp! You know I need someone\nHelp!...",
    'Come Together': "Here come old flat top\nHe come grooving up slowly...",
    'Here Comes the Sun': "Here comes the sun, doo-doo-doo-doo\nHere comes the sun, and I say\nIt's alright...",
    'Something': "Something in the way she moves\nAttracts me like no other lover...",
    'While My Guitar Gently Weeps': "I look at you all, see the love there that's sleeping\nWhile my guitar gently weeps...",
    'A Day in the Life': "I read the news today, oh boy\nAbout a lucky man who made the grade..."
};

// Stage-specific data generators
export const generateSongListStep = (): { step: WorkflowStep; asset: InformationAsset } => {
    const step: WorkflowStep = {
        id: uuidv4(),
        name: 'Generate Beatles Song List',
        description: 'Create a comprehensive list of Beatles songs',
        status: 'running',
        agentType: 'user',
        level: 0,
        tools: []
    };

    const asset: InformationAsset = {
        id: 'beatlesSongList',
        stepId: step.id,
        type: 'data',
        name: 'Beatles Song List',
        content: BEATLES_SONGS,
        metadata: {
            timestamp: new Date().toISOString(),
            tags: ['songs', 'beatles', 'list']
        }
    };

    return { step, asset };
};

export const generateLyricsStep = (): { step: WorkflowStep; asset: InformationAsset } => {
    const step: WorkflowStep = {
        id: uuidv4(),
        name: 'Retrieve Song Lyrics',
        description: 'Fetch lyrics for all Beatles songs',
        status: 'running',
        agentType: 'user',
        level: 0,
        tools: []
    };

    const asset: InformationAsset = {
        id: 'lyricsDatabase',
        stepId: step.id,
        type: 'data',
        name: 'Beatles Lyrics Database',
        content: BEATLES_LYRICS,
        metadata: {
            timestamp: new Date().toISOString(),
            tags: ['lyrics', 'beatles', 'database']
        }
    };

    return { step, asset };
};

// Sample assets and workspace items
const sampleAssets: Record<string, InformationAsset> = {
    beatlesSongList: {
        id: 'beatlesSongList',
        type: 'data',
        name: 'Beatles Song List',
        content: BEATLES_SONGS,
        metadata: {
            timestamp: new Date().toISOString(),
            tags: ['songs', 'beatles']
        }
    },
    lyricsDatabase: {
        id: 'lyricsDatabase',
        type: 'data',
        name: 'Song Lyrics Database',
        content: BEATLES_LYRICS,
        metadata: {
            timestamp: new Date().toISOString(),
            tags: ['lyrics', 'database']
        }
    }
};

const sampleWorkspaceItems: Record<string, WorkspaceItem> = {
    songAnalysis: {
        id: 'songAnalysis',
        type: 'step',
        title: 'Analyze Beatles Songs',
        description: 'Count occurrences of "love" in Beatles songs',
        status: 'pending',
        createdAt: new Date().toISOString()
    }
};

// Stage data
export const FRACTAL_BOT_STATE: StageDataBlocks = {
    initial: {
        stage: 'initial',
        messages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'Hello! I\'m FractalBot. What question can I help you with today?',
            timestamp: new Date().toISOString()
        }],
        assets: [],
        nextStages: ['question_received'],
        prevStages: [],
        workspaceItems: []
    },

    question_received: {
        stage: 'question_received',
        messages: [{
            id: uuidv4(),
            role: 'user',
            content: 'Can you analyze how often the Beatles used the word "love" in their songs?',
            timestamp: new Date().toISOString()
        }],
        assets: [],
        nextStages: ['workflow_designing'],
        prevStages: ['initial'],
        workspaceItems: []
    },

    workflow_designing: {
        stage: 'workflow_designing',
        messages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'I\'ll help you analyze the Beatles\' use of "love". Here\'s what we\'ll do:\n1. Generate a list of Beatles songs\n2. Analyze the lyrics\n3. Create a summary of the findings',
            timestamp: new Date().toISOString()
        }],
        assets: [],
        nextStages: ['workflow_ready'],
        prevStages: ['question_received'],
        workspaceItems: []
    },

    workflow_ready: {
        stage: 'workflow_ready',
        messages: [{
            id: uuidv4(),
            role: 'user',
            content: 'Sounds good! Let\'s start.',
            timestamp: new Date().toISOString()
        }],
        assets: [],
        nextStages: ['workflow_started'],
        prevStages: ['workflow_designing'],
        workspaceItems: []
    },

    workflow_started: {
        stage: 'workflow_started',
        messages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'Starting the analysis...',
            timestamp: new Date().toISOString()
        }],
        assets: [],
        nextStages: ['compiling_songs'],
        prevStages: ['workflow_ready'],
        workspaceItems: []
    },

    compiling_songs: {
        stage: 'compiling_songs',
        messages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'Generating the list of Beatles songs...',
            timestamp: new Date().toISOString()
        }],
        assets: [],
        nextStages: ['songs_compiled'],
        prevStages: ['workflow_started'],
        workspaceItems: [sampleWorkspaceItems.songAnalysis]
    },

    songs_compiled: {
        stage: 'songs_compiled',
        messages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'Beatles song list compilation complete.',
            timestamp: new Date().toISOString()
        }],
        assets: [sampleAssets.beatlesSongList],
        nextStages: ['retrieving_lyrics'],
        prevStages: ['compiling_songs'],
        workspaceItems: [sampleWorkspaceItems.songAnalysis]
    },

    retrieving_lyrics: {
        stage: 'retrieving_lyrics',
        messages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'Retrieving lyrics for analysis...',
            timestamp: new Date().toISOString()
        }],
        assets: [sampleAssets.lyricsDatabase],
        nextStages: ['analyzing_lyrics'],
        prevStages: ['songs_compiled'],
        workspaceItems: [sampleWorkspaceItems.songAnalysis]
    },

    analyzing_lyrics: {
        stage: 'analyzing_lyrics',
        messages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'Analyzing the lyrics for occurrences of "love"...',
            timestamp: new Date().toISOString()
        }],
        assets: [sampleAssets.beatlesSongList, sampleAssets.lyricsDatabase],
        nextStages: ['workflow_complete'],
        prevStages: ['retrieving_lyrics'],
        workspaceItems: [sampleWorkspaceItems.songAnalysis]
    },

    workflow_complete: {
        stage: 'workflow_complete',
        messages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'Analysis complete! Here are the results...',
            timestamp: new Date().toISOString()
        }],
        assets: [sampleAssets.beatlesSongList, sampleAssets.lyricsDatabase],
        nextStages: [],
        prevStages: ['analyzing_lyrics'],
        workspaceItems: [{ ...sampleWorkspaceItems.songAnalysis, status: 'completed' }]
    }
};

// Define the structure of a demo state
interface DemoState {
    stage: Stage;
    description: string;
    addedMessages: ChatMessage[];
    addedAssets: InformationAsset[];
    addedWorkspaceItems: WorkspaceItem[];
    workflowSteps?: WorkflowStep[];
    stepDetails?: Record<string, {
        status: 'running' | 'completed' | 'error';
        content?: string;
        assets?: InformationAsset[];
    }>;
    phase: 'setup' | 'execution';
}

// Create the demo states array
export const demoStates: DemoState[] = [
    {
        stage: 'initial',
        description: 'Initial greeting from FractalBot',
        phase: 'setup',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'Hello! I\'m FractalBot. What question can I help you with today?',
            timestamp: new Date().toISOString()
        }],
        addedAssets: [],
        addedWorkspaceItems: []
    },
    {
        stage: 'question_received',
        description: 'User asks about Beatles love songs analysis',
        phase: 'setup',
        addedMessages: [{
            id: uuidv4(),
            role: 'user',
            content: 'Can you analyze how often the Beatles used the word "love" in their songs?',
            timestamp: new Date().toISOString()
        }],
        addedAssets: [],
        addedWorkspaceItems: []
    },
    {
        stage: 'workflow_designing',
        description: 'FractalBot proposes workflow steps',
        phase: 'setup',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'I\'ll help you analyze the Beatles\' use of "love". Here\'s what we\'ll do:\n1. Generate a list of Beatles songs\n2. Analyze the lyrics\n3. Create a summary of the findings',
            timestamp: new Date().toISOString()
        }],
        addedAssets: [],
        addedWorkspaceItems: []
    },
    {
        stage: 'workflow_ready',
        description: 'User agrees to the workflow',
        phase: 'setup',
        addedMessages: [{
            id: uuidv4(),
            role: 'user',
            content: 'Sounds good! Let\'s start.',
            timestamp: new Date().toISOString()
        }],
        addedAssets: [],
        addedWorkspaceItems: []
    },
    {
        stage: 'workflow_started',
        description: 'Workflow execution begins',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'Starting the analysis...',
            timestamp: new Date().toISOString()
        }],
        addedAssets: [],
        addedWorkspaceItems: [],
        workflowSteps: []
    },
    {
        stage: 'compiling_songs',
        description: 'Generate list of Beatles songs',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'Generating the list of Beatles songs...',
            timestamp: new Date().toISOString()
        }],
        addedAssets: [],
        addedWorkspaceItems: [{
            id: 'songAnalysis',
            type: 'step',
            title: 'Analyze Beatles Songs',
            description: 'Count occurrences of "love" in Beatles songs',
            status: 'pending',
            createdAt: new Date().toISOString()
        }],
        workflowSteps: [{
            id: uuidv4(),
            name: 'Generate Beatles Song List',
            description: 'Create a comprehensive list of Beatles songs',
            status: 'running',
            agentType: 'user',
            level: 0,
            tools: []
        }],
        stepDetails: {}
    },
    {
        stage: 'songs_compiled',
        description: 'Beatles songs list completed',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'Beatles song list compilation complete.',
            timestamp: new Date().toISOString()
        }],
        addedAssets: [{
            id: 'beatlesSongList',
            type: 'data',
            name: 'Beatles Song List',
            content: BEATLES_SONGS,
            metadata: {
                timestamp: new Date().toISOString(),
                tags: ['songs', 'beatles']
            }
        }],
        addedWorkspaceItems: [],
        workflowSteps: [{
            id: uuidv4(),
            name: 'Generate Beatles Song List',
            description: 'Create a comprehensive list of Beatles songs',
            status: 'completed',
            agentType: 'user',
            level: 0,
            tools: []
        }],
        stepDetails: {
            'step1': {
                status: 'completed',
                content: 'Beatles song list generated successfully.',
                assets: [{
                    id: 'beatlesSongList',
                    type: 'data',
                    name: 'Beatles Song List',
                    content: BEATLES_SONGS,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        tags: ['songs', 'beatles']
                    }
                }]
            }
        }
    },
    {
        stage: 'retrieving_lyrics',
        description: 'Fetch lyrics for all songs',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'Retrieving lyrics for analysis...',
            timestamp: new Date().toISOString()
        }],
        addedAssets: [{
            id: 'lyricsDatabase',
            type: 'data',
            name: 'Beatles Lyrics Database',
            content: BEATLES_LYRICS,
            metadata: {
                timestamp: new Date().toISOString(),
                tags: ['lyrics', 'beatles', 'database']
            }
        }],
        addedWorkspaceItems: [],
        workflowSteps: [{
            id: uuidv4(),
            name: 'Retrieve Song Lyrics',
            description: 'Fetch lyrics for all Beatles songs',
            status: 'completed',
            agentType: 'user',
            level: 0,
            tools: []
        }],
        stepDetails: {
            'step2': {
                status: 'completed',
                content: 'Lyrics database generated successfully.',
                assets: [{
                    id: 'lyricsDatabase',
                    type: 'data',
                    name: 'Beatles Lyrics Database',
                    content: BEATLES_LYRICS,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        tags: ['lyrics', 'beatles', 'database']
                    }
                }]
            }
        }
    },
    {
        stage: 'analyzing_lyrics',
        description: 'Analyze lyrics for love occurrences',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'Analyzing the lyrics for occurrences of "love"...',
            timestamp: new Date().toISOString()
        }],
        addedAssets: [],
        addedWorkspaceItems: [],
        workflowSteps: [{
            id: uuidv4(),
            name: 'Analyze Love References',
            description: 'Count and analyze occurrences of "love" in lyrics',
            status: 'running',
            agentType: 'assistant',
            level: 0,
            tools: []
        }]
    },
    {
        stage: 'workflow_complete',
        description: 'Analysis complete with results',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'Analysis complete! Here are the results...',
            timestamp: new Date().toISOString()
        }],
        addedAssets: [{
            id: 'analysisResults',
            type: 'analysis_output',
            name: 'Love Word Analysis',
            content: {
                totalOccurrences: 42,
                songsByLoveCount: {
                    'All You Need Is Love': 12,
                    'She Loves You': 8,
                    'Love Me Do': 6
                }
            },
            metadata: {
                timestamp: new Date().toISOString(),
                tags: ['analysis', 'beatles', 'love']
            }
        }],
        addedWorkspaceItems: [],
        workflowSteps: [{
            id: uuidv4(),
            name: 'Generate Analysis Report',
            description: 'Create final report of love word usage',
            status: 'completed',
            agentType: 'assistant',
            level: 0,
            tools: []
        }]
    }
]; 