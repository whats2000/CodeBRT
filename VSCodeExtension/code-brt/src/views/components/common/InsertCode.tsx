import React, { useContext, useState } from 'react';
import { Button, Tooltip } from 'antd';
import styled from 'styled-components';
import { DiffOutlined, LoadingOutlined } from '@ant-design/icons';

import { WebviewContext } from '../../WebviewContext';

const StyledInsertButton = styled(Button)`
  background-color: transparent;
  border: none;
  border-radius: 4px;
  padding: 5px 8px;
  cursor: pointer;
  outline: none;
`;

interface InsertButtonProps {
  code: string;
  handleOpenApplyChangesAlert: (updatedModifications: Modification[]) => void;
}

interface Modification {
  startLine: number;
  endLine: number;
  content: string;
}

interface FixCodeResponse {
  success: boolean;
  modifications: Modification[];
  error?: string;
}

const extractUserQuery = (input: string): string => {
  return input.replace(/```[\s\S]*?```/g, '').trim();
};

const addLineNumbersToCode = (code: string, startingLine: number): string => {
  return code
    .split('\n')
    .map((line, index) => `${startingLine + index}: ${line}`)
    .join('\n');
};

const InsertButton: React.FC<InsertButtonProps> = ({
  code,
  handleOpenApplyChangesAlert,
}) => {
  const { callApi } = useContext(WebviewContext);

  const [isLoading, setIsLoading] = useState(false);

  const handleInsertCode = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const originalCode: string = await callApi('getCurrentEditorCode');
      const editorInfo = await callApi('getEditorInfo'); // Assuming this gets the file starting line info

      // If editor info contains the starting line, you can modify this accordingly
      const startingLine = editorInfo?.startingLine || 1; // Default to line 1 if not provided

      // Add line numbers to the original code
      const originalCodeWithLineNumbers = addLineNumbersToCode(
        originalCode,
        startingLine,
      );

      const userQuery = extractUserQuery(code);
      const response: FixCodeResponse = await callApi('fixCode', {
        originalCode: originalCodeWithLineNumbers,
        generatedCode: code,
        userQuery,
      });
      console.log('FixCode Response:', response);

      if (response.success) {
        const updatedModifications = await callApi(
          'showDiffInEditor',
          response.modifications,
        );

        handleOpenApplyChangesAlert(updatedModifications);
      } else {
        console.error('Failed to fix code:', response.error);
      }
    } catch (err) {
      console.error('Failed to insert code and show diff:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip title='Insert and Apply Code Changes'>
      <StyledInsertButton
        type={'primary'}
        ghost={true}
        onClick={handleInsertCode}
        disabled={isLoading}
      >
        {isLoading ? <LoadingOutlined /> : <DiffOutlined />}
      </StyledInsertButton>
    </Tooltip>
  );
};

export default InsertButton;
