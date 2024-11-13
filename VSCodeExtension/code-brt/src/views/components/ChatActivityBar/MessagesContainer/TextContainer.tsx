import React from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import type { GlobalToken } from 'antd';
import { theme } from 'antd';
import styled from 'styled-components';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';

import type { ConversationEntry } from '../../../../types';
import { preprocessLaTeX } from '../../../utils';
import { TypingAnimation } from '../../common/TypingAnimation';
import { RendererCode } from '../../common/RenderCode';
import { ToolStatusBlock } from '../../common/ToolStatusBlock';

const MessageText = styled.span`
  word-wrap: break-word;
  margin: 10px 0;
`;

const StyledTable = styled.table<{ $token: GlobalToken }>`
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  border: 1px solid ${({ $token }) => $token.colorBorder};

  th,
  td {
    border: 1px solid ${({ $token }) => $token.colorBorder};
    padding: 8px;
  }

  th {
    background-color: ${({ $token }) => $token.colorBgContainer};
    text-align: left;
    color: ${({ $token }) => $token.colorText};
  }

  tr:nth-child(even) {
    background-color: ${({ $token }) => $token.colorFillAlter};
  }

  tr:hover {
    background-color: ${({ $token }) => $token.colorFillSecondary};
  }
`;

const StyledTableRow = styled.tr<{ $token: GlobalToken }>`
  border: 1px solid ${({ $token }) => $token.colorBorder};
`;

const StyledTableCell = styled.td<{ $token: GlobalToken }>`
  border: 1px solid ${({ $token }) => $token.colorBorder};
  padding: 8px;
`;

const StyledTableHeader = styled.th<{ $token: GlobalToken }>`
  background-color: ${({ $token }) => $token.colorBgContainer};
  padding: 8px;
  color: ${({ $token }) => $token.colorText};
`;

const Table = ({ ...props }) => {
  const { useToken } = theme;
  const { token } = useToken();
  return <StyledTable $token={token} {...props} />;
};

const TableRow = ({ ...props }) => {
  const { useToken } = theme;
  const { token } = useToken();
  return <StyledTableRow $token={token} {...props} />;
};

const TableCell = ({ ...props }) => {
  const { useToken } = theme;
  const { token } = useToken();
  return <StyledTableCell $token={token} {...props} />;
};

const TableHeader = ({ ...props }) => {
  const { useToken } = theme;
  const { token } = useToken();
  return <StyledTableHeader $token={token} {...props} />;
};

const markdownComponents: Partial<Components> = {
  ...RendererCode,
  table: Table,
  tr: TableRow,
  td: TableCell,
  th: TableHeader,
};

type MessageTextContainerProps = {
  entry: ConversationEntry;
  conversationHistoryCurrent: string;
  isProcessing: boolean;
  toolStatus: string;
};

export const TextContainer: React.FC<MessageTextContainerProps> = ({
  entry,
  conversationHistoryCurrent,
  isProcessing,
  toolStatus,
}) => {
  return (
    <MessageText>
      {entry.role === 'AI' &&
      entry.id === conversationHistoryCurrent &&
      isProcessing ? (
        <>
          <TypingAnimation
            message={entry.message}
            isProcessing={isProcessing}
          />
          {toolStatus !== '' && <ToolStatusBlock status={toolStatus} />}
        </>
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={markdownComponents}
          children={preprocessLaTeX(entry.message)}
        />
      )}
    </MessageText>
  );
};
