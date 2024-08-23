import { combineReducers } from '@reduxjs/toolkit';

import { conversationReducer } from './slices/conversationSlice';
import { fileUploadReducer } from './slices/fileUploadSlice';
import { modelServiceReducer } from './slices/modelServiceSlice';

export const rootReducer = combineReducers({
  conversation: conversationReducer,
  fileUpload: fileUploadReducer,
  modelService: modelServiceReducer,
});
