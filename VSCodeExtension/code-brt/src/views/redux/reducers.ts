import { combineReducers } from '@reduxjs/toolkit';

import { conversationReducer } from './slices/conversationSlice';

export const rootReducer = combineReducers({
  conversation: conversationReducer,
});
