import { FractalBotState, StateUpdateAction, StageState } from '../types/state';

// Helper to ensure a stage state exists
const ensureStageState = (state: FractalBotState, stage: string): FractalBotState => {
    if (!state.stageStates[stage]) {
        state.stageStates[stage] = {
            stage,
            messages: [],
            assets: [],
            workspaceItems: [],
            metadata: {}
        };
    }
    return state;
};

export const fractalBotReducer = (state: FractalBotState, action: StateUpdateAction): FractalBotState => {
    const newState = { ...state };

    switch (action.type) {
        case 'SET_STAGE': {
            return {
                ...newState,
                currentStage: action.payload.stage,
                metadata: {
                    ...newState.metadata,
                    lastUpdated: new Date().toISOString()
                }
            };
        }

        case 'ADD_MESSAGE': {
            const { stage, message } = action.payload;
            ensureStageState(newState, stage);
            newState.stageStates[stage].messages.push(message);
            newState.metadata.lastUpdated = new Date().toISOString();
            return newState;
        }

        case 'ADD_ASSET': {
            const { stage, asset } = action.payload;
            ensureStageState(newState, stage);
            newState.stageStates[stage].assets.push(asset);
            newState.metadata.lastUpdated = new Date().toISOString();
            return newState;
        }

        case 'ADD_WORKSPACE_ITEM': {
            const { stage, item } = action.payload;
            ensureStageState(newState, stage);
            newState.stageStates[stage].workspaceItems.push(item);
            newState.metadata.lastUpdated = new Date().toISOString();
            return newState;
        }

        case 'UPDATE_WORKSPACE_ITEM': {
            const { stage, itemId, updates } = action.payload;
            ensureStageState(newState, stage);
            const items = newState.stageStates[stage].workspaceItems;
            const itemIndex = items.findIndex(item => item.id === itemId);
            if (itemIndex !== -1) {
                items[itemIndex] = { ...items[itemIndex], ...updates };
            }
            newState.metadata.lastUpdated = new Date().toISOString();
            return newState;
        }

        case 'ADD_GLOBAL_ASSET': {
            newState.globalAssets.push(action.payload.asset);
            newState.metadata.lastUpdated = new Date().toISOString();
            return newState;
        }

        case 'ADD_GLOBAL_WORKSPACE_ITEM': {
            newState.globalWorkspaceItems.push(action.payload.item);
            newState.metadata.lastUpdated = new Date().toISOString();
            return newState;
        }

        case 'UPDATE_METADATA': {
            newState.metadata = {
                ...newState.metadata,
                ...action.payload.updates,
                lastUpdated: new Date().toISOString()
            };
            return newState;
        }

        default:
            return state;
    }
}; 