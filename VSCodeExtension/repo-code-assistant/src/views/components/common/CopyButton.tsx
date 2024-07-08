import React from 'react';
import styled from 'styled-components';
import { CopyFilled, CopyOutlined } from '@ant-design/icons';
import { Button } from 'antd';

const StyledCopyButton = styled(Button)`
  background-color: transparent;
  border: none;
  border-radius: 4px;
  padding: 5px 8px;
  cursor: pointer;
  outline: none;
`;

interface CopyButtonProps {
  copied: boolean;
  handleCopy: () => void;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  copied,
  handleCopy,
}) => {
  return (
    <StyledCopyButton onClick={handleCopy} ghost={true} type={'primary'}>
      {copied ? <CopyFilled /> : <CopyOutlined />}
    </StyledCopyButton>
  );
};
