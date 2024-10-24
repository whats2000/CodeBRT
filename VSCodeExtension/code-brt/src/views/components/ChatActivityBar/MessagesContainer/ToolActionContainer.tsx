import React from 'react';
import { Collapse, Descriptions, Space, Button } from 'antd';
import {
  PlayCircleOutlined,
  FileOutlined,
  EditOutlined,
  SearchOutlined,
  UnorderedListOutlined,
  CodeOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  LinkOutlined,
} from '@ant-design/icons';

import type {
  ConversationEntry,
  WorkspaceToolType,
  NonWorkspaceToolType,
} from '../../../../types';

// Mapping tool names to Antd icons
const MAP_TOOL_NAME_TO_ICON: {
  [key in WorkspaceToolType | NonWorkspaceToolType]: React.ReactNode;
} = {
  executeCommand: <PlayCircleOutlined />,
  readFile: <FileOutlined />,
  writeToFile: <EditOutlined />,
  searchFiles: <SearchOutlined />,
  listFiles: <UnorderedListOutlined />,
  listCodeDefinitionNames: <CodeOutlined />,
  inspectSite: <SearchOutlined />,
  askFollowUpQuestion: <QuestionCircleOutlined />,
  attemptCompletion: <CheckCircleOutlined />,
  webSearch: <GlobalOutlined />,
  urlFetcher: <LinkOutlined />,
};

type ToolActionContainerProps = {
  entry: ConversationEntry;
  showActionButtons?: boolean;
};

export const ToolActionContainer = React.memo<ToolActionContainerProps>(
  ({ entry, showActionButtons }) => {
    const onApprove = (_entry: ConversationEntry) => {};
    const onReject = (_entry: ConversationEntry) => {};

    return (
      <div style={{ marginTop: 10 }}>
        {entry.toolCalls?.map((toolCall) => (
          <Collapse
            key={toolCall.id}
            defaultActiveKey={showActionButtons ? '1' : undefined}
          >
            <Collapse.Panel
              header={
                <Space wrap={true}>
                  {MAP_TOOL_NAME_TO_ICON[
                    toolCall.toolName as
                      | WorkspaceToolType
                      | NonWorkspaceToolType
                  ] ?? <span>Unknown Tool</span>}
                  <span
                    style={{
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {toolCall.toolName.charAt(0).toUpperCase() +
                      toolCall.toolName.slice(1)}
                  </span>
                </Space>
              }
              key='1'
            >
              <Descriptions column={1} size='small'>
                {Object.entries(toolCall.parameters).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {JSON.stringify(value)}
                  </Descriptions.Item>
                ))}
              </Descriptions>

              {/* Add Approve and Reject buttons */}
              {showActionButtons && (
                <Space wrap={true} style={{ marginTop: 16 }}>
                  <Button
                    type='primary'
                    ghost={true}
                    onClick={() => onApprove(entry)}
                  >
                    Approve
                  </Button>
                  <Button type='default' danger onClick={() => onReject(entry)}>
                    Reject
                  </Button>
                </Space>
              )}
            </Collapse.Panel>
          </Collapse>
        ))}
      </div>
    );
  },
);
