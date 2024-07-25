import React, { createContext } from 'react';
import DeferredPromise from 'promise-deferred';
import { v4 as uuidV4 } from 'uuid';

import type {
  ViewApi,
  ViewApiError,
  ViewApiEvent,
  ViewApiRequest,
  ViewApiResponse,
  ViewEvents,
} from '../types';

/**
 * Type definitions for context values of the Webview.
 */
export type WebviewContextValue = {
  callApi: CallAPI;
  addListener: AddRemoveListener;
  removeListener: AddRemoveListener;
};

/**
 * Type definition for acquiring VSCode API.
 */
export type WebviewApi = ReturnType<typeof acquireVsCodeApi>;

/**
 * Generic function type for API calls.
 * @template K - Key type that extends the keys of ViewApi.
 * @param key - API method name.
 * @param params - Parameters to be passed to the API method.
 * @returns A Promise containing the result of the API call.
 */
type CallAPI = <K extends keyof ViewApi>(
  key: K,
  ...params: Parameters<ViewApi[K]>
) => Promise<ReturnType<ViewApi[K]>>;

/**
 * Generic function type for adding or removing event listeners.
 * @template K - Key type that extends the keys of ViewEvents.
 * @param key - Event name.
 * @param cb - Callback function to handle the event.
 */
type AddRemoveListener = <K extends keyof ViewEvents>(
  key: K,
  cb: (...params: Parameters<ViewEvents[K]>) => void,
) => void;

/**
 * Creates a value for the Webview context.
 * @param postMessage - Function to post a message to the host.
 * @returns An object containing functions to call API, add listeners, and remove listeners.
 */
export const webviewContextValue = (
  postMessage: (message: unknown) => void,
): WebviewContextValue => {
  const pendingRequests: Record<string, DeferredPromise.Deferred<unknown>> = {};
  const listeners: Record<string, Set<(...args: unknown[]) => void>> = {};

  /**
   * Handles incoming messages from the host.
   * @param e - Message event containing data from the host.
   */
  const onMessage = (e: MessageEvent<Record<string, unknown>>) => {
    if (e.data.type === 'response') {
      const data = e.data as ViewApiResponse;
      pendingRequests[data.id]?.resolve(data.value);
    } else if (e.data.type === 'error') {
      const data = e.data as ViewApiError;
      pendingRequests[data.id]?.reject(new Error(data.value));
    } else if (e.data.type === 'event') {
      const data = e.data as ViewApiEvent;
      listeners?.[data.key]?.forEach((cb) => cb(...data.value));
    }
  };

  window.addEventListener('message', onMessage);

  /**
   * Calls an API using the provided key and parameters.
   * @template K - Key type that extends the keys of ViewApi.
   * @param key - API method name.
   * @param params - Parameters to be passed to the API method.
   * @returns A Promise containing the result of the API call.
   */
  const callApi = <K extends keyof ViewApi>(
    key: K,
    ...params: Parameters<ViewApi[K]>
  ) => {
    const id = uuidV4();
    const deferred = new DeferredPromise<ReturnType<ViewApi[K]>>();
    const req: ViewApiRequest = { type: 'request', id, key, params };
    pendingRequests[id] = deferred;
    postMessage(req);
    return deferred.promise;
  };

  /**
   * Adds an event listener.
   * @template K - Key type that extends the keys of ViewEvents.
   * @param key - Event name.
   * @param cb - Callback function to handle the event.
   */
  const addListener: AddRemoveListener = (key, cb) => {
    if (!listeners[key]) {
      listeners[key] = new Set();
    }
    listeners[key].add(cb as (...args: unknown[]) => void);
  };

  /**
   * Removes an event listener.
   * @template K - Key type that extends the keys of ViewEvents.
   * @param key - Event name.
   * @param cb - Callback function to handle the event.
   */
  const removeListener: AddRemoveListener = (key, cb) => {
    if (!listeners[key]) {
      return;
    }
    listeners[key].delete(cb as (...args: unknown[]) => void);
  };

  return { callApi, addListener, removeListener };
};

/**
 * Context for the Webview that provides functions to interact with the host.
 */
export const WebviewContext = createContext<WebviewContextValue>(
  {} as WebviewContextValue,
);

/**
 * Provider component for Webview context that wraps children with context provider.
 * @param vscodeApi - The VSCode API object.
 * @param children - Child components to render within the provider.
 */
export const WithWebviewContext = ({
  vscodeApi,
  children,
}: {
  vscodeApi: WebviewApi;
  children: React.ReactNode;
}) => {
  return (
    <WebviewContext.Provider value={webviewContextValue(vscodeApi.postMessage)}>
      {children}
    </WebviewContext.Provider>
  );
};
