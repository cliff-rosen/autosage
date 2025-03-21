import { v4 as uuidv4 } from 'uuid';
import {
    ChatMessage,
    Task,
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
    addedWorkspaceItems: Task[];
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
            content: 'I\'ll help you analyze the Beatles\' use of "love". Here\'s what we\'ll do:\n1. Generate a list of Beatles songs\n2. Analyze the lyrics\n3. Create a summary of the findings\n\nWould you like me to proceed with this plan?',
            timestamp: new Date().toISOString(),
            actionButton: {
                label: 'Start Analysis',
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
                content: "I'll start generating a comprehensive list of Beatles songs for our analysis. This may take a moment.",
                timestamp: new Date().toISOString(),
                type: 'text'
            }
        ],
        addedWorkspaceItems: [
            {
                id: uuidv4(),
                title: 'Generate Beatles Song List',
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
            content: 'I\'ve generated the list of Beatles songs. Shall I launch an agent to retrieve the lyrics from a verified source for each song on the list?',
            timestamp: new Date().toISOString(),
            actionButton: {
                label: 'Retrieve Lyrics',
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
            content: 'OK, working on that lyric retrieval.',
            timestamp: new Date().toISOString()
        }],
        addedWorkspaceItems: [{
            id: uuidv4(),
            title: 'Retrieve Lyrics',
            description: 'Retrieving lyrics for all Beatles songs from verified sources',
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
                content: "Now that I'm working on compiling the song list, let me explain the next steps of our analysis plan. We'll analyze each song's lyrics for instances of the word 'love' and its variations, then categorize them based on context and meaning. Would you like me to proceed with this analysis once the song list is ready?",
                timestamp: new Date().toISOString(),
                type: 'action_prompt',
                actionButton: {
                    label: 'Proceed with Analysis',
                    action: 'start_analysis'
                }
            }
        ],
        addedWorkspaceItems: [],
        addedAssets: []
    }
]; 