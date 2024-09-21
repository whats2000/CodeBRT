import { SchemaType } from '@google/generative-ai';

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

export const mapFunctionDeclarationSchemaType = (type: string): SchemaType => {
  switch (type) {
    case 'string':
      return SchemaType.STRING;
    case 'number':
      return SchemaType.NUMBER;
    case 'boolean':
      return SchemaType.BOOLEAN;
    default:
      return SchemaType.STRING;
  }
};
