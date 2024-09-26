import { GeminiCodeFixerService } from '../../src/services/codeFixer'; // 載入要測試的服務
import { CodeFixerModification, CodeFixerResponse, GetResponseCodeFixerOptions } from '../../src/types';
import path from 'path';
import fs from 'fs'; // 載入回應類型

// Mock SettingsManager
const mockSettingsManager = {
  get: jest.fn((key: string) => {
    const settings: { [key: string]: any } = {
      anthropicAvailableModels: [
        'claude-3-5-sonnet-20240620',
        'claude-3-haiku-20240307',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
      ],
      openaiAvailableModels: [
        'gpt-4o-mini',
        'gpt-4o',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
      ],
      openaiAvailableVoices: [
        'nova',
        'alloy',
        'echo',
        'fable',
        'onyx',
        'shimmer',
      ],
      openaiSelectedVoice: 'nova',
      geminiAvailableModels: ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'],
      cohereAvailableModels: ['command', 'command-r', 'command-r-plus'],
      groqAvailableModels: [
        'llama3-70b-8192',
        'llama3-8b-8192',
        'mixtral-8x7b-32768',
        'gemma-7b-it',
        'gemma2-9b-it',
      ],
      huggingFaceAvailableModels: ['HuggingFaceH4/zephyr-7b-beta'],
      ollamaClientHost: 'http://127.0.0.1:11434',
      ollamaAvailableModels: ['Auto Detect'],
      lastUsedModel: 'gemini',
      lastSelectedModel: {
        gemini: 'gemini-1.5-pro-latest',
        anthropic: 'claude-3-5-sonnet-20240620',
        openai: 'gpt-3.5-turbo',
        cohere: 'command',
        groq: 'llama3-70b-8192',
        huggingFace: 'HuggingFaceH4/zephyr-7b-beta',
        ollama: 'Auto Detect',
        custom: '',
      },
      customModels: [],
      selectedVoiceToTextService: 'not set',
      selectedTextToVoiceService: 'not set',
      gptSoVitsClientHost: 'http://127.0.0.1:9880/',
      gptSoVitsAvailableReferenceVoices: [],
      gptSoVitsSelectedReferenceVoice: '',
      anthropicApiKey: '',
      openaiApiKey: '',
      geminiApiKey: '',
      cohereApiKey: '',
      groqApiKey: '',
      huggingFaceApiKey: '',
      themePrimaryColor: '#f0f0f0',
      themeAlgorithm: 'darkAlgorithm',
      themeBorderRadius: 4,
      hljsTheme: 'darcula',
      codeFixerLastSelectedModel: {
        gemini: 'gemini-1.5-pro-latest',
        anthropic: 'claude-3-5-sonnet-20240620',
        openai: 'gpt-3.5-turbo',
        cohere: 'command',
        groq: 'llama3-70b-8192',
        huggingFace: 'HuggingFaceH4/zephyr-7b-beta',
        ollama: 'Auto Detect',
        custom: '',
      },
    };
    return settings[key];
  }),
};

describe('GeminiCodeFixerService', () => {
  let codeFixerService: GeminiCodeFixerService;
  const workspacePath = path.join(__dirname, '../../tests/testsWorkspace');

  if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath);
  }
  const ctx = {
    extensionPath: workspacePath,
  } as any;
  const settingsManager = mockSettingsManager as any;

  beforeEach(() => {
    codeFixerService = new GeminiCodeFixerService(ctx, settingsManager);
  });

  describe('getResponse', () => {
    it('should return a valid response for a valid user query', async () => {
      const options: GetResponseCodeFixerOptions = {
        userQuery: 'Refactor the calculateArea function to use arrow functions and make it more concise:',
        originalCode:
          `1: function calculateArea(radius) {
          2:   const pi = 3.14159;
          3:   return pi * radius * radius;
          4: }
          5: 
          6: function displayArea(area) {
          7:   console.log('The area is:', area);
          8: }
          9: 
          10: function getCircleInfo(radius) {
          11:   const area = calculateArea(radius);
          12:   displayArea(area);
          13: }
          14: 
          15: getCircleInfo(5);
            `,
        generatedCode:
          `1: const calculateArea = (radius) => 3.14159 * radius * radius;
          `,
      };

      // 模擬期望的回應格式，但不檢查具體內容
      const expectedResponse: CodeFixerResponse = {
        modifications: expect.any(Array), // 確保 modifications 是陣列
        success: true,
      };

      const response = await codeFixerService.getResponse(options);
      console.log('response:', response);
      // 檢查 response 的格式
      expect(response).toEqual(expectedResponse);
      expect(response.success).toBe(true); // 確保 success 是 true
      expect(response.modifications).toBeInstanceOf(Array); // 確保 modifications 是陣列

      // 檢查每個修改是否具有正確的屬性
      response.modifications.forEach((modification: CodeFixerModification) => {
        expect(modification).toHaveProperty('startLine');
        expect(modification).toHaveProperty('endLine');
        expect(modification).toHaveProperty('content');
      });
    });
  });
});
