/**
 * Describes a service that can synthesize voice from text input.
 */
export type VoiceService = {
  /**
   * Converts the given text to voice.
   * @param text - The main text to convert to voice.
   * @returns A promise that resolves to the path of the voice file.
   */
  textToVoice: (text: string) => Promise<string>;

  /**
   * Converts the given voice to text.
   * @param voicePath - The path to the voice file.
   * @returns A promise that resolves to text data in string format.
   */
  voiceToText: (voicePath: string) => Promise<string>;
};
