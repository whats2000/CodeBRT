import React, { useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import * as hljs from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import { Button, Flex, Select } from 'antd';
import {
  ArrowsAltOutlined,
  BgColorsOutlined,
  ShrinkOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { CopyButton } from './CopyButton';
import { updateAndSaveSetting } from '../../redux/slices/settingsSlice';
import { AppDispatch, RootState } from '../../redux';

const CodeContainer = styled.div<{ $dynamicStyle: React.CSSProperties }>`
  border-radius: 4px !important;
  background: ${(props) => props.$dynamicStyle.background};
  padding: 5px;
`;

const CodeInfoContainer = styled(Flex)<{ $dynamicStyle: React.CSSProperties }>`
  color: ${(props) => props.$dynamicStyle.color};
  border-bottom: ${(props) => props.$dynamicStyle.borderBottom};
  margin-bottom: 2px;
`;

const StyledSettingButton = styled(Button)`
  background-color: transparent;
  border: none;
  border-radius: 4px;
  padding: 5px 8px;
  cursor: pointer;
  outline: none;
`;

const CodeLanguage = styled.span`
  padding: 7px;
  margin-right: 8px;
`;

const CodeBlock = styled(SyntaxHighlighter)`
  margin: 0;
  border-radius: 4px;

  & code {
    background: transparent;
  }
`;

const OtherCodeBlock = styled.code`
  display: block;
  padding: 10px;
  overflow-x: scroll;
`;

const MAX_LINES = 10;

export const RendererCode: { [nodeType: string]: React.ElementType } = {
  code: ({ node, inline, className, children, ...props }) => {
    const { t } = useTranslation('common');
    const [copied, setCopied] = useState(false);
    const [showSetting, setShowSetting] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const dispatch = useDispatch<AppDispatch>();

    const setHljsTheme = (theme: keyof typeof hljs) => {
      dispatch(updateAndSaveSetting({ key: 'hljsTheme', value: theme }));
    };

    const { hljsTheme } = useSelector(
      (rootState: RootState) => rootState.settings.settings,
    );

    const match = /language-(\w+)/.exec(className || '');
    const hljsStyle = hljs[hljsTheme];

    const handleCopy = () => {
      navigator.clipboard
        .writeText(String(children).replace(/\n$/, ''))
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
        })
        .catch((err) => console.error('Failed to copy text: ', err));
    };

    const codeLines = String(children).split('\n');
    const isExpandable = codeLines.length > MAX_LINES;
    const displayedCode = expanded
      ? codeLines.join('\n')
      : codeLines.slice(0, MAX_LINES).join('\n');

    return !inline && match ? (
      <CodeContainer $dynamicStyle={hljsStyle.hljs}>
        <CodeInfoContainer
          $dynamicStyle={{
            ...hljsStyle.hljs,
            borderBottom: `1px groove ${hljsStyle['hljs-comment'].color}`,
          }}
          justify={'space-between'}
          align={'center'}
        >
          <CodeLanguage>{match[1]}</CodeLanguage>
          <Flex
            align={'center'}
            onMouseLeave={() => {
              if (showSetting) setShowSetting(false);
            }}
          >
            {showSetting ? (
              <Select
                showSearch
                defaultValue={hljsTheme}
                onChange={(value) => {
                  setHljsTheme(value);
                  setShowSetting(false);
                }}
                options={Object.keys(hljs).map((key) => ({
                  key,
                  label: key,
                  value: key,
                }))}
                size={'small'}
                style={{ width: 160 }}
              />
            ) : (
              <StyledSettingButton
                icon={<BgColorsOutlined />}
                ghost={true}
                type={'primary'}
                onMouseEnter={() => setShowSetting(true)}
              />
            )}
            <CopyButton copied={copied} handleCopy={handleCopy} />
          </Flex>
        </CodeInfoContainer>
        <CodeBlock
          style={hljsStyle}
          language={match[1]}
          PreTag='div'
          {...props}
        >
          {displayedCode}
        </CodeBlock>
        {isExpandable && (
          <Button
            icon={expanded ? <ShrinkOutlined /> : <ArrowsAltOutlined />}
            type='text'
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? t('showLess') : t('showMore')}
          </Button>
        )}
      </CodeContainer>
    ) : children?.includes('\n') ? (
      <OtherCodeBlock className={className} {...props}>
        {children}
      </OtherCodeBlock>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};
