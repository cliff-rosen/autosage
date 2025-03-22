import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatSection } from './components/ChatSection';
import { WorkspaceSection } from './components/WorkspaceSection';
import { AssetsSection } from './components/AssetsSection';
import { demoScripts, defaultDemoScript, DemoScript } from './data/fractal_bot_data';
import { FractalBotState, createInitialState, Asset } from './types/state';

interface FractalBotProps {
    onComplete?: (result: any) => void;
}

export const FractalBot: React.FC<FractalBotProps> = ({ onComplete }) => {
    const [state, setState] = useState<FractalBotState>(createInitialState());
    const [currentDemoIndex, setCurrentDemoIndex] = useState(0);
    const [pendingActionState, setPendingActionState] = useState<DemoScript['states'][0] | null>(null);
    const [selectedDemoScript, setSelectedDemoScript] = useState<DemoScript>(defaultDemoScript);

    // Initialize with the first demo state
    useEffect(() => {
        applyDemoState(selectedDemoScript.states[0]);
    }, [selectedDemoScript]);

    // Apply the changes from a demo state
    const applyDemoState = (demoState: DemoScript['states'][0]) => {
        setState(prev => {
            // Add new messages, preventing duplicates by ID
            const existingMessageIds = new Set(prev.messages.map(m => m.id));
            const newMessages = demoState.addedMessages.filter(m => !existingMessageIds.has(m.id));
            const messages = [...prev.messages, ...newMessages];

            // Add new agents and update existing ones
            const agents = { ...prev.agents };

            // Add new agents
            demoState.workspaceUpdates.added.forEach(item => {
                agents[item.id] = item;
            });

            // Update existing agents
            demoState.workspaceUpdates.updated.forEach(update => {
                if (agents[update.id]) {
                    agents[update.id] = {
                        ...agents[update.id],
                        ...update.updates
                    };
                }
            });

            // Add new assets, preventing duplicates by ID
            const existingAssetIds = new Set(prev.assets.map(a => a.id));
            const newAssets = demoState.addedAssets.filter(a => !existingAssetIds.has(a.id));
            const assets = [...prev.assets];

            // Add new assets
            newAssets.forEach(asset => {
                assets.push(asset);
            });

            // Update existing assets
            demoState.assetUpdates.forEach(update => {
                const assetIndex = assets.findIndex(a => a.id === update.id);
                if (assetIndex !== -1) {
                    assets[assetIndex] = {
                        ...assets[assetIndex],
                        ...update.updates
                    };
                }
            });

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
        if (currentDemoIndex < selectedDemoScript.states.length - 1) {
            const nextState = selectedDemoScript.states[currentDemoIndex + 1];
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
        applyDemoState(selectedDemoScript.states[0]);
    };

    // Handle demo script selection
    const handleDemoScriptChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedScript = demoScripts.find(script => script.id === event.target.value);
        if (selectedScript) {
            setSelectedDemoScript(selectedScript);
            setCurrentDemoIndex(0);
            setState(createInitialState());
        }
    };

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result;
            if (content) {
                // Get file extension
                const extension = file.name.split('.').pop()?.toLowerCase() || '';

                // Set type based on extension
                let type = 'data';
                if (extension === 'txt') {
                    type = 'file';
                } else if (extension === 'xls' || extension === 'xlsx') {
                    type = 'spreadsheet';
                } else if (extension === 'pdf') {
                    type = 'pdf';
                }

                const newAsset: Asset = {
                    id: uuidv4(),
                    type,
                    name: file.name,
                    content: content.toString(),
                    ready: true,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        tags: ['uploaded'],
                        size: file.size,
                        type: file.type
                    }
                };

                setState(prev => ({
                    ...prev,
                    assets: [...prev.assets, newAsset]
                }));
            }
        };
        reader.readAsText(file);
    };

    const handleDeleteAsset = (assetId: string) => {
        setState(prev => ({
            ...prev,
            assets: prev.assets.filter(asset => asset.id !== assetId)
        }));
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="flex-none px-6 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200">
                        FractalBot Demo
                    </h2>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden p-4 gap-4">
                {/* Left Column: Chat */}
                <div className="w-[400px] flex-shrink-0 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <ChatSection
                        messages={state.messages}
                        inputMessage=""
                        isProcessing={false}
                        onSendMessage={() => { }}
                        onInputChange={() => { }}
                        onActionButtonClick={handleActionButton}
                    />
                </div>

                {/* Middle Column: Assets */}
                <div className="w-[800px] flex-shrink-0 flex flex-col">
                    <div className="flex-1 bg-transparent backdrop-blur-[2px] rounded-xl overflow-hidden">
                        <AssetsSection
                            assets={state.assets}
                            onUpload={handleFileUpload}
                            onDelete={handleDeleteAsset}
                        />
                    </div>
                </div>

                {/* Right Column: Agents */}
                <div className="flex-1 bg-white/20 dark:bg-gray-800/20 backdrop-blur-[2px] rounded-lg border border-gray-200/30 dark:border-gray-700/30 overflow-hidden">
                    <WorkspaceSection
                        agents={Object.values(state.agents)}
                    />
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex-none px-6 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                        <button
                            onClick={handleRestart}
                            className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500/30 flex items-center gap-2 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restart Demo
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Demo Script:</span>
                            <select
                                value={selectedDemoScript.id}
                                onChange={handleDemoScriptChange}
                                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {demoScripts.map(script => (
                                    <option key={script.id} value={script.id}>
                                        {script.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleNext}
                            disabled={currentDemoIndex >= selectedDemoScript.states.length - 1}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Next Step
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FractalBot; 