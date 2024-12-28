import React, { useContext, useEffect, useRef, useState } from 'react';
import { Collapse, Tag, Descriptions, Typography, Space, Button } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

import type { ConversationEntry } from '../../../../types';
import { ToolStatusBlock } from '../../common/ToolStatusBlock';
import {
  processToolCall,
  processToolResponse,
  setConversationHistory,
} from '../../../redux/slices/conversationSlice';
import type { AppDispatch, RootState } from '../../../redux';
import { WebviewContext } from '../../../WebviewContext';
import { RendererCode } from '../../common/RenderCode';

const { Panel } = Collapse;

type ToolResponseContainerProps = {
  entry: ConversationEntry;
  toolStatus: string;
  showActionButtons?: boolean;
};

export const ToolResponseContainer: React.FC<ToolResponseContainerProps> = ({
  entry,
  toolStatus,
  showActionButtons = true,
}) => {
  const { t } = useTranslation('common');
  const { callApi } = useContext(WebviewContext);

  const dispatch = useDispatch<AppDispatch>();

  const conversationHistory = useSelector(
    (state: RootState) => state.conversation,
  );
  const { activeModelService } = useSelector(
    (state: RootState) => state.modelService,
  );

  const tempIdRef = useRef<string | null>(null);

  const [isRollingBack, setIsRollingBack] = useState(false);

  useEffect(() => {
    tempIdRef.current = conversationHistory.tempId;
  }, [conversationHistory.tempId]);

  const onContinue = async (entry: ConversationEntry) => {
    dispatch(
      processToolResponse({
        entry,
        tempIdRef,
      }),
    );
    if (entry.toolResponses?.[0]?.toolCallName === 'writeToFile') {
      await callApi('closeDiffView');
    }
  };

  const onRollBack = async (entry: ConversationEntry) => {
    if (!entry.parent || isRollingBack) {
      return;
    }

    setIsRollingBack(true);
    try {
      const newHistory = await callApi('rollbackToolResponses', entry);
      dispatch(setConversationHistory(newHistory));
    } catch (error) {
      console.error('Error rolling back tool responses:', error);
    } finally {
      setIsRollingBack(false);
    }
  };

  const onRerun = (entry: ConversationEntry) => {
    if (!entry.parent) {
      return;
    }
    const previousEntry = conversationHistory.entries[entry.parent];
    const previousToolCall = previousEntry?.toolCalls?.[0];
    if (!previousToolCall) {
      return;
    }
    dispatch(
      processToolCall({
        toolCall: previousToolCall,
        entry: previousEntry,
        activeModelService,
      }),
    );
  };

  const formatResult = (result: string | Record<string, any>) => {
    if (typeof result === 'string') {
      return (
        <Typography.Paragraph
          ellipsis={{
            rows: 5,
            expandable: 'collapsible',
            symbol: (expanded) => (expanded ? t('showLess') : t('showMore')),
          }}
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {result}
        </Typography.Paragraph>
      );
    }

    // If there's a key 'result' in the object, then return the value of that key
    if (result.result) {
      // As there might be '\n' in the result, we need to replace it with <br> to display it properly
      return (
        <Typography.Paragraph
          ellipsis={{
            rows: 2,
            expandable: 'collapsible',
          }}
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {result.result}
        </Typography.Paragraph>
      );
    }

    // If there's no key 'result' in the object, then return the entire object
    return <pre>{JSON.stringify(result, null, 2)}</pre>;
  };

  return (
    <div style={{ margin: '10px 0' }}>
      {entry.toolResponses?.map((response) => (
        <div key={response.id}>
          {response.status === 'rejectByUser' ? (
            <Space direction={'vertical'} style={{ width: '100%' }}>
              <div>
                <Tag color='warning'>
                  {t('toolResponseContainer.feedbackFromUser')}
                </Tag>
                <Typography.Text type='secondary'>
                  {new Date(response.create_time).toLocaleString()}
                </Typography.Text>
              </div>
              <Typography.Paragraph>
                {typeof response.result === 'string' ? (
                  <ReactMarkdown components={RendererCode}>
                    {/* Remove the default feedback message as this is not needed to be displayed */}
                    {response.result.replace(
                      '[Reject with feedback] The tool calling is not executed and with a user feedback. ' +
                        'Please consider the feedback and make adjustments.\nUser feedback: \n',
                      '',
                    )}
                  </ReactMarkdown>
                ) : (
                  <pre>{JSON.stringify(response.result, null, 2)}</pre>
                )}
              </Typography.Paragraph>
            </Space>
          ) : (
            <Collapse defaultActiveKey={[]}>
              <Panel
                header={
                  <Space wrap={true}>
                    <span>
                      <Tag
                        color={response.status === 'success' ? 'green' : 'red'}
                      >
                        {t(response.status).toString().toUpperCase()}
                      </Tag>
                      {response.toolCallName}
                    </span>
                    <Typography.Text type='secondary'>
                      {new Date(response.create_time).toLocaleString()}
                    </Typography.Text>
                  </Space>
                }
                key='1'
              >
                <Descriptions column={1} size='small'>
                  <Descriptions.Item label='Result'>
                    {formatResult(response.result)}
                  </Descriptions.Item>
                </Descriptions>
              </Panel>
            </Collapse>
          )}
        </div>
      ))}

      {!entry.toolResponses && <ToolStatusBlock status={toolStatus} />}

      {showActionButtons && (
        <>
          {/* Add Confirm and Rollback buttons */}
          {entry.toolResponses?.[0].status === 'success' && (
            <Space wrap={true} style={{ marginTop: 10 }}>
              <Button
                type='primary'
                ghost={true}
                onClick={() => onContinue(entry)}
                disabled={isRollingBack}
              >
                {t('toolResponseContainer.continue')}
              </Button>
              <Button
                type='default'
                danger={true}
                onClick={() => onRollBack(entry)}
                disabled={isRollingBack}
                loading={isRollingBack}
              >
                {t('toolResponseContainer.rollback')}
              </Button>
            </Space>
          )}
          {entry.toolResponses?.[0].status === 'error' && (
            <Space wrap={true} style={{ marginTop: 10 }}>
              <Button
                type='primary'
                ghost={true}
                onClick={() => onContinue(entry)}
              >
                {t('toolResponseContainer.fixIt')}
              </Button>
              <Button type='default' danger onClick={() => onRerun(entry)}>
                {t('toolResponseContainer.retry')}
              </Button>
            </Space>
          )}
        </>
      )}
    </div>
  );
};
