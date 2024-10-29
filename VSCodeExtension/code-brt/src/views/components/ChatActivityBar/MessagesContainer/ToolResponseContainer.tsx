import React from 'react';
import { Collapse, Tag, Descriptions, Typography, Space, Button } from 'antd';

import type { ConversationEntry } from '../../../../types';
import { ToolStatusBlock } from '../../common/ToolStatusBlock';

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
  const onConfirm = (_entry: ConversationEntry) => {
    console.log('Confirming changes');
  };

  const onRollBack = (_entry: ConversationEntry) => {
    console.log('Rolling back changes');
  };

  return (
    <>
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
      <ToolStatusBlock status={toolStatus} />

      {/* Add Confirm and Rollback buttons */}
      {showActionButtons && (
        <Space wrap={true}>
          <Button type='primary' ghost={true} onClick={() => onConfirm(entry)}>
            Confirm
          </Button>
          <Button type='default' danger onClick={() => onRollBack(entry)}>
            Rollback
          </Button>
        </Space>
      )}
    </>
  );
};
