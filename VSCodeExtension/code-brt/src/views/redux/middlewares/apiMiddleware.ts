import type { Middleware } from 'redux';

import type { ViewApi } from '../../../types';

type ApiMiddlewareOptions = {
  callApi: <K extends keyof ViewApi>(
    key: K,
    ...params: Parameters<ViewApi[K]>
  ) => Promise<ReturnType<ViewApi[K]>>;
};

export const createApiMiddleware = ({
  callApi,
}: ApiMiddlewareOptions): Middleware => {
  return (storeAPI) => (next) => (action) => {
    if (typeof action === 'function') {
      return action(storeAPI.dispatch, storeAPI.getState, callApi);
    }
    return next(action);
  };
};
