import * as vscode from "vscode";
import { ViewKey } from "./views";
import { viewRegistration } from "./api/viewRegistration";
import { ViewApi, ViewApiError, ViewApiEvent, ViewApiRequest, ViewApiResponse, ViewEvents, } from "./api/viewApi";
import fs from "node:fs/promises";

export const activate = async (ctx: vscode.ExtensionContext) => {
  const connectedViews: Partial<Record<ViewKey, vscode.WebviewView>> = {};

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
    showExampleViewB: () => {
      connectedViews?.workPanel?.show?.(true);
      vscode.commands.executeCommand(`exampleViewB.focus`);
    },
    sendMessageToExampleB: (msg: string) => {
      triggerEvent("exampleBMessage", msg);
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

  registerAndConnectView("chatActivityBar").catch((e) => { console.error(e); });
  registerAndConnectView("workPanel").catch((e) => { console.error(e); });
};

export const deactivate = () => {
  return;
};
