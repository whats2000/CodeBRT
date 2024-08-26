import { combineReducers } from '@reduxjs/toolkit';

import { conversationReducer } from './slices/conversationSlice';
import { fileUploadReducer } from './slices/fileUploadSlice';
import { modelServiceReducer } from './slices/modelServiceSlice';
import { conversationIndexReducer } from './slices/conversationIndexSlice';

export const rootReducer = combineReducers({
  conversationIndex: conversationIndexReducer,
  conversation: conversationReducer,
  fileUpload: fileUploadReducer,
  modelService: modelServiceReducer,
});
