export type VoiceServiceApi = {
  /**
   * Convert text to voice and play it.
   * @param text - The text to convert to voice.
   */
  convertTextToVoice: (text: string) => Promise<void>;

  /**
   * Start recording voice.
   * After recording, the voice will be converted to text.
   * @returns The recorded voice as text.
   */
  convertVoiceToText: () => Promise<string>;

  /**
   * Stop the voice which is being played.
   * @param voiceServiceType - The type of the voice service to stop.
   */
  stopPlayVoice: () => void;

  /**
   * Stop the voice which is being recorded.
   */
  stopRecordVoice: () => void;

  /**
   * Switch the reference voice for GPT-SoVits.
   * @param voiceName - The name of the reference voice to switch to.
   */
  switchGptSoVitsReferenceVoice: (voiceName: string) => void;
};
