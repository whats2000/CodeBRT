import React, { useEffect, useRef } from 'react';
import {
  Collapse,
  Tag,
  Descriptions,
  Typography,
  Space,
  Button,
  Popover,
} from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import type { ConversationEntry } from '../../../../types';
import { ToolStatusBlock } from '../../common/ToolStatusBlock';
import {
  processToolCall,
  processToolResponse,
} from '../../../redux/slices/conversationSlice';
import type { AppDispatch, RootState } from '../../../redux';
import { DiffViewProvider } from '../../../../services/diff/diffViewProvider'

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
  const dispatch = useDispatch<AppDispatch>();

  const conversationHistory = useSelector(
    (state: RootState) => state.conversation,
  );

  const tempIdRef = useRef<string | null>(null);

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
      await DiffViewProvider.closeDiff();
    }

  };

  const onRollBack = (_entry: ConversationEntry) => {
    console.log('Rolling back changes');
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
            <Space direction={'vertical'}>
              <div>
                <Tag color='warning'>Feedback From User</Tag>
                <Typography.Text type='secondary'>
                  {new Date(response.create_time).toLocaleString()}
                </Typography.Text>
              </div>
              <Typography.Paragraph>
                {typeof response.result === 'string' ? (
                  response.result
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
                        {response.status.toUpperCase()}
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
              >
                Continue
              </Button>
              <Popover
                title={'This feature will be add after agent is implemented'}
              >
                <Button type='default' danger onClick={() => onRollBack(entry)}>
                  Rollback
                </Button>
              </Popover>
            </Space>
          )}
          {entry.toolResponses?.[0].status === 'error' && (
            <Space wrap={true} style={{ marginTop: 10 }}>
              <Button
                type='primary'
                ghost={true}
                onClick={() => onContinue(entry)}
              >
                Fix it
              </Button>
              <Button type='default' danger onClick={() => onRerun(entry)}>
                Retry
              </Button>
            </Space>
          )}
        </>
      )}
    </div>
  );
};
