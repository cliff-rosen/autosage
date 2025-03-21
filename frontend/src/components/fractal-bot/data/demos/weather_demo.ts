import { v4 as uuidv4 } from 'uuid';
import { DemoScript, DemoState } from '../fractal_bot_data';
import { Phase } from '../../types/state';

// Sample weather data
const WEATHER_DATA = {
    "New York": {
        "temperature": [75, 72, 68, 71, 73, 76, 74],
        "precipitation": [0, 0.2, 0.5, 0, 0, 0.1, 0],
        "humidity": [65, 70, 75, 68, 67, 72, 70]
    },
    "London": {
        "temperature": [62, 60, 61, 59, 63, 62, 64],
        "precipitation": [0.1, 0.3, 0.2, 0.4, 0, 0.1, 0.2],
        "humidity": [72, 75, 78, 76, 70, 73, 74]
    },
    "Tokyo": {
        "temperature": [82, 83, 81, 84, 85, 83, 82],
        "precipitation": [0, 0, 0.3, 0.4, 0.1, 0, 0],
        "humidity": [68, 70, 75, 73, 71, 69, 70]
    }
};

// Define constant IDs for assets
const ASSET_IDS = {
    WEATHER_DATA: 'weather-data',
    ANALYSIS_REPORT: 'weather-analysis',
    VISUALIZATION: 'weather-viz'
} as const;

// Define constant IDs for agents
const AGENT_IDS = {
    DATA_COLLECTOR: 'weather-data-collector',
    ANALYZER: 'weather-analyzer',
    VISUALIZER: 'weather-visualizer'
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
        description: 'User asks about weather pattern analysis',
        phase: 'setup',
        addedMessages: [{
            id: uuidv4(),
            role: 'user',
            type: 'text',
            content: 'Can you analyze the weather patterns for New York, London, and Tokyo over the past week?',
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
            content: 'I\'ll help you analyze the weather patterns. Here\'s my proposed workflow:\n\n1. Data Collection Agent - to gather weather data for all three cities\n2. Analysis Agent - to identify patterns and trends\n3. Visualization Agent - to create comparative visualizations\n\nWould you like me to proceed with this analysis?',
            timestamp: new Date().toISOString(),
            actionButton: {
                label: 'Start Analysis',
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
        stage: 'data_collection',
        description: 'Starting weather data collection',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'Launching the Data Collection Agent to gather weather data for New York, London, and Tokyo.',
            timestamp: new Date().toISOString()
        }],
        workspaceUpdates: {
            added: [
                {
                    id: AGENT_IDS.DATA_COLLECTOR,
                    title: 'Weather Data Collector',
                    description: 'Gathering weather data for multiple cities',
                    status: 'in_progress',
                    createdAt: new Date().toISOString()
                }
            ],
            updated: []
        },
        addedAssets: [{
            id: ASSET_IDS.WEATHER_DATA,
            type: 'data',
            name: 'Weather Dataset',
            content: WEATHER_DATA,
            ready: false,
            metadata: {
                timestamp: new Date().toISOString(),
                tags: ['weather', 'data', 'cities'],
                agentId: AGENT_IDS.DATA_COLLECTOR
            }
        }],
        assetUpdates: []
    },
    {
        stage: 'data_collected',
        description: 'Weather data collection complete',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'action_prompt',
            content: 'I\'ve collected the weather data for all cities. Would you like me to proceed with the analysis to identify patterns and trends?',
            timestamp: new Date().toISOString(),
            actionButton: {
                label: 'Analyze Patterns',
                action: 'analyze_patterns'
            }
        }],
        workspaceUpdates: {
            added: [],
            updated: [
                {
                    id: AGENT_IDS.DATA_COLLECTOR,
                    updates: {
                        status: 'completed',
                        completedAt: new Date().toISOString()
                    }
                }
            ]
        },
        addedAssets: [],
        assetUpdates: [{
            id: ASSET_IDS.WEATHER_DATA,
            updates: {
                ready: true
            }
        }]
    },
    {
        stage: 'analysis_started',
        description: 'Starting weather pattern analysis',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'Launching the Analysis Agent to identify weather patterns and trends.',
            timestamp: new Date().toISOString()
        }],
        workspaceUpdates: {
            added: [
                {
                    id: AGENT_IDS.ANALYZER,
                    title: 'Weather Pattern Analyzer',
                    description: 'Analyzing weather patterns and trends across cities',
                    status: 'in_progress',
                    createdAt: new Date().toISOString()
                }
            ],
            updated: []
        },
        addedAssets: [{
            id: ASSET_IDS.ANALYSIS_REPORT,
            type: 'data',
            name: 'Weather Analysis Report',
            content: 'Analyzing temperature, precipitation, and humidity patterns...',
            ready: false,
            metadata: {
                timestamp: new Date().toISOString(),
                tags: ['analysis', 'weather', 'patterns'],
                icon: '📊',
                type: 'report',
                agentId: AGENT_IDS.ANALYZER
            }
        }],
        assetUpdates: []
    },
    {
        stage: 'analysis_completed',
        description: 'Weather analysis complete',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'action_prompt',
            content: 'I\'ve completed the weather pattern analysis. Would you like me to create visualizations to help compare the patterns across cities?',
            timestamp: new Date().toISOString(),
            actionButton: {
                label: 'Create Visualizations',
                action: 'create_visualizations'
            }
        }],
        workspaceUpdates: {
            added: [],
            updated: [
                {
                    id: AGENT_IDS.ANALYZER,
                    updates: {
                        status: 'completed',
                        completedAt: new Date().toISOString()
                    }
                }
            ]
        },
        addedAssets: [],
        assetUpdates: [{
            id: ASSET_IDS.ANALYSIS_REPORT,
            updates: {
                ready: true,
                content: `Weather Pattern Analysis:

1. Temperature Trends:
   - New York: Mild fluctuations (68-76°F), averaging 72.7°F
   - London: Stable cool temps (59-64°F), averaging 61.6°F
   - Tokyo: Consistently warm (81-85°F), averaging 82.9°F

2. Precipitation Patterns:
   - New York: Mostly dry, light rain midweek
   - London: Regular light rainfall throughout
   - Tokyo: Concentrated rainfall midweek

3. Humidity Levels:
   - New York: Moderate (65-75%)
   - London: High (70-78%)
   - Tokyo: Moderate to high (68-75%)

Key Findings:
- Tokyo shows highest temperatures with least rainfall
- London shows most consistent precipitation
- All cities maintain moderate to high humidity levels`
            }
        }]
    },
    {
        stage: 'visualization_started',
        description: 'Creating weather visualizations',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'Launching the Visualization Agent to create comparative charts and graphs.',
            timestamp: new Date().toISOString()
        }],
        workspaceUpdates: {
            added: [
                {
                    id: AGENT_IDS.VISUALIZER,
                    title: 'Weather Visualizer',
                    description: 'Creating visual comparisons of weather patterns',
                    status: 'in_progress',
                    createdAt: new Date().toISOString()
                }
            ],
            updated: []
        },
        addedAssets: [{
            id: ASSET_IDS.VISUALIZATION,
            type: 'data',
            name: 'Weather Visualizations',
            content: 'Generating comparative weather charts...',
            ready: false,
            metadata: {
                timestamp: new Date().toISOString(),
                tags: ['visualization', 'weather', 'charts'],
                icon: '📈',
                type: 'visualization',
                agentId: AGENT_IDS.VISUALIZER
            }
        }],
        assetUpdates: []
    },
    {
        stage: 'visualization_completed',
        description: 'Weather visualizations complete',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'I\'ve completed the weather visualizations. You can now explore the temperature, precipitation, and humidity trends across all three cities through the interactive charts in your assets. Would you like me to explain any specific patterns or trends?',
            timestamp: new Date().toISOString()
        }],
        workspaceUpdates: {
            added: [],
            updated: [
                {
                    id: AGENT_IDS.VISUALIZER,
                    updates: {
                        status: 'completed',
                        completedAt: new Date().toISOString()
                    }
                }
            ]
        },
        addedAssets: [],
        assetUpdates: [{
            id: ASSET_IDS.VISUALIZATION,
            updates: {
                ready: true,
                content: '[Interactive weather visualization charts would be rendered here]'
            }
        }]
    }
];

// Create and export the weather demo script
export const weatherDemoScript: DemoScript = {
    id: 'weather-analysis',
    name: 'Weather Pattern Analysis',
    description: 'Analyze and compare weather patterns across multiple cities',
    states: demoStates
}; 