import { v4 as uuidv4 } from 'uuid';
import {
    ChatMessage,
    Stage,
    StageData,
    InformationAsset,
    WorkspaceItem
} from '../types/state';

// Define the stage data blocks type
export type StageDataBlocks = {
    [K in Stage]: StageData;
};

// Sample assets and workspace items
const sampleAssets: Record<string, InformationAsset> = {
    beatlesSongList: {
        id: 'beatlesSongList',
        type: 'data',
        name: 'Beatles Song List',
        content: ['All You Need Is Love', 'Love Me Do', 'She Loves You'],
        metadata: {
            timestamp: new Date().toISOString(),
            tags: ['songs', 'beatles']
        }
    },
    lyricsDatabase: {
        id: 'lyricsDatabase',
        type: 'data',
        name: 'Song Lyrics Database',
        content: {},
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
        nextStages: ['retrieving_lyrics'],
        prevStages: ['workflow_started'],
        workspaceItems: []
    },

    retrieving_lyrics: {
        stage: 'retrieving_lyrics',
        messages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'Retrieving lyrics for analysis...',
            timestamp: new Date().toISOString()
        }],
        assets: [],
        nextStages: ['analyzing_lyrics'],
        prevStages: ['compiling_songs'],
        workspaceItems: []
    },

    analyzing_lyrics: {
        stage: 'analyzing_lyrics',
        messages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'Analyzing the lyrics for occurrences of "love"...',
            timestamp: new Date().toISOString()
        }],
        assets: [],
        nextStages: ['workflow_complete'],
        prevStages: ['retrieving_lyrics'],
        workspaceItems: []
    },

    workflow_complete: {
        stage: 'workflow_complete',
        messages: [{
            id: uuidv4(),
            role: 'assistant',
            content: 'Analysis complete! Here are the results...',
            timestamp: new Date().toISOString()
        }],
        assets: [],
        nextStages: [],
        prevStages: ['analyzing_lyrics'],
        workspaceItems: []
    }
}; 