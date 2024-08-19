import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { RootState } from '../store';
import type { ModelServiceType, ViewApi } from '../../../types';

type CallAPI = <K extends keyof ViewApi>(
  key: K,
  ...params: Parameters<ViewApi[K]>
) => Promise<ReturnType<ViewApi[K]>>;

type ModelServiceState = {
  activeModelService: ModelServiceType | 'loading...';
  availableModels: string[];
  selectedModel: string;
  isLoading: boolean;
};

export const loadModelService = createAsyncThunk<
  void,
  ModelServiceType,
  {
    state: RootState;
    extra: {
      callApi: CallAPI;
    };
  }
>(
  'modelService/loadModelService',
  async (modelServiceType, { getState, dispatch, extra: { callApi } }) => {
    const state = getState().modelService;
    if (state.activeModelService === modelServiceType) {
      return;
    }

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

      await callApi('setSetting', 'lastUsedModelService', modelServiceType);

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

export const swapModel = createAsyncThunk<
  void,
  string,
  {
    state: RootState;
    extra: {
      callApi: CallAPI;
    };
  }
>(
  'modelService/swapModel',
  async (model, { getState, dispatch, extra: { callApi } }) => {
    const state = getState().modelService;
    if (
      state.selectedModel === model ||
      !state.availableModels.includes(model) ||
      state.isLoading ||
      state.activeModelService === 'loading...'
    ) {
      return;
    }

    dispatch(startLoading());
    try {
      await callApi('switchModel', state.activeModelService, model);
      dispatch(setSelectedModel(model));
      dispatch(finishLoading());
    } catch (error) {
      callApi(
        'alertMessage',
        `Failed to switch model: ${error}`,
        'error',
      ).catch(console.error);
      dispatch(finishLoading());
    }
  },
);

export const updateAvailableModels = createAsyncThunk<
  void,
  { modelType: ModelServiceType | 'loading...'; newAvailableModels: string[] },
  {
    state: RootState;
    extra: {
      callApi: CallAPI;
    };
  }
>(
  'modelService/updateAvailableModels',
  async (
    { modelType, newAvailableModels },
    { getState, dispatch, extra: { callApi } },
  ) => {
    const state = getState().modelService;
    if (
      state.activeModelService !== modelType ||
      state.isLoading ||
      modelType === 'custom' ||
      modelType === 'loading...'
    ) {
      return;
    }

    dispatch(setAvailableModels(newAvailableModels));

    if (newAvailableModels.length === 0) {
      dispatch(setSelectedModel(''));
      try {
        await callApi('switchModel', modelType, '');
      } catch (error) {
        callApi(
          'alertMessage',
          `Failed to switch model: ${error}`,
          'error',
        ).catch(console.error);
      }
    }

    if (!newAvailableModels.includes(state.selectedModel)) {
      try {
        await callApi('switchModel', modelType, newAvailableModels[0]);
        dispatch(setSelectedModel(newAvailableModels[0]));
      } catch (error) {
        callApi(
          'alertMessage',
          `Failed to switch model: ${error}`,
          'error',
        ).catch(console.error);
      }
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
