import React from 'react';
import { Card, Collapse, Descriptions, Space } from 'antd';
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
import {
  ConversationEntry,
  WorkspaceToolType,
  NonWorkspaceToolType,
} from '../../../../types';

const { Panel } = Collapse;

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
};

export const ToolActionContainer = React.memo<ToolActionContainerProps>(
  ({ entry }) => {
    return (
      <div style={{ marginTop: 10 }}>
        {entry.toolCalls?.map((toolCall) => (
          <Collapse key={toolCall.id}>
            <Panel
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
            </Panel>
          </Collapse>
        ))}
      </div>
    );
  },
);
