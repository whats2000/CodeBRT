import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidV4 } from 'uuid';

import type { ConversationEntry, ConversationHistory } from '../../../types';

const initialState: ConversationHistory & { tempId: string | null } = {
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
};

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setConversationHistory(_state, action: PayloadAction<ConversationHistory>) {
      return { ...action.payload, tempId: null };
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
    addTempAIResponseEntry(state, action: PayloadAction<{ parentId: string }>) {
      const tempId = `temp-${uuidV4()}`;
      state.entries[tempId] = {
        id: tempId,
        role: 'AI',
        message: '',
        parent: action.payload.parentId,
        children: [],
      };
      state.entries[action.payload.parentId].children.push(tempId);
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
  setConversationHistory,
  handleStreamResponse,
  addEntry,
  addTempAIResponseEntry,
  replaceTempEntry,
  updateEntryMessage,
  updateCurrentEntry,
  setAdvanceSettings,
} = conversationSlice.actions;
export const conversationReducer = conversationSlice.reducer;
