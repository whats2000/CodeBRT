import { ExtensionSettings } from "./extensionSettings";

export type ViewApiRequest<K extends keyof ViewApi = keyof ViewApi> = {
  type: "request";
  id: string;
  key: K;
  params: Parameters<ViewApi[K]>;
};

export type ViewApiResponse = {
  type: "response";
  id: string;
  value: unknown;
};

export type ViewApiError = {
  type: "error";
  id: string;
  value: string;
};

export type ViewApiEvent<K extends keyof ViewEvents = keyof ViewEvents> = {
  type: "event";
  key: K;
  value: Parameters<ViewEvents[K]>;
};

export type ViewApi = {
  getFileContents: () => Promise<string>;
  showSettingsView: () => void;
  updateSetting: (key: keyof ExtensionSettings, value: ExtensionSettings[typeof key]) => Promise<void>;
  getSetting: (key: keyof ExtensionSettings) => ExtensionSettings[typeof key];
  alertMessage: (msg: string, type: "info" | "warning" | "error") => void;
  sendMessageToExampleB: (msg: string) => void;
  getGeminiResponse: (query: string) => Promise<string>;
};

export type ViewEvents = {
  exampleBMessage: (a: string) => void;
};
