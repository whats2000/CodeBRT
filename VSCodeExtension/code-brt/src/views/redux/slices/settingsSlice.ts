import {
  createAsyncThunk,
  createSlice,
  Draft,
  PayloadAction,
} from '@reduxjs/toolkit';
import type { ExtensionSettings } from '../../../types';
import type { RootState } from '../store';
import type { CallAPI } from '../../WebviewContext';
import { DEFAULT_SETTINGS } from 'src/constants';
import { Entries } from 'type-fest';

// List of settings that require a reload when changed
const RELOAD_REQUIRED_SETTINGS: (keyof ExtensionSettings)[] = [
  'retainContextWhenHidden',
];

type SettingsState = {
  settings: ExtensionSettings;
  isLoading: boolean;
  unsavedChanges: boolean;
  needsReload: boolean;
};

// Define the initial state for settings
const initialState: SettingsState = {
  settings: { ...DEFAULT_SETTINGS },
  isLoading: false,
  unsavedChanges: false,
  needsReload: false,
};

// Thunk to load all settings from the API
export const fetchSettings = createAsyncThunk<
  ExtensionSettings,
  void,
  {
    state: RootState;
    extra: {
      callApi: CallAPI;
    };
  }
>('settings/fetchSettings', async (_args, { extra: { callApi } }) => {
  try {
    const response = await callApi('getAllSettings');
    return response as ExtensionSettings;
  } catch (error: any) {
    throw new Error(`Failed to fetch settings: ${error.message}`);
  }
});

// Thunk to save all settings at once
export const saveSettings = createAsyncThunk<
  void,
  ExtensionSettings,
  {
    state: RootState;
    extra: {
      callApi: CallAPI;
    };
  }
>(
  'settings/saveSettings',
  async (updatedSettings, { getState, extra: { callApi } }) => {
    try {
      const state = getState();
      const needsReload = state.settings.needsReload;

      if (needsReload) {
        await callApi('alertReload', 'Some settings require a reload to apply');
      }

      // Loop through and update each setting
      for (const [key, value] of Object.entries(
        updatedSettings,
      ) as Entries<ExtensionSettings>) {
        await callApi('setSettingByKey', key, value);
      }
    } catch (error: any) {
      throw new Error(`Failed to save settings: ${error.message}`);
    }
  },
);

// Update and save a single setting
export const updateAndSaveSetting = createAsyncThunk<
  void,
  {
    key: keyof ExtensionSettings;
    value: ExtensionSettings[keyof ExtensionSettings];
  },
  {
    state: RootState;
    extra: {
      callApi: CallAPI;
    };
  }
>(
  'settings/updateAndSaveSetting',
  async ({ key, value }, { dispatch, extra: { callApi } }) => {
    try {
      dispatch(updateLocalSetting({ key, value }));
      await callApi('setSettingByKey', key, value);

      if (RELOAD_REQUIRED_SETTINGS.includes(key)) {
        await callApi('alertReload', 'Some settings require a reload to apply');
      }
    } catch (error: any) {
      throw new Error(`Failed to update setting: ${error.message}`);
    }
  },
);

// Create the settings slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Update the front-end state for a specific setting without persisting it
    updateLocalSetting<T extends keyof ExtensionSettings>(
      state: Draft<SettingsState>,
      action: PayloadAction<{ key: T; value: ExtensionSettings[T] }>,
    ) {
      const { key, value } = action.payload;

      if (state.settings[key] === value) {
        return;
      }

      state.settings[key] = value;
      state.unsavedChanges = true;

      if (RELOAD_REQUIRED_SETTINGS.includes(key)) {
        state.needsReload = true;
      }
    },
    // Reset unsaved changes to the original state
    resetUnsavedChanges(state) {
      state.unsavedChanges = false;
    },
    startLoading(state) {
      state.isLoading = true;
    },
    finishLoading(state) {
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    // Handle the loading states for fetchSettings
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        fetchSettings.fulfilled,
        (state, action: PayloadAction<ExtensionSettings>) => {
          state.isLoading = false;
          state.settings = action.payload;
          state.unsavedChanges = false;
        },
      )
      .addCase(fetchSettings.rejected, (state, action) => {
        state.isLoading = false;
        console.error(action.error.message);
      });
  },
});

// Export actions and reducer
export const {
  updateLocalSetting,
  resetUnsavedChanges,
  startLoading,
  finishLoading,
} = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;

// Selector to get settings from the state
export const selectSettings = (state: RootState) => state.settings;
export const selectUnsavedChanges = (state: RootState) =>
  state.settings.unsavedChanges;
