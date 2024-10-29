import React, { useContext } from 'react';
import { Collapse, Descriptions, Space, Button, Typography } from 'antd';
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
  AddConversationEntryParams,
} from '../../../../types';
import { WebviewContext } from '../../../WebviewContext';
import { useDispatch } from 'react-redux';
import {
  addTempResponseEntry,
  replaceTempEntry,
} from '../../../redux/slices/conversationSlice';

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
    const { callApi } = useContext(WebviewContext);
    const dispatch = useDispatch();

    const [isToolCallPending, setIsToolCallPending] = React.useState(false);

    const onApprove = async (entry: ConversationEntry) => {
      const toolCall = entry.toolCalls?.[0];
      if (isToolCallPending || !toolCall) {
        return;
      }
      setIsToolCallPending(true);
      dispatch(addTempResponseEntry({ parentId: entry.id, role: 'tool' }));
      const toolCallResponse = await callApi('approveToolCall', toolCall);
      const newToolCallResponseEntry = await callApi('addConversationEntry', {
        parentID: entry.id,
        role: 'tool',
        message: '',
        toolResponses: [toolCallResponse],
      } as AddConversationEntryParams);
      dispatch(replaceTempEntry(newToolCallResponseEntry));
      setIsToolCallPending(false);
    };
    const onReject = (_entry: ConversationEntry) => {};

    return (
      <div style={{ margin: '10px 0' }}>
        {entry.toolCalls?.map((toolCall) => (
          <Space
            direction={'vertical'}
            key={toolCall.id}
            style={{ width: '100%' }}
          >
            <Collapse
              defaultActiveKey={showActionButtons ? '1' : undefined}
              style={{ width: '100%' }}
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
                      <Typography.Paragraph
                        ellipsis={{
                          rows: 2,
                          expandable: 'collapsible',
                        }}
                      >
                        {JSON.stringify(value)}
                      </Typography.Paragraph>
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Collapse.Panel>
            </Collapse>

            {/* Add Approve and Reject buttons */}
            {showActionButtons && (
              <Space wrap={true}>
                <Button
                  type='primary'
                  ghost={true}
                  onClick={() => onApprove(entry)}
                  loading={isToolCallPending}
                >
                  Approve
                </Button>
                <Button type='default' danger onClick={() => onReject(entry)}>
                  Reject
                </Button>
              </Space>
            )}
          </Space>
        ))}
      </div>
    );
  },
);
