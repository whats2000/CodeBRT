import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { RootState } from '../store';
import type { ModelServiceType, ViewApi } from '../../../types';

type ModelServiceState = {
  activeModelService: ModelServiceType | 'loading...';
  availableModels: string[];
  selectedModel: string;
  isLoading: boolean;
};

export const initializeModelService = createAsyncThunk<
  void,
  ModelServiceType,
  {
    state: RootState;
    extra: {
      callApi: <K extends keyof ViewApi>(
        key: K,
        ...params: Parameters<ViewApi[K]>
      ) => Promise<ReturnType<ViewApi[K]>>;
    };
  }
>(
  'modelService/initialize',
  async (modelServiceType, { dispatch, extra: { callApi } }) => {
    dispatch(startLoading());
    dispatch(resetModels());

    dispatch(setActiveModelService(modelServiceType));

    try {
      const availableModels = await callApi(
        'getAvailableModels',
        modelServiceType,
      );

      dispatch(setAvailableModels(availableModels));

      const selectedModel = await callApi('getCurrentModel', modelServiceType);

      dispatch(setSelectedModel(selectedModel));

      dispatch(finishLoading());
    } catch (error) {
      callApi(
        'alertMessage',
        `Failed to load model service data: ${error}`,
        'error',
      ).catch(console.error);
      dispatch(finishLoading());
    }
  },
);

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
    resetModels(state) {
      state.availableModels = [];
      state.selectedModel = '';
    },
  },
});

export const {
  startLoading,
  setActiveModelService,
  setAvailableModels,
  setSelectedModel,
  finishLoading,
  resetModels,
} = modelServiceSlice.actions;

export const modelServiceReducer = modelServiceSlice.reducer;
