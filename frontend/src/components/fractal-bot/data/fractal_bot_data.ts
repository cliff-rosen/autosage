import { v4 as uuidv4 } from 'uuid';
import {
    ChatMessage,
    Agent,
    Asset,
    Phase,
    MessageType
} from '../types/state';

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

// Define the demo state type
interface DemoState {
    stage: string;
    description: string;
    phase: Phase;
    addedMessages: ChatMessage[];
    addedAssets: Asset[];
    addedWorkspaceItems: Agent[];
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
            type: 'text',
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
            type: 'text',
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
            type: 'action_prompt',
            content: 'I\'ll help you analyze the Beatles\' use of "love". I\'ll launch the following agents to help:\n\n1. Song List Agent - to compile a comprehensive list of Beatles songs\n2. Lyrics Retrieval Agent - to fetch lyrics for each song\n3. Analysis Agent - to process and analyze the lyrics\n\nWould you like me to proceed with this plan?',
            timestamp: new Date().toISOString(),
            actionButton: {
                label: 'Launch Agents',
                action: 'start_workflow'
            }
        }],
        addedAssets: [],
        addedWorkspaceItems: []
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
        addedWorkspaceItems: []
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
        addedWorkspaceItems: [
            {
                id: uuidv4(),
                title: 'Song List Agent',
                description: 'Compiling a comprehensive list of Beatles songs for analysis',
                status: 'in_progress',
                createdAt: new Date().toISOString()
            }
        ],
        addedAssets: []
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
        addedWorkspaceItems: []
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
        addedWorkspaceItems: [{
            id: uuidv4(),
            title: 'Lyrics Retrieval Agent',
            description: 'Fetching lyrics for all Beatles songs from verified sources',
            status: 'in_progress',
            createdAt: new Date().toISOString()
        }],
        addedAssets: []
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
        addedWorkspaceItems: [],
        addedAssets: [{
            id: 'beatlesLyrics',
            type: 'data',
            name: 'Beatles Lyrics Collection',
            content: 'Lyrics for all Beatles songs',
            metadata: {
                timestamp: new Date().toISOString(),
                tags: ['lyrics', 'beatles']
            }
        }]
    }
]; 