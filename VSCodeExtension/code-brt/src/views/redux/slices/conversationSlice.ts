import { createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidV4 } from 'uuid';

import {
  AddConversationEntryParams,
  ConversationEntry,
  ConversationEntryRole,
  ConversationHistory,
  ExtensionSettings,
  GetLanguageModelResponseParams,
  ModelServiceType,
  NonWorkspaceToolType,
  ToolCallEntry,
  ToolCallResponse,
  WorkspaceToolType,
} from '../../../types';
import type { CallAPI } from '../../WebviewContext';
import type { RootState } from '../store';
import { updateAndSaveSetting } from './settingsSlice';
import { clearUploadedFiles } from './fileUploadSlice';
import React from 'react';
import { DEFAULT_SYSTEM_PROMPT } from '../../../constants';

const WAIT_FOR_USER_CONFIRM_TOOLS = ['writeToFile', 'executeCommand'];

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
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    maxTokens: undefined,
    temperature: undefined,
    topP: undefined,
    topK: undefined,
    presencePenalty: undefined,
    frequencyPenalty: undefined,
    stop: undefined,
  },
  entries: {},
  tempId: null,
  isLoading: false,
  isProcessing: false,
};

const isApiKeyAvailable = (
  callApi: CallAPI,
  activeModelService: ModelServiceType,
  settings: ExtensionSettings,
) => {
  // We don't need an API key for Ollama or custom models
  if (activeModelService === 'ollama' || activeModelService === 'custom') {
    return true;
  }

  if (
    settings[`${activeModelService}ApiKey`] === '' ||
    !settings[`${activeModelService}ApiKey`]
  ) {
    callApi(
      'alertMessage',
      `The API key of ${activeModelService} is not set, please configure it first`,
      'error',
      // Open the vscode settings with @code-brt as the extension id
      [
        {
          text: 'Set API Key',
          commandArgs: [
            'workbench.action.openSettings',
            `@code-brt:${activeModelService}ApiKey`,
          ],
        },
      ],
    ).catch(console.error);
    return false;
  }

  return true;
};

const formatRejectionMessage = (
  rejectByUserMessage: string,
  toolName: NonWorkspaceToolType | WorkspaceToolType | string,
) => {
  switch (toolName) {
    // We will not add instructions for these tools as they are not operation tools, it is a status marker message
    case 'askFollowUpQuestion':
    case 'attemptCompletion':
      return rejectByUserMessage;
    default:
      return (
        '[Reject with feedback] The tool calling is not executed and with a user feedback. ' +
        'Please consider the feedback and make adjustments.\nUser feedback: \n' +
        rejectByUserMessage
      );
  }
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

export const processMessage = createAsyncThunk<
  Promise<void>,
  {
    message: string;
    parentId: string;
    tempIdRef: React.MutableRefObject<string | null>;
    files?: string[];
    isEdited?: boolean;
  },
  {
    state: RootState;
    extra: {
      callApi: CallAPI;
    };
  }
>(
  'conversation/processMessage',
  async (
    { message, parentId, tempIdRef, files = [], isEdited = false },
    { getState, dispatch, extra: { callApi } },
  ) => {
    const conversationHistory = getState().conversation;
    const { activeModelService, selectedModel } = getState().modelService;

    // Check if the conversation is processing or the message is empty
    if (
      conversationHistory.isProcessing ||
      activeModelService === 'loading...' ||
      !message.trim()
    ) {
      return;
    }

    // Check if the API not set
    const settings = getState().settings.settings;
    if (!isApiKeyAvailable(callApi, activeModelService, settings)) {
      return;
    }

    dispatch(startProcessing());

    // TODO: Support PDF Extractor at later version current only pass the images
    files = files.filter((file: string) => !file.endsWith('.pdf'));

    const userEntry = await callApi('addConversationEntry', {
      parentID: parentId,
      role: 'user',
      message,
      images: files,
    } as AddConversationEntryParams);

    dispatch(addEntry(userEntry));
    dispatch(addTempResponseEntry({ parentId: userEntry.id, role: 'AI' }));

    try {
      const responseWithAction = await callApi('getLanguageModelResponse', {
        modelServiceType: activeModelService,
        query: message,
        images: files.length > 0 ? files : undefined,
        currentEntryID: isEdited ? userEntry.id : undefined,
        useStream: true,
        showStatus: true,
      } as GetLanguageModelResponseParams);

      if (!tempIdRef.current) {
        dispatch(finishProcessing());
        return;
      }

      const aiEntry = await callApi('addConversationEntry', {
        parentID: userEntry.id,
        role: 'AI',
        message: responseWithAction.textResponse,
        modelServiceType: activeModelService,
        modelName: selectedModel,
        toolCalls: responseWithAction.toolCall
          ? [responseWithAction.toolCall]
          : undefined,
      } as AddConversationEntryParams);

      dispatch(replaceTempEntry(aiEntry));

      if (!isEdited) {
        dispatch(clearUploadedFiles());
      }
    } catch (error) {
      callApi(
        'alertMessage',
        `Failed to get response: ${error}`,
        'error',
      ).catch(console.error);
    } finally {
      setTimeout(() => {
        dispatch(finishProcessing());
      }, 1000);
    }
  },
);

export const processToolCall = createAsyncThunk<
  Promise<void>,
  {
    toolCall: ToolCallEntry;
    entry: ConversationEntry;
    activeModelService: ModelServiceType | 'loading...';
    rejectByUserMessage?: string;
    tempIdRef?: React.MutableRefObject<string | null>;
    files?: string[];
  },
  {
    state: RootState;
    extra: {
      callApi: CallAPI;
    };
  }
>(
  'conversation/processToolAction',
  async (
    {
      toolCall,
      entry,
      activeModelService,
      rejectByUserMessage,
      tempIdRef,
      files,
    },
    { dispatch, getState, extra: { callApi } },
  ) => {
    if (
      getState().conversation.isProcessing ||
      activeModelService === 'loading...'
    ) {
      return;
    }

    if (rejectByUserMessage) {
      // Check if the API not set while rejecting the tool call
      const settings = getState().settings.settings;
      if (!isApiKeyAvailable(callApi, activeModelService, settings)) {
        return;
      }
    }

    dispatch(startProcessing());
    dispatch(addTempResponseEntry({ parentId: entry.id, role: 'tool' }));

    // TODO: Support PDF Extractor at later version current only pass the images
    const images = files?.filter((file: string) => !file.endsWith('.pdf'));

    const toolCallResponse: ToolCallResponse = !rejectByUserMessage
      ? await callApi('approveToolCall', toolCall)
      : {
          id: toolCall.id,
          toolCallName: toolCall.toolName,
          status: 'rejectByUser',
          result: formatRejectionMessage(
            rejectByUserMessage,
            toolCall.toolName,
          ),
          create_time: Date.now(),
          images: images,
        };
    const newToolCallResponseEntry = await callApi('addConversationEntry', {
      parentID: entry.id,
      role: 'tool',
      message:
        toolCallResponse.status === 'success'
          ? 'The tool call was executed successfully'
          : toolCallResponse,
      toolResponses: [toolCallResponse],
      images: images,
    } as AddConversationEntryParams);
    dispatch(replaceTempEntry(newToolCallResponseEntry));

    if (files) {
      dispatch(clearUploadedFiles());
    }

    // We will continue processing instead returning
    // - Only when tempIdRef is set, and one of the following conditions is met:
    // - The user rejected the tool call as we do not need to confirm changes in this case
    // - The tool is not needed to confirm changes (Some operation like read context)
    const shouldContinueProcessing =
      tempIdRef &&
      (rejectByUserMessage ||
        !WAIT_FOR_USER_CONFIRM_TOOLS.includes(toolCall.toolName)) &&
      toolCallResponse.status !== 'error';

    if (!shouldContinueProcessing) {
      dispatch(finishProcessing());
      return;
    }

    // Automatically process the next response if the user rejected the tool call
    dispatch(
      processToolResponse({
        entry: newToolCallResponseEntry,
        tempIdRef,
      }),
    );
  },
);

export const processToolResponse = createAsyncThunk<
  Promise<void>,
  {
    entry: ConversationEntry;
    tempIdRef: React.MutableRefObject<string | null>;
  },
  {
    state: RootState;
    extra: {
      callApi: CallAPI;
    };
  }
>(
  'conversation/processToolResponse',
  async ({ entry, tempIdRef }, { dispatch, getState, extra: { callApi } }) => {
    const { activeModelService, selectedModel } = getState().modelService;
    if (activeModelService === 'loading...') {
      return;
    }

    // Check if the API not set
    const settings = getState().settings.settings;
    if (!isApiKeyAvailable(callApi, activeModelService, settings)) {
      return;
    }

    if (!entry.toolResponses?.[0]) {
      callApi('alertMessage', 'No tool response to process', 'error').catch(
        console.error,
      );
      return;
    }

    dispatch(startProcessing());
    dispatch(addTempResponseEntry({ parentId: entry.id, role: 'AI' }));
    try {
      const responseWithAction = await callApi('getLanguageModelResponse', {
        modelServiceType: activeModelService,
        query: '',
        images: entry.toolResponses?.[0].images,
        useStream: true,
        showStatus: true,
        toolCallResponse: entry.toolResponses?.[0],
        currentEntryID: entry.id,
      } as GetLanguageModelResponseParams);

      if (!tempIdRef.current) {
        return;
      }

      const aiEntry = await callApi('addConversationEntry', {
        parentID: entry.id,
        role: 'AI',
        message: responseWithAction.textResponse,
        modelServiceType: activeModelService,
        modelName: selectedModel,
        toolCalls: responseWithAction.toolCall
          ? [responseWithAction.toolCall]
          : undefined,
      } as AddConversationEntryParams);

      dispatch(replaceTempEntry(aiEntry));
    } catch (error) {
      callApi(
        'alertMessage',
        `Failed to get response: ${error}`,
        'error',
      ).catch(console.error);
    } finally {
      dispatch(finishProcessing());
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
