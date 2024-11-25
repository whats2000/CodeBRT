import { OpenaiCodeFixerService } from '../../src/services/codeFixer'; // 載入要測試的服務
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
        anthropic: 'claude-3-haiku-20240307',
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
      codeFixerOpenaiAvailableModels: [
        'gpt-4o-mini',
        'gpt-4o',
        'gpt-4-turbo',
        'gpt-4',
      ],
      codeFixerGeminiAvailableModels: [
        'gemini-1.5-pro-latest',
        'gemini-1.5-flash-latest',
      ],
      codeFixerCohereAvailableModels: ['command', 'command-r', 'command-r-plus'],
      codeFixerGroqAvailableModels: [
        'llama3-70b-8192',
        'llama3-8b-8192',
        'mixtral-8x7b-32768',
        'gemma-7b-it',
        'gemma2-9b-it',
      ],
      codeFixerHuggingFaceAvailableModels: ['HuggingFaceH4/zephyr-7b-beta'],
      codeFixerOllamaAvailableModels: ['Auto Detect'],
      codeFixerLastSelectedModel: {
        gemini: 'gemini-1.5-pro-latest',
        openai: 'gpt-4-turbo',
        cohere: 'command',
        groq: 'mixtral-8x7b-32768',
        ollama: 'Auto Detect',
      },
    };
    return settings[key];
  }),
};

describe('CodeFixerService', () => {
  jest.setTimeout(1000000); // 設置 10 秒的超時限制
  let codeFixerService: OpenaiCodeFixerService;
  const workspacePath = path.join(__dirname, '../../tests/testsWorkspace');

  if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath);
  }
  const ctx = {
    extensionPath: workspacePath,
  } as any;
  const settingsManager = mockSettingsManager as any;

  beforeEach(() => {
    codeFixerService = new OpenaiCodeFixerService(ctx, settingsManager);
  });

  describe('getResponse', () => {
    it('should return a valid response for a valid user query', async () => {
      // const options: GetResponseCodeFixerOptions = {
      //   userQuery: 'def add(x, y): return x + y',
      //   originalCode:
      //     `1: def add(a, b):
      //      2:    return a + b
      //       `,
      //   generatedCode:
      //     `1: def add(x, y):
      //      2:    return x + y
      //     `,
      // };

      const options: GetResponseCodeFixerOptions = {
        userQuery: 'Refactor the following code to improve readability and rename variables for clarity:',
        originalCode:
          `1: def process_data(data_list):
     2:     result = []
     3:     for d in data_list:
     4:         if d > 10:
     5:             result.append(d * 2)
     6:         else:
     7:             result.append(d / 2)
     8:     return result
    `,
        generatedCode:
          `1: def process_data(values):
     2:     processed_values = []
     3:     for value in values:
     4:         if value > 10:
     5:             processed_values.append(value * 2)
     6:         else:
     7:             processed_values.append(value / 2)
     8:     return processed_values
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
      // expect(response.success).toBe(true); // 確保 success 是 true
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
