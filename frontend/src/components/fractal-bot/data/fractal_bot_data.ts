import {
    ChatMessage,
    Agent,
    Asset,
    Phase,
    MessageType
} from '../types/state';

// Define the demo state type
export interface DemoState {
    stage: string;
    description: string;
    phase: Phase;
    addedMessages: ChatMessage[];
    addedAssets: Asset[];
    workspaceUpdates: {
        added: Agent[];
        updated: Array<{
            id: string;
            updates: Partial<Agent>;
        }>;
    };
    assetUpdates: Array<{
        id: string;
        updates: Partial<Asset>;
    }>;
}

// Define the demo script type
export interface DemoScript {
    id: string;
    name: string;
    description: string;
    states: DemoState[];
}

// Import demo scripts
import { beatlesDemoScript } from './demos/beatles_demo';
import { weatherDemoScript } from './demos/weather_demo';
import { restaurantDemoScript } from './demos/restaurant_demo';
import { invitationDemoScript } from './demos/invitation_demo';

// Export all available demo scripts
export const demoScripts: DemoScript[] = [
    beatlesDemoScript,
    weatherDemoScript,
    restaurantDemoScript,
    invitationDemoScript
];

// Export the default demo script (first one)
export const defaultDemoScript = demoScripts[0]; 