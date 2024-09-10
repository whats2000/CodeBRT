import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './reducers';

import { createApiMiddleware } from './middlewares';
import type { ViewApi } from '../../types';

/**
 * Configure the app store
 * @param callApi - The call API function
 * @returns The store
 */
export const configureAppStore = (
  callApi: <K extends keyof ViewApi>(
    key: K,
    ...params: Parameters<ViewApi[K]>
  ) => Promise<ReturnType<ViewApi[K]>>,
) => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: {
            callApi,
          },
        },
      }).concat(createApiMiddleware({ callApi })),
    devTools: process.env.NODE_ENV !== 'production',
  });
};

// Export types for use in the app
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ReturnType<typeof configureAppStore>['dispatch'];
