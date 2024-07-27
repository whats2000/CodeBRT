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
   * Records voice and converts it to text.
   * @returns A promise that resolves to text data in string format.
   */
  voiceToText: () => Promise<string>;

  /**
   * Stops the voice playback and clears the queues.
   */
  stopTextToVoice: () => Promise<void>;

  /**
   * Stops the voice recording and clears the queues.
   */
  stopVoiceToText: () => Promise<void>;
};
