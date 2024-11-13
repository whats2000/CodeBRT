import { combineReducers } from '@reduxjs/toolkit';

import { conversationReducer } from './slices/conversationSlice';
import { fileUploadReducer } from './slices/fileUploadSlice';
import { modelServiceReducer } from './slices/modelServiceSlice';
import { conversationIndexReducer } from './slices/conversationIndexSlice';
import { settingsReducer } from './slices/settingsSlice';
import { tourReducer } from './slices/tourSlice';

export const rootReducer = combineReducers({
  conversationIndex: conversationIndexReducer,
  conversation: conversationReducer,
  fileUpload: fileUploadReducer,
  modelService: modelServiceReducer,
  settings: settingsReducer,
  tour: tourReducer,
});
