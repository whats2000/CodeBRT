import { CompletionTemplate } from '../types';
import { HOLE_FILLER_TEMPLATE } from '../constants';

export const getTemplateForModel = (modelName: string): CompletionTemplate => {
  const lowerCaseModel = modelName.toLowerCase();

  if (
    lowerCaseModel.includes('starcoder') ||
    lowerCaseModel.includes('star-coder')
  ) {
    return HOLE_FILLER_TEMPLATE.starCoderFimTemplate;
  }

  if (lowerCaseModel.includes('codestral')) {
    return HOLE_FILLER_TEMPLATE.codestralFimTemplate;
  }

  if (lowerCaseModel.includes('codegemma')) {
    return HOLE_FILLER_TEMPLATE.codegemmaFimTemplate;
  }

  if (lowerCaseModel.includes('codellama')) {
    return HOLE_FILLER_TEMPLATE.codeLlamaFimTemplate;
  }

  if (lowerCaseModel.includes('deepseek')) {
    return HOLE_FILLER_TEMPLATE.deepseekFimTemplate;
  }

  return HOLE_FILLER_TEMPLATE.stableCodeFimTemplate;
};
