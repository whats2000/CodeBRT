import { createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidV4 } from 'uuid';

import type {
  ConversationEntry,
  ConversationEntryRole,
  ConversationHistory,
} from '../../../types';
import type { CallAPI } from '../../WebviewContext';
import type { RootState } from '../store';
import { updateAndSaveSetting } from './settingsSlice';

const initialState: ConversationHistory & {
  tempId: string | null;
  isLoading: boolean;
  isProcessing: boolean;
} = {
  create_time: 0,
  update_time: 0,
  root: '',
  top: [],
  current: '',
  advanceSettings: {
    systemPrompt: 'You are a helpful assistant.',
    maxTokens: undefined,
    temperature: undefined,
    topP: undefined,
    topK: undefined,
    presencePenalty: undefined,
    frequencyPenalty: undefined,
  },
  entries: {},
  tempId: null,
  isLoading: false,
  isProcessing: false,
};

export const initLoadHistory = createAsyncThunk<
  void,
  void,
  {
    state: RootState;
    extra: {
      callApi: CallAPI;
    };
  }
>(
  'conversation/initLoadHistory',
  async (_args, { getState, dispatch, extra: { callApi } }) => {
    const state = getState().conversation;
    if (state.isLoading) {
      return;
    }

    dispatch(startLoading());

    try {
      const lastUsedHistoryID = await callApi(
        'getSettingByKey',
        'lastUsedHistoryID',
      );
      const history = await callApi('switchHistory', lastUsedHistoryID);

      if (!history) {
        dispatch(finishLoading());
        return;
      }

      dispatch(setConversationHistory(history));
      dispatch(finishLoading());
    } catch (error) {
      callApi(
        'alertMessage',
        `Failed to load conversation history: ${error}`,
        'error',
      ).catch(console.error);
    }
  },
);

export const switchHistory = createAsyncThunk<
  void,
  string,
  {
    state: RootState;
    extra: {
      callApi: CallAPI;
    };
  }
>(
  'conversation/switchHistory',
  async (historyID, { getState, dispatch, extra: { callApi } }) => {
    const state = getState().conversation;
    if (state.isLoading || state.root === historyID) {
      return;
    }

    try {
      dispatch(startLoading());
      const newHistory = await callApi('switchHistory', historyID);

      if (!newHistory) {
        dispatch(finishLoading());
        return;
      }

      dispatch(setConversationHistory(newHistory));

      // Save the last used history ID
      dispatch(
        updateAndSaveSetting({ key: 'lastUsedHistoryID', value: historyID }),
      );

      dispatch(finishLoading());
    } catch (error) {
      callApi(
        'alertMessage',
        `Failed to switch conversation history: ${error}`,
        'error',
      ).catch(console.error);
      dispatch(finishLoading());
    }
  },
);

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    finishLoading(state) {
      state.isLoading = false;
    },
    startProcessing(state) {
      state.isProcessing = true;
    },
    finishProcessing(state) {
      state.isProcessing = false;
    },
    setConversationHistory(state, action: PayloadAction<ConversationHistory>) {
      return {
        ...action.payload,
        tempId: null,
        isLoading: false,
        isProcessing: state.isProcessing,
      };
    },
    handleStreamResponse(state, action: PayloadAction<string>) {
      const { tempId, entries } = state;
      const responseFromMessage = action.payload;

      if (tempId && entries[tempId]?.role === 'AI') {
        entries[tempId].message += responseFromMessage;
      }
    },
    addEntry(state, action: PayloadAction<ConversationEntry>) {
      const newEntry = action.payload;
      state.entries[newEntry.id] = newEntry;
      state.current = newEntry.id;

      // If the root is not set, set it to the new entry
      if (state.root === '') {
        state.root = newEntry.id;
      }

      // If the parent exists, add the new entry to the parent's children otherwise add it to the top
      if (newEntry.parent && state.entries[newEntry.parent]) {
        state.entries[newEntry.parent].children.push(newEntry.id);
      } else {
        state.top.push(newEntry.id);
      }
    },
    addTempResponseEntry(
      state,
      action: PayloadAction<{ parentId: string; role: ConversationEntryRole }>,
    ) {
      const tempId = `temp-${uuidV4()}`;
      state.entries[tempId] = {
        id: tempId,
        role: action.payload.role,
        message: '',
        parent: action.payload.parentId,
        children: [],
      };
      state.current = tempId;
      state.tempId = tempId;
    },
    replaceTempEntry(state, action: PayloadAction<ConversationEntry>) {
      const { id, parent } = action.payload;
      const newEntries = { ...state.entries };

      if (state.tempId && state.entries[state.tempId]) {
        delete newEntries[state.tempId];
      }

      newEntries[id] = action.payload;

      if (parent && newEntries[parent]) {
        newEntries[parent].children.push(id);
      }

      state.entries = newEntries;
      state.current = id;
      state.tempId = null;
    },
    updateEntryMessage(
      state,
      action: PayloadAction<{ id: string; message: string }>,
    ) {
      if (state.entries[action.payload.id]) {
        state.entries[action.payload.id].message = action.payload.message;
      }
    },
    updateCurrentEntry(state, action: PayloadAction<string>) {
      state.current = action.payload;
    },
    setAdvanceSettings(
      state,
      action: PayloadAction<ConversationHistory['advanceSettings']>,
    ) {
      state.advanceSettings = action.payload;
    },
  },
});

export const {
  startLoading,
  finishLoading,
  startProcessing,
  finishProcessing,
  setConversationHistory,
  handleStreamResponse,
  addEntry,
  addTempResponseEntry,
  replaceTempEntry,
  updateEntryMessage,
  updateCurrentEntry,
  setAdvanceSettings,
} = conversationSlice.actions;
export const conversationReducer = conversationSlice.reducer;
