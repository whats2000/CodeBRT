import React, { useContext } from 'react';
import { Button, Modal } from 'antd';
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

const extractUserQuery = (input: string): string => {
  return input.replace(/```[\s\S]*?```/g, '').trim();
};

const InsertButton: React.FC<InsertButtonProps> = ({ code }) => {
  const { callApi } = useContext(WebviewContext);

  const handleInsertCode = async () => {
    try {
      const originalCode: string = await callApi('getCurrentEditorCode');
<<<<<<< Updated upstream
      const userQuery = extractUserQuery(code);
=======

>>>>>>> Stashed changes
      const response: FixCodeResponse = await callApi('fixCode', {
        originalCode,
        generatedCode: code,
        userQuery,
      });
      console.log('FixCode Response:', response); // 新增這行來檢查回傳結果

      if (response.success) {
        const updatedModifications = await callApi(
          'showDiffInEditor',
          response.modifications,
        );

        Modal.confirm({
          title: 'Apply Code Changes?',
          content: 'Do you want to apply these code changes to your editor?',
          onOk: async () => {
            try {
              await callApi('updateDecorationToMatchBackground');

              await callApi('applyCodeChanges', updatedModifications);
            } catch (applyError) {
              console.error('Failed to apply code changes:', applyError);
            }
          },
          onCancel: async () => {
            await callApi('revertTemporaryInsertions');
          },
        });
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
