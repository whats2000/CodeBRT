import React from 'react';
import { Collapse, Tag, Descriptions, Typography, Space } from 'antd';

import type { ConversationEntry } from '../../../../types';
import { ToolStatusBlock } from '../../common/ToolStatusBlock';

const { Panel } = Collapse;

type ToolResponseContainerProps = {
  entry: ConversationEntry;
  toolStatus: string;
};

export const ToolResponseContainer: React.FC<ToolResponseContainerProps> = ({
  entry,
  toolStatus,
}) => {
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
    </>
  );
};
