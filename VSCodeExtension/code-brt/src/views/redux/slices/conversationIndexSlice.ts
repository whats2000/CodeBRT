import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '../store';
import type { ConversationHistoryIndexList } from '../../../types';
import type { CallAPI } from '../../WebviewContext';
import { setConversationHistory } from './conversationSlice';
import { updateAndSaveSetting } from './settingsSlice';

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
  void,
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

      const sortedHistories = Object.fromEntries(
        sortedHistoriesArray.map((history) => [history.id, history]),
      );

      dispatch(
        conversationIndexSlice.actions.setConversationHistoryIndex(
          sortedHistories,
        ),
      );
      dispatch(updateAllTags());
      dispatch(conversationIndexSlice.actions.stopLoading());
    } catch (error) {
      console.error(`Failed to fetch and sort conversation history: ${error}`);
    } finally {
      dispatch(conversationIndexSlice.actions.stopLoading());
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
  async (historyID, { dispatch, extra: { callApi }, getState }) => {
    try {
      const newHistory = await callApi('deleteHistory', historyID);
      dispatch(setConversationHistory(newHistory));

      // Update the index after deletion
      const { conversationIndex } = getState();
      const updatedIndexes = { ...conversationIndex.historyIndexes };
      delete updatedIndexes[historyID];
      dispatch(
        conversationIndexSlice.actions.setConversationHistoryIndex(
          updatedIndexes,
        ),
      );
      dispatch(updateAllTags());

      dispatch(
        updateAndSaveSetting({
          key: 'lastUsedHistoryID',
          value: '',
        }),
      );
    } catch (error) {
      callApi(
        'alertMessage',
        `Failed to delete history: ${error}`,
        'error',
      ).catch(console.error);
    }
  },
);

// Thunk to update all tags from the conversation history index
const updateAllTags = createAsyncThunk<
  void,
  void,
  {
    state: RootState;
  }
>('conversationIndex/updateAllTags', async (_, { getState, dispatch }) => {
  const { conversationIndex } = getState();
  const allTags = Object.values(conversationIndex.historyIndexes).reduce(
    (acc: string[], history) => {
      if (history.tags) {
        acc.push(...history.tags.filter((tag) => !acc.includes(tag)));
      }
      return acc;
    },
    [],
  );
  dispatch(conversationIndexSlice.actions.setAllTags(allTags));
});

// Thunk to add a tag to a conversation history
export const addTagToConversation = createAsyncThunk<
  void,
  { historyID: string; tag: string },
  {
    state: RootState;
    extra: {
      callApi: CallAPI;
    };
  }
>(
  'conversationIndex/addTag',
  async ({ historyID, tag }, { dispatch, extra: { callApi }, getState }) => {
    try {
      await callApi('addHistoryTag', historyID, tag);

      const { conversationIndex } = getState();
      const updatedHistories = { ...conversationIndex.historyIndexes };
      const history = updatedHistories[historyID];
      if (history) {
        history.tags = [...(history.tags || []), tag];
        dispatch(
          conversationIndexSlice.actions.setConversationHistoryIndex(
            updatedHistories,
          ),
        );
        dispatch(updateAllTags());
      }
    } catch (error) {
      callApi('alertMessage', `Failed to add tag: ${error}`, 'error').catch(
        console.error,
      );
    }
  },
);

// Thunk to remove a tag from a conversation history
export const removeTagFromConversation = createAsyncThunk<
  void,
  { historyID: string; tag: string },
  {
    state: RootState;
    extra: {
      callApi: CallAPI;
    };
  }
>(
  'conversationIndex/removeTag',
  async ({ historyID, tag }, { dispatch, extra: { callApi }, getState }) => {
    try {
      await callApi('removeHistoryTag', historyID, tag);

      const { conversationIndex } = getState();
      const updatedHistories = { ...conversationIndex.historyIndexes };
      const history = updatedHistories[historyID];
      if (history) {
        history.tags = (history.tags || []).filter((t) => t !== tag);
        dispatch(
          conversationIndexSlice.actions.setConversationHistoryIndex(
            updatedHistories,
          ),
        );
        dispatch(updateAllTags());
      }
    } catch (error) {
      callApi('alertMessage', `Failed to remove tag: ${error}`, 'error').catch(
        console.error,
      );
    }
  },
);

const conversationIndexSlice = createSlice({
  name: 'conversationIndex',
  initialState,
  reducers: {
    setConversationHistoryIndex(
      state,
      action: PayloadAction<ConversationHistoryIndexList>,
    ) {
      state.historyIndexes = action.payload;
    },
    setAllTags(state, action: PayloadAction<string[]>) {
      state.allTags = action.payload;
    },
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
    stopLoading(state) {
      state.isLoading = false;
    },
  },
});

export const { setFilterTags, updateHistoryTitle } =
  conversationIndexSlice.actions;

export const conversationIndexReducer = conversationIndexSlice.reducer;
