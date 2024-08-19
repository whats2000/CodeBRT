import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { ModelServiceType } from '../../../types';

type ModelServiceState = {
  activeModelService: ModelServiceType | 'loading...';
  availableModels: string[];
  selectedModel: string;
  isLoading: boolean;
};

const initialState: ModelServiceState = {
  activeModelService: 'loading...',
  availableModels: [],
  selectedModel: '',
  isLoading: true,
};

const modelServiceSlice = createSlice({
  name: 'modelService',
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    setActiveModelService(state, action: PayloadAction<ModelServiceType>) {
      state.activeModelService = action.payload;
    },
    setAvailableModels(state, action: PayloadAction<string[]>) {
      state.availableModels = action.payload;
    },
    setSelectedModel(state, action: PayloadAction<string>) {
      state.selectedModel = action.payload;
    },
    finishLoading(state) {
      state.isLoading = false;
    },
    resetModelService(state) {
      state.activeModelService = 'loading...';
      state.availableModels = [];
      state.selectedModel = '';
      state.isLoading = true;
    },
  },
});

export const {
  startLoading,
  setActiveModelService,
  setAvailableModels,
  setSelectedModel,
  finishLoading,
  resetModelService,
} = modelServiceSlice.actions;

export const modelServiceReducer = modelServiceSlice.reducer;
