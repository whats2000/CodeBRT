import fs from "node:fs/promises";

import * as vscode from "vscode";

import { ViewKey } from "./views";
import { ViewApi, ViewApiError, ViewApiEvent, ViewApiRequest, ViewApiResponse, ViewEvents, } from "./types/viewApi";
import { ExtensionSettings } from "./types/extensionSettings";
import { LoadedModels, ModelType } from "./types/modelType";
import { ConversationHistory } from "./types/conversationHistory";
import { viewRegistration } from "./api/viewRegistration";
import SettingsManager from "./api/settingsManager";
import { GeminiService } from "./services/languageModel/geminiService";
import { CohereService } from "./services/languageModel/cohereService";

export const activate = async (ctx: vscode.ExtensionContext) => {
  const connectedViews: Partial<Record<ViewKey, vscode.WebviewView>> = {};
  const settingsManager = SettingsManager.getInstance();
  const models: LoadedModels = {
    gemini: {
      service: new GeminiService(ctx, settingsManager),
      enabled: settingsManager.get("enableModel").gemini,
    },
    cohere: {
      service: new CohereService(ctx, settingsManager),
      enabled: settingsManager.get("enableModel").cohere,
    },
  }

  /**
   * Trigger an event on all connected views
   * @param key - The event key
   * @param params - The event parameters
   */
  const triggerEvent = <E extends keyof ViewEvents>(
    key: E,
    ...params: Parameters<ViewEvents[E]>
  ) => {
    Object.values(connectedViews).forEach((view) => {
      view.webview.postMessage({
        type: "event",
        key,
        value: params,
      } as ViewApiEvent<E>);
    });
  };

  /**
   * Register and connect views to the extension
   * This uses for communication messages channel
   */
  const api: ViewApi = {
    getFileContents: async () => {
      const uris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        openLabel: "Select file",
        title: "Select file to read",
      });

      if (!uris?.length) {
        return "";
      }

      return await fs.readFile(uris[0].fsPath, "utf-8");
    },
    showSettingsView: () => {
      connectedViews?.settingsBar?.show?.(true);
      vscode.commands.executeCommand("settingsBar.focus");
    },
    updateSetting: async (key: keyof ExtensionSettings, value: ExtensionSettings[typeof key]) => {
      return settingsManager.set(key, value);
    },
    getSetting: (key: keyof ExtensionSettings) => {
      return settingsManager.get(key)
    },
    alertMessage: (msg: string, type: "info" | "warning" | "error") => {
      switch (type) {
        case "info":
          vscode.window.showInformationMessage(msg);
          break;
        case "warning":
          vscode.window.showWarningMessage(msg);
          break;
        case "error":
          vscode.window.showErrorMessage(msg);
          break;
        default:
          vscode.window.showInformationMessage(msg);
      }
    },
    sendMessageToExampleB: (msg: string) => {
      triggerEvent("exampleBMessage", msg);
    },
    getLanguageModelResponse: async (
      query: string,
      modelType: ModelType,
      useStream?: boolean
    ) => {
      const modelService = models[modelType].service;
      if (!modelService) {
        vscode.window.showErrorMessage(`Failed to get response for unknown model type: ${modelType}`);
        return `Model service not found for type: ${modelType}`;
      }

      try {
        return useStream ?
          modelService.getResponseChunksForQuery(query, api.sendStreamResponse) :
          modelService.getResponseForQuery(query);
      } catch (error) {
        return `Failed to get response from ${modelType} service: ${error}`;
      }
    },
    getLanguageModelConversationHistory: (
      modelType: ModelType,
    ) => {
      const modelService = models[modelType].service;
      if (!modelService) {
        vscode.window.showErrorMessage(`Failed to get conversation history for unknown model type: ${modelType}`);
        return {entries: []} as ConversationHistory;
      }

      return modelService.getConversationHistory();
    },
    clearLanguageConversationHistory: (
      modelType: ModelType,
    ) => {
      const modelService = models[modelType].service;

      if (!modelService) {
        vscode.window.showErrorMessage(`Failed to clear conversation history for unknown model type: ${modelType}`);
        return;
      }

      modelService.clearConversationHistory();
    },
    editLanguageModelConversationHistory: (
      modelType: ModelType,
      historyIndex: number,
      newMessage: string,
    ) => {
      const modelService = models[modelType].service;

      if (!modelService) {
        vscode.window.showErrorMessage(`Failed to edit conversation history for unknown model type: ${modelType}`);
        return;
      }

      modelService.editConversationHistory(historyIndex, newMessage);
    },
    sendStreamResponse: (msg: string) => {
      triggerEvent("streamResponse", msg);
    },
  };

  const isViewApiRequest = <K extends keyof ViewApi>(
    msg: unknown
  ): msg is ViewApiRequest<K> =>
    msg != null &&
    typeof msg === "object" &&
    "type" in msg &&
    msg.type === "request";

  const registerAndConnectView = async <V extends ViewKey>(key: V) => {
    const view = await viewRegistration(ctx, key);
    connectedViews[key] = view;
    const onMessage = async (msg: Record<string, unknown>) => {
      if (!isViewApiRequest(msg)) {
        return;
      }
      try {
        // @ts-expect-error
        const val = await api[msg.key](...msg.params);
        const res: ViewApiResponse = {
          type: "response",
          id: msg.id,
          value: val,
        };
        view.webview.postMessage(res);
      } catch (e: unknown) {
        const err: ViewApiError = {
          type: "error",
          id: msg.id,
          value:
            e instanceof Error ? e.message : "An unexpected error occurred",
        };
        view.webview.postMessage(err);
      }
    };

    view.webview.onDidReceiveMessage(onMessage);
  };

  registerAndConnectView("chatActivityBar").catch((e) => {
    console.error(e);
  });
  registerAndConnectView("workPanel").catch((e) => {
    console.error(e);
  });
  registerAndConnectView("settingsBar").catch((e) => {
    console.error(e);
  });
};

export const deactivate = () => {
  return;
};
