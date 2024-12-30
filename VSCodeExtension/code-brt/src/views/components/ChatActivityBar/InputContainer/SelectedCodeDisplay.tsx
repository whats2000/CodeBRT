import React, { useState } from 'react';
import { Card, Button, Flex, Typography } from 'antd';
import {
  ArrowsAltOutlined,
  CloseOutlined,
  ShrinkOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

import type { SelectedCode } from '../../../../types';
import { RendererCode } from '../../common/RenderCode';

const SelectedCodeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-height: 50vh;
  overflow-y: scroll;
  padding-right: 10px;
  margin-bottom: 10px;
`;

const StyledCard = styled(Card)<{ $isVisible: boolean }>`
  div.ant-card-body {
    ${(props) => (props.$isVisible ? '' : 'padding: 0;')}
  }
`;

const CardContent = styled.div<{ $isVisible: boolean }>`
  display: ${(props) => (props.$isVisible ? 'block' : 'none')};
  transition: max-height 0.3s ease;
  width: 100%;
`;

const CodeToggleButton = styled(Button)`
  margin-left: 10px;
`;

type SelectedCodeDisplayProps = {
  selectedCodes: SelectedCode[];
  onRemoveCode: (id: string) => void;
};

export const SelectedCodeDisplay: React.FC<SelectedCodeDisplayProps> = ({
  selectedCodes,
  onRemoveCode,
}) => {
  const { t } = useTranslation('common');
  const [visibleCodes, setVisibleCodes] = useState<{ [key: string]: boolean }>(
    {},
  );

  if (selectedCodes.length === 0) return null;

  const toggleCodeVisibility = (codeId: string) => {
    setVisibleCodes((prev) => ({
      ...prev,
      [codeId]: !prev[codeId],
    }));
  };

  return (
    <SelectedCodeContainer>
      {selectedCodes.map((code) => (
        <StyledCard
          $isVisible={visibleCodes[code.id]}
          key={code.id}
          size='small'
          title={
            <Flex align={'center'}>
              <Typography.Text
                style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}
              >
                {code.relativePath}
              </Typography.Text>
              <Typography.Text type='secondary' style={{ marginLeft: 10 }}>
                {`Ln ${code.startLine}-${code.endLine}`}
              </Typography.Text>
              <CodeToggleButton
                type='text'
                icon={
                  visibleCodes[code.id] ? (
                    <ShrinkOutlined />
                  ) : (
                    <ArrowsAltOutlined />
                  )
                }
                size='small'
                onClick={() => toggleCodeVisibility(code.id)}
                title={visibleCodes[code.id] ? t('showLess') : t('showMore')}
              />
            </Flex>
          }
          extra={
            <Button
              type='text'
              icon={<CloseOutlined />}
              size='small'
              onClick={() => onRemoveCode(code.id)}
            />
          }
          style={{
            width: '100%',
            overflow: 'visible',
          }}
        >
          <CardContent $isVisible={visibleCodes[code.id]}>
            <ReactMarkdown components={RendererCode}>
              {`\`\`\`${code.codeLanguage}\n${code.codeText}\n\`\`\``}
            </ReactMarkdown>
          </CardContent>
        </StyledCard>
      ))}
    </SelectedCodeContainer>
  );
};
