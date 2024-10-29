import React from 'react';
import { Collapse, Tag, Descriptions, Typography, Space } from 'antd';

import type { ConversationEntry } from '../../../../types';

const { Panel } = Collapse;

type ToolResponseContainerProps = {
  entry: ConversationEntry;
};

export const ToolResponseContainer: React.FC<ToolResponseContainerProps> = ({
  entry,
}) => {
  return (
    <div>
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
                  <Typography.Text>{response.result}</Typography.Text>
                ) : (
                  <pre>{JSON.stringify(response.result, null, 2)}</pre>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Panel>
        </Collapse>
      ))}
    </div>
  );
};
