import React, { useContext } from 'react';
import { Button } from 'antd';
import styled from 'styled-components';
import { DiffOutlined } from '@ant-design/icons';
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

const InsertButton: React.FC<InsertButtonProps> = ({ code }) => {
  const { callApi } = useContext(WebviewContext);

  const handleInsertCode = async () => {
    try {
      const originalCode: string = await callApi('getCurrentEditorCode');

      const response: FixCodeResponse = await callApi('fixCode', {
        originalCode,
        generatedCode: code,
        userQuery: 'Compare and refactor the code',
      });
      console.log('FixCode Response:', response);

      if (response.success) {
        await callApi('showDiffInEditor', response.modifications);
      } else {
        console.error('Failed to fix code:', response.error);
      }
    } catch (err) {
      console.error('Failed to insert code and show diff:', err);
    }
  };

  return (
    <StyledInsertButton onClick={handleInsertCode}>
      <DiffOutlined />
    </StyledInsertButton>
  );
};

export default InsertButton;
