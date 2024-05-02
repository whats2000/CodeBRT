import { ChatActivityBar } from "../views/ChatActivityBar";
import { WorkPanel } from "../views/WorkPanel";
import { SettingsBar } from "../views/SettingsBar";

/**
 * Views that can be connected to the extension
 * If a new view is added, it should be added here as well.
 */
export const Views = {
  chatActivityBar: ChatActivityBar,
  workPanel: WorkPanel,
  settingsBar: SettingsBar,
} as const;

/**
 * Represents the key for the view.
 */
export type ViewKey = keyof typeof Views;
