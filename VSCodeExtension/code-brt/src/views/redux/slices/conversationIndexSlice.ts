import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { ConversationHistoryIndexList } from '../../../types';
import type { CallAPI } from '../../WebviewContext';
import { setConversationHistory } from './conversationSlice';

type ConversationIndexState = {
  historyIndexes: ConversationHistoryIndexList;
  isLoading: boolean;
  filterTags: string[];
  allTags: string[];
};

const initialState: ConversationIndexState = {
  historyIndexes: {},
  isLoading: false,
  filterTags: [],
  allTags: [],
};

// Thunk to fetch and sort conversation history indexes
export const fetchAndSortConversationIndex = createAsyncThunk<
  ConversationHistoryIndexList,
  void,
  {
    state: RootState;
    extra: {
      callApi: CallAPI;
    };
  }
>(
  'conversationIndex/fetchAndSort',
  async (_, { dispatch, extra: { callApi } }) => {
    dispatch(conversationIndexSlice.actions.startLoading());

    try {
      const historyIndexes = await callApi('getHistoryIndexes');
      const sortedHistoriesArray = Object.keys(historyIndexes)
        .map((key) => historyIndexes[key])
        .sort((a, b) => b.update_time - a.update_time);

      return Object.fromEntries(
        sortedHistoriesArray.map((history) => [history.id, history]),
      );
    } catch (error) {
      throw new Error(
        `Failed to fetch and sort conversation history: ${error}`,
      );
    }
  },
);

// Thunk to delete a conversation history
export const deleteConversationIndex = createAsyncThunk<
  void,
  string,
  {
    state: RootState;
    extra: {
      callApi: CallAPI;
    };
  }
>(
  'conversationIndex/delete',
  async (historyID, { dispatch, extra: { callApi } }) => {
    try {
      const newHistory = await callApi('deleteHistory', historyID);
      dispatch(setConversationHistory(newHistory));
    } catch (error) {
      callApi(
        'alertMessage',
        `Failed to delete history: ${error}`,
        'error',
      ).catch(console.error);
    }
  },
);

const conversationIndexSlice = createSlice({
  name: 'conversationIndex',
  initialState,
  reducers: {
    setFilterTags(state, action: PayloadAction<string[]>) {
      state.filterTags = action.payload;
    },
    updateHistoryTitle(
      state,
      action: PayloadAction<{ historyID: string; title: string }>,
    ) {
      const { historyID, title } = action.payload;
      if (state.historyIndexes[historyID]) {
        state.historyIndexes[historyID].title = title;
      }
    },
    startLoading(state) {
      state.isLoading = true;
    },
  },
});

export const { setFilterTags, updateHistoryTitle } =
  conversationIndexSlice.actions;

export const conversationIndexReducer = conversationIndexSlice.reducer;
