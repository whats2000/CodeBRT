import React, { useEffect, useRef } from 'react';
import { Collapse, Tag, Descriptions, Typography, Space, Button } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import type { ConversationEntry } from '../../../../types';
import { ToolStatusBlock } from '../../common/ToolStatusBlock';
import { processToolResponse } from '../../../redux/slices/conversationSlice';
import type { AppDispatch, RootState } from '../../../redux';

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
  };

  const onRollBack = (_entry: ConversationEntry) => {
    console.log('Rolling back changes');
  };

  const onRerun = (_entry: ConversationEntry) => {
    console.log('Rerunning the tool');
  };

  return (
    <div style={{ margin: '10px 0' }}>
      {entry.toolResponses?.map((response) => (
        <Collapse defaultActiveKey={[]}>
          <Panel
            header={
              <Space wrap={true}>
                <span>
                  <Tag color={response.status === 'success' ? 'green' : 'red'}>
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
                {typeof response.result === 'string' ? (
                  <Typography.Paragraph
                    ellipsis={{
                      rows: 2,
                      expandable: 'collapsible',
                    }}
                  >
                    {response.result}
                  </Typography.Paragraph>
                ) : (
                  <pre>{JSON.stringify(response.result, null, 2)}</pre>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Panel>
        </Collapse>
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
              <Button type='default' danger onClick={() => onRollBack(entry)}>
                Rollback
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
