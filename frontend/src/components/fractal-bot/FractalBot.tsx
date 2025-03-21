import React, { useState, useEffect } from 'react';
import { ChatSection } from './components/ChatSection';
import { WorkspaceSection } from './components/WorkspaceSection';
import { AssetsSection } from './components/AssetsSection';
import { demoStates } from './data/fractal_bot_data';
import { FractalBotState, createInitialState } from './types/state';

interface FractalBotProps {
    onComplete?: (result: any) => void;
}

export const FractalBot: React.FC<FractalBotProps> = ({ onComplete }) => {
    const [state, setState] = useState<FractalBotState>(createInitialState());
    const [currentDemoIndex, setCurrentDemoIndex] = useState(0);
    const [pendingActionState, setPendingActionState] = useState<typeof demoStates[0] | null>(null);

    // Initialize with the first demo state
    useEffect(() => {
        applyDemoState(demoStates[0]);
    }, []);

    // Apply the changes from a demo state
    const applyDemoState = (demoState: typeof demoStates[0]) => {
        setState(prev => {
            // Add new messages, preventing duplicates by ID
            const existingMessageIds = new Set(prev.messages.map(m => m.id));
            const newMessages = demoState.addedMessages.filter(m => !existingMessageIds.has(m.id));
            const messages = [...prev.messages, ...newMessages];

            // Add new agents and update existing ones
            const agents = { ...prev.agents };

            // Add new agents
            demoState.addedWorkspaceItems.forEach(item => {
                agents[item.id] = item;
            });

            // Update existing agents based on stage
            if (demoState.stage === 'songs_compiled') {
                // Find and update the song generation agent
                Object.keys(agents).forEach(agentId => {
                    const agent = agents[agentId];
                    if (agent.title === 'Generate Beatles Song List') {
                        agents[agentId] = {
                            ...agent,
                            status: 'completed',
                            completedAt: new Date().toISOString()
                        };
                    }
                });
            } else if (demoState.stage === 'analysis_started') {
                // Find and update the lyrics retrieval agent
                Object.keys(agents).forEach(agentId => {
                    const agent = agents[agentId];
                    if (agent.title === 'Retrieve Lyrics') {
                        agents[agentId] = {
                            ...agent,
                            status: 'completed',
                            completedAt: new Date().toISOString()
                        };
                    }
                });
            }

            // Add new assets, preventing duplicates by ID
            const existingAssetIds = new Set(prev.assets.map(a => a.id));
            const newAssets = demoState.addedAssets.filter(a => !existingAssetIds.has(a.id));
            const assets = [...prev.assets, ...newAssets];

            return {
                ...prev,
                messages,
                agents,
                assets,
                phase: demoState.phase,
                metadata: {
                    ...prev.metadata,
                    lastUpdated: new Date().toISOString()
                }
            };
        });
    };

    // Handle moving to the next demo state
    const handleNext = () => {
        if (currentDemoIndex < demoStates.length - 1) {
            const nextState = demoStates[currentDemoIndex + 1];
            // Apply the full next state immediately
            applyDemoState(nextState);
            setCurrentDemoIndex(currentDemoIndex + 1);
        }
    };

    // Simplified action button handler for demo purposes
    const handleActionButton = (action: string) => {
        // In demo mode, action buttons are just for show
        console.log('Demo action button clicked:', action);
    };

    // Handle restart
    const handleRestart = () => {
        setState(createInitialState());
        setCurrentDemoIndex(0);
        setPendingActionState(null);
        // Apply the initial state after reset
        applyDemoState(demoStates[0]);
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    FractalBot Demo
                </h2>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden p-4 pb-2">
                {/* Left Column: Chat */}
                <div className="w-[400px] flex-shrink-0 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mr-4">
                    <ChatSection
                        messages={state.messages}
                        inputMessage=""
                        isProcessing={false}
                        onSendMessage={() => { }}
                        onInputChange={() => { }}
                        onActionButtonClick={handleActionButton}
                    />
                </div>

                {/* Right Column: Workspace and Assets */}
                <div className="flex-1 flex flex-col space-y-4">
                    {/* Workspace Section */}
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <WorkspaceSection
                            agents={Object.values(state.agents)}
                        />
                    </div>

                    {/* Assets Section */}
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <AssetsSection
                            assets={state.assets}
                        />
                    </div>
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex-none p-4 pt-2">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <button
                            onClick={handleRestart}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restart Demo
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleNext}
                            disabled={currentDemoIndex >= demoStates.length - 1}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            Next
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FractalBot; 