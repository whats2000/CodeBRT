import type {
  ExtensionSettingsLocal,
  ExtensionSettingsCrossDevice,
  GetResponseOptions,
  ModelServiceType,
  LoadedModelServices,
  IManuallyCompleteService,
} from '../../types';
import { SettingsManager } from '../../api';

export class ManuallyCompleteService implements IManuallyCompleteService {
  private currentModelType: ModelServiceType;
  private settingsManager: SettingsManager;
  private readonly modelServices: LoadedModelServices;

  constructor(
    settingsManager: SettingsManager,
    modelServices: LoadedModelServices,
  ) {
    this.settingsManager = settingsManager;
    this.modelServices = modelServices;
    this.currentModelType = this.getDefaultModelType();
  }

  private getDefaultModelType(): ModelServiceType {
    return this.settingsManager.get(
      'lastUsedModelForManualCompletion',
    ) as ModelServiceType;
  }

  private updateLastUsedModelForManualCompletion(
    modelType: ModelServiceType,
  ): void {
    void this.settingsManager.set(
      'lastUsedModelForManualCompletion',
      modelType,
    );
  }

  private getAvailableModelsForType(modelType: ModelServiceType): string[] {
    const key = `${modelType}AvailableModels` as
      | keyof ExtensionSettingsLocal
      | keyof ExtensionSettingsCrossDevice;
    return this.settingsManager.get(key) || [];
  }

  public async getCompletion(prompt: string): Promise<string> {
    const modelService = this.modelServices[this.currentModelType].service;

    if (!modelService) {
      throw new Error(
        `Model service not found for type: ${this.currentModelType}`,
      );
    }

    try {
      const options: GetResponseOptions = { query: prompt };
      return await modelService.getResponse(options);
    } catch (error) {
      throw new Error(
        `Failed to get completion from ${this.currentModelType} service: ${error}`,
      );
    }
  }

  public switchModel(modelType: ModelServiceType): void {
    if (Object.keys(this.modelServices).includes(modelType)) {
      this.currentModelType = modelType;
      this.updateLastUsedModelForManualCompletion(modelType);
    } else {
      throw new Error(`Model type ${modelType} is not available`);
    }
  }

  public getAvailableModels(): string[] {
    return this.getAvailableModelsForType(this.currentModelType);
  }
}
