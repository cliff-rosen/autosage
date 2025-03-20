import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { FractalBotState, StateUpdateAction, InformationAsset, WorkspaceItem } from '../types/state';
import { fractalBotReducer } from '../state/reducer';
import { createInitialState } from '../types/state';
import { ChatMessage } from '../../interactive-workflow/types';
import { Stage } from '../data/fractal_bot_data';

interface FractalBotContextType {
    state: FractalBotState;
    setStage: (stage: Stage) => void;
    addMessage: (stage: Stage, message: ChatMessage) => void;
    addAsset: (stage: Stage, asset: InformationAsset) => void;
    addWorkspaceItem: (stage: Stage, item: WorkspaceItem) => void;
    updateWorkspaceItem: (stage: Stage, itemId: string, updates: Partial<WorkspaceItem>) => void;
    addGlobalAsset: (asset: InformationAsset) => void;
    addGlobalWorkspaceItem: (item: WorkspaceItem) => void;
    updateMetadata: (updates: Partial<FractalBotState['metadata']>) => void;
}

const FractalBotContext = createContext<FractalBotContextType | undefined>(undefined);

export const FractalBotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(fractalBotReducer, createInitialState());

    const setStage = useCallback((stage: Stage) => {
        dispatch({ type: 'SET_STAGE', payload: { stage } });
    }, []);

    const addMessage = useCallback((stage: Stage, message: ChatMessage) => {
        dispatch({ type: 'ADD_MESSAGE', payload: { stage, message } });
    }, []);

    const addAsset = useCallback((stage: Stage, asset: InformationAsset) => {
        dispatch({ type: 'ADD_ASSET', payload: { stage, asset } });
    }, []);

    const addWorkspaceItem = useCallback((stage: Stage, item: WorkspaceItem) => {
        dispatch({ type: 'ADD_WORKSPACE_ITEM', payload: { stage, item } });
    }, []);

    const updateWorkspaceItem = useCallback((stage: Stage, itemId: string, updates: Partial<WorkspaceItem>) => {
        dispatch({ type: 'UPDATE_WORKSPACE_ITEM', payload: { stage, itemId, updates } });
    }, []);

    const addGlobalAsset = useCallback((asset: InformationAsset) => {
        dispatch({ type: 'ADD_GLOBAL_ASSET', payload: { asset } });
    }, []);

    const addGlobalWorkspaceItem = useCallback((item: WorkspaceItem) => {
        dispatch({ type: 'ADD_GLOBAL_WORKSPACE_ITEM', payload: { item } });
    }, []);

    const updateMetadata = useCallback((updates: Partial<FractalBotState['metadata']>) => {
        dispatch({ type: 'UPDATE_METADATA', payload: { updates } });
    }, []);

    const value = {
        state,
        setStage,
        addMessage,
        addAsset,
        addWorkspaceItem,
        updateWorkspaceItem,
        addGlobalAsset,
        addGlobalWorkspaceItem,
        updateMetadata
    };

    return (
        <FractalBotContext.Provider value={value}>
            {children}
        </FractalBotContext.Provider>
    );
};

export const useFractalBot = () => {
    const context = useContext(FractalBotContext);
    if (context === undefined) {
        throw new Error('useFractalBot must be used within a FractalBotProvider');
    }
    return context;
}; 