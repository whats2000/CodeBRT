import React from 'react';
import styled from 'styled-components';

import { CopyFilled, CopyOutlined } from '@ant-design/icons';

const StyledCopyButton = styled.button<{ $copied: boolean }>`
  color: white;
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: transparent;
  border: none;
  border-radius: 4px;
  padding: 5px 8px;
  cursor: pointer;
  outline: none;

  &:hover {
    color: #3c3c3c;
    background-color: #ffffff90;
  }
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
    <StyledCopyButton onClick={handleCopy} $copied={copied}>
      {copied ? <CopyFilled /> : <CopyOutlined />}
    </StyledCopyButton>
  );
};
