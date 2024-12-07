import { ModelServiceType } from '../../types';

export type PartialCodeFuserOptions = {
  originalCode: string;
  partialCode: string;
  relativeFilePath: string;
  modelService: ModelServiceType;
  modelName: string;
};
