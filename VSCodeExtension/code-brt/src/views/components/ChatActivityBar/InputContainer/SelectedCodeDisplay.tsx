import React from 'react';
import { Card, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';

import type { SelectedCode } from '../../../../types';
import { RendererCode } from '../../common/RenderCode';

const SelectedCodeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
`;

type SelectedCodeDisplayProps = {
  selectedCodes: SelectedCode[];
  onRemoveCode: (id: string) => void;
};

export const SelectedCodeDisplay: React.FC<SelectedCodeDisplayProps> = ({
  selectedCodes,
  onRemoveCode,
}) => {
  if (selectedCodes.length === 0) return null;

  return (
    <SelectedCodeContainer>
      {selectedCodes.map((code) => (
        <Card
          key={code.id}
          size='small'
          title={code.relativePath}
          extra={
            <Button
              type='text'
              icon={<CloseOutlined />}
              size='small'
              onClick={() => onRemoveCode(code.id)}
            />
          }
          style={{ width: 300, marginBottom: 10 }}
        >
          <ReactMarkdown components={RendererCode}>
            {`\`\`\`${code.codeLanguage}\n${code.codeText}\n\`\`\``}
          </ReactMarkdown>
        </Card>
      ))}
    </SelectedCodeContainer>
  );
};
