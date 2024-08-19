import { combineReducers } from '@reduxjs/toolkit';

import { conversationReducer } from './slices/conversationSlice';
import { modelServiceReducer } from './slices/modelServiceSlice';

export const rootReducer = combineReducers({
  conversation: conversationReducer,
  modelService: modelServiceReducer,
});
