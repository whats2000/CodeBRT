/**
 * Describes a service that can synthesize voice from text input.
 */
export type VoiceService = {
  /**
   * Converts the given text to voice.
   * @param text - The main text to convert to voice.
   */
  textToVoice: (text: string) => Promise<void>;

  /**
   * Converts the given voice to text.
   * @param voicePath - The path to the voice file.
   * @returns A promise that resolves to text data in string format.
   */
  voiceToText: (voicePath: string) => Promise<string>;
};
