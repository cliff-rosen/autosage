import { v4 as uuidv4 } from 'uuid';
import {
    ChatMessage,
    SetupStage,
    ExecutionStage
} from '../../interactive-workflow/types';

// Define a type that combines all possible stages
export type Stage = SetupStage | ExecutionStage;

// Define the message blocks type
export type StageMessageBlocks = {
    [K in Stage]: ChatMessage[];
};

export const FRACTAL_BOT_MESSAGES: StageMessageBlocks = {
    // Setup Phase Messages
    initial: [{
        id: uuidv4(),
        role: 'assistant',
        content: 'Hello! I\'m FractalBot. What question can I help you with today?',
        timestamp: new Date().toISOString()
    }],
    question_received: [{
        id: uuidv4(),
        role: 'user',
        content: 'Can you analyze how often the Beatles used the word "love" in their songs?',
        timestamp: new Date().toISOString()
    }],
    clarification_requested: [{
        id: uuidv4(),
        role: 'assistant',
        content: 'To better analyze this, I need to know: Should we count "love" only in the lyrics, or should we include song titles too? Also, should we count variations like "loved" or "loving"?',
        timestamp: new Date().toISOString()
    }],
    request_confirmation: [{
        id: uuidv4(),
        role: 'user',
        content: 'Let\'s focus on just the word "love" in the lyrics, not variations or titles.',
        timestamp: new Date().toISOString()
    }],
    workflow_designing: [{
        id: uuidv4(),
        role: 'assistant',
        content: 'Great! I\'m designing a workflow that will:\n1. Compile a list of Beatles songs\n2. Retrieve the lyrics for each song\n3. Count occurrences of "love"\n4. Analyze the results',
        timestamp: new Date().toISOString()
    }],
    workflow_explanation: [{
        id: uuidv4(),
        role: 'assistant',
        content: 'Here\'s how we\'ll analyze the Beatles\' use of "love":\n\n1. First, we\'ll gather a comprehensive list of Beatles songs\n2. Then, we\'ll fetch the lyrics for each song\n3. We\'ll count exact matches of "love" in each song\n4. Finally, we\'ll create a summary showing usage statistics',
        timestamp: new Date().toISOString()
    }],
    workflow_ready: [{
        id: uuidv4(),
        role: 'user',
        content: 'Yes, that sounds perfect! Let\'s start!',
        timestamp: new Date().toISOString()
    }],

    // Execution Phase Messages
    workflow_started: [{
        id: uuidv4(),
        role: 'assistant',
        content: 'Starting the analysis of Beatles songs for the word "love"...',
        timestamp: new Date().toISOString()
    }],
    compiling_songs: [{
        id: uuidv4(),
        role: 'assistant',
        content: 'Compiling the complete list of Beatles songs from their official discography...',
        timestamp: new Date().toISOString()
    }],
    retrieving_lyrics: [{
        id: uuidv4(),
        role: 'assistant',
        content: 'Found 213 songs. Now retrieving lyrics for each song...',
        timestamp: new Date().toISOString()
    }],
    analyzing_lyrics: [{
        id: uuidv4(),
        role: 'assistant',
        content: 'Analyzing the lyrics of each song to count occurrences of "love"...',
        timestamp: new Date().toISOString()
    }],
    tabulating_results: [{
        id: uuidv4(),
        role: 'assistant',
        content: 'Analysis complete! Organizing the findings into a comprehensive report...',
        timestamp: new Date().toISOString()
    }],
    workflow_complete: [{
        id: uuidv4(),
        role: 'assistant',
        content: 'Analysis finished! Here are the results:\n\n- Total occurrences of "love": 613\n- Most uses in a single song: "All You Need Is Love" (6 times)\n- Average uses per song: 2.87\n- 76% of their songs contain at least one instance of "love"',
        timestamp: new Date().toISOString()
    }]
}; 