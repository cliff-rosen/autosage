import { v4 as uuidv4 } from 'uuid';
import { DemoScript, DemoState } from '../fractal_bot_data';
import { Phase } from '../../types/state';

// Sample restaurant data
const RESTAURANTS = [
    {
        id: 1,
        name: "La Bella Italia",
        cuisine: "Italian",
        rating: 4.8,
        priceRange: "$$$",
        location: "Downtown",
        features: ["outdoor seating", "vegetarian options", "wine bar"],
        openingHours: "11:00-22:00",
        reviews: 128
    },
    {
        id: 2,
        name: "Sushi Master",
        cuisine: "Japanese",
        rating: 4.9,
        priceRange: "$$$$",
        location: "Westside",
        features: ["omakase", "sake bar", "private rooms"],
        openingHours: "12:00-23:00",
        reviews: 256
    },
    {
        id: 3,
        name: "Taco Fiesta",
        cuisine: "Mexican",
        rating: 4.5,
        priceRange: "$",
        location: "Eastside",
        features: ["takeout", "delivery", "catering"],
        openingHours: "10:00-22:00",
        reviews: 89
    },
    {
        id: 4,
        name: "Green Leaf Cafe",
        cuisine: "Vegetarian",
        rating: 4.7,
        priceRange: "$$",
        location: "Downtown",
        features: ["vegan options", "gluten-free", "organic"],
        openingHours: "08:00-20:00",
        reviews: 167
    },
    {
        id: 5,
        name: "Steakhouse Prime",
        cuisine: "American",
        rating: 4.6,
        priceRange: "$$$$",
        location: "Uptown",
        features: ["private dining", "wine cellar", "valet parking"],
        openingHours: "16:00-23:00",
        reviews: 145
    }
];

// Define constant IDs for assets
const ASSET_IDS = {
    RESTAURANT_DATA: 'restaurant-data',
    FILTERED_RESULTS: 'filtered-restaurants',
    ANALYSIS_REPORT: 'restaurant-analysis'
} as const;

// Define constant IDs for agents
const AGENT_IDS = {
    DATA_COLLECTOR: 'restaurant-data-collector',
    FILTER_AGENT: 'restaurant-filter',
    ANALYZER: 'restaurant-analyzer'
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
            content: 'Hello! I\'m FractalBot. I can help you find restaurants that match your criteria. What kind of restaurant are you looking for?',
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
        stage: 'criteria_received',
        description: 'User provides restaurant search criteria',
        phase: 'setup',
        addedMessages: [{
            id: uuidv4(),
            role: 'user',
            type: 'text',
            content: 'I\'m looking for a restaurant that has outdoor seating, is in the downtown area, and has vegetarian options. Price range should be $$ or less.',
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
            content: 'I\'ll help you find restaurants matching your criteria. Here\'s my proposed workflow:\n\n1. Data Collection Agent - to gather restaurant information\n2. Filter Agent - to apply your specific criteria\n3. Analysis Agent - to provide detailed insights about matching restaurants\n\nWould you like me to proceed with the search?',
            timestamp: new Date().toISOString(),
            actionButton: {
                label: 'Start Search',
                action: 'start_search'
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
        description: 'Starting restaurant data collection',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'Launching the Data Collection Agent to gather restaurant information.',
            timestamp: new Date().toISOString()
        }],
        workspaceUpdates: {
            added: [
                {
                    id: AGENT_IDS.DATA_COLLECTOR,
                    title: 'Restaurant Data Collector',
                    description: 'Gathering restaurant information',
                    status: 'in_progress',
                    createdAt: new Date().toISOString()
                }
            ],
            updated: []
        },
        addedAssets: [{
            id: ASSET_IDS.RESTAURANT_DATA,
            type: 'data',
            name: 'Restaurant Dataset',
            content: RESTAURANTS,
            ready: false,
            metadata: {
                timestamp: new Date().toISOString(),
                tags: ['restaurants', 'data', 'locations'],
                agentId: AGENT_IDS.DATA_COLLECTOR
            }
        }],
        assetUpdates: []
    },
    {
        stage: 'data_collected',
        description: 'Restaurant data collection complete',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'I\'ve collected the restaurant data. Now, I\'ll filter the restaurants based on your criteria: outdoor seating, downtown location, vegetarian options, and price range $$ or less.',
            timestamp: new Date().toISOString()
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
            id: ASSET_IDS.RESTAURANT_DATA,
            updates: {
                ready: true
            }
        }]
    },
    {
        stage: 'filtering_started',
        description: 'Starting restaurant filtering',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'Launching the Filter Agent to find restaurants matching your criteria.',
            timestamp: new Date().toISOString()
        }],
        workspaceUpdates: {
            added: [
                {
                    id: AGENT_IDS.FILTER_AGENT,
                    title: 'Restaurant Filter',
                    description: 'Filtering restaurants based on criteria',
                    status: 'in_progress',
                    createdAt: new Date().toISOString()
                }
            ],
            updated: []
        },
        addedAssets: [{
            id: ASSET_IDS.FILTERED_RESULTS,
            type: 'data',
            name: 'Filtered Restaurants',
            content: 'Filtering restaurants based on criteria...',
            ready: false,
            metadata: {
                timestamp: new Date().toISOString(),
                tags: ['filtered', 'restaurants', 'matches'],
                agentId: AGENT_IDS.FILTER_AGENT
            }
        }],
        assetUpdates: []
    },
    {
        stage: 'filtering_completed',
        description: 'Restaurant filtering complete',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'action_prompt',
            content: 'I\'ve found restaurants matching your criteria. Would you like me to analyze the results and provide detailed insights about each matching restaurant?',
            timestamp: new Date().toISOString(),
            actionButton: {
                label: 'Show Analysis',
                action: 'show_analysis'
            }
        }],
        workspaceUpdates: {
            added: [],
            updated: [
                {
                    id: AGENT_IDS.FILTER_AGENT,
                    updates: {
                        status: 'completed',
                        completedAt: new Date().toISOString()
                    }
                }
            ]
        },
        addedAssets: [],
        assetUpdates: [{
            id: ASSET_IDS.FILTERED_RESULTS,
            updates: {
                ready: true,
                content: RESTAURANTS.filter(r =>
                    r.features.includes('outdoor seating') &&
                    r.location === 'Downtown' &&
                    r.features.includes('vegetarian options') &&
                    (r.priceRange === '$' || r.priceRange === '$$')
                )
            }
        }]
    },
    {
        stage: 'analysis_started',
        description: 'Starting restaurant analysis',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'Launching the Analysis Agent to provide detailed insights about the matching restaurants.',
            timestamp: new Date().toISOString()
        }],
        workspaceUpdates: {
            added: [
                {
                    id: AGENT_IDS.ANALYZER,
                    title: 'Restaurant Analyzer',
                    description: 'Analyzing matching restaurants',
                    status: 'in_progress',
                    createdAt: new Date().toISOString()
                }
            ],
            updated: []
        },
        addedAssets: [{
            id: ASSET_IDS.ANALYSIS_REPORT,
            type: 'data',
            name: 'Restaurant Analysis Report',
            content: 'Analyzing matching restaurants...',
            ready: false,
            metadata: {
                timestamp: new Date().toISOString(),
                tags: ['analysis', 'restaurants', 'insights'],
                agentId: AGENT_IDS.ANALYZER
            }
        }],
        assetUpdates: []
    },
    {
        stage: 'analysis_completed',
        description: 'Restaurant analysis complete',
        phase: 'execution',
        addedMessages: [{
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: 'I\'ve completed the analysis of restaurants matching your criteria. You can find the detailed report in your assets. Would you like me to highlight any specific aspects of the matching restaurants?',
            timestamp: new Date().toISOString()
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
                content: `Restaurant Analysis Report:

Matching Restaurants Found: 1

1. La Bella Italia
   - Cuisine: Italian
   - Rating: 4.8/5 (128 reviews)
   - Price Range: $$$
   - Features:
     * Outdoor seating
     * Vegetarian options
     * Wine bar
   - Opening Hours: 11:00-22:00
   - Location: Downtown

Key Insights:
- La Bella Italia is the only restaurant that matches all your criteria
- It offers a high-quality dining experience with a 4.8/5 rating
- The restaurant features a wine bar and outdoor seating, perfect for a nice evening out
- While slightly above your preferred price range ($$$ vs $$), it offers excellent value for the quality

Additional Recommendations:
- Consider expanding your search to include restaurants with $$ price range if you'd like more options
- You might also want to consider restaurants just outside downtown if you're flexible with location`
            }
        }]
    }
];

// Create and export the restaurant demo script
export const restaurantDemoScript: DemoScript = {
    id: 'restaurant-search',
    name: 'Restaurant Search',
    description: 'Find restaurants matching specific criteria and get detailed insights',
    states: demoStates
}; 