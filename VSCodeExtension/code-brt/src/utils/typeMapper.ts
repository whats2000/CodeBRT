import { FunctionDeclarationSchemaType } from '@google/generative-ai';

export const mapTypeToPythonFormat = (type: string): string => {
  switch (type) {
    case 'string':
      return 'str';
    case 'number':
      return 'int';
    case 'boolean':
      return 'bool';
    default:
      return 'str';
  }
};

export const mapFunctionDeclarationSchemaType = (
  type: string,
): FunctionDeclarationSchemaType => {
  switch (type) {
    case 'string':
      return FunctionDeclarationSchemaType.STRING;
    case 'number':
      return FunctionDeclarationSchemaType.NUMBER;
    case 'boolean':
      return FunctionDeclarationSchemaType.BOOLEAN;
    default:
      return FunctionDeclarationSchemaType.STRING;
  }
};
