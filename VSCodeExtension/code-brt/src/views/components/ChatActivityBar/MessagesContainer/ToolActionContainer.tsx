import React, { useContext, useState } from 'react';
import {
  Collapse,
  Descriptions,
  Space,
  Button,
  Typography,
  Dropdown,
  MenuProps,
} from 'antd';
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
import type { AppDispatch } from '../../../redux';
import { WebviewContext } from '../../../WebviewContext';
import { useDispatch } from 'react-redux';
import {
  addTempResponseEntry,
  processMessage,
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

const REJECTION_REASONS = [
  'Incorrect parameters',
  'Select wrong tool',
  'Unnecessary tool usage',
  'Security concern',
  'Other',
];

type ToolActionContainerProps = {
  entry: ConversationEntry;
  tempIdRef: React.MutableRefObject<string | null>;
  showActionButtons?: boolean;
};

export const ToolActionContainer = React.memo<ToolActionContainerProps>(
  ({ entry, tempIdRef, showActionButtons }) => {
    const { callApi } = useContext(WebviewContext);
    const dispatch = useDispatch<AppDispatch>();

    const [isToolCallPending, setIsToolCallPending] = useState(false);

    const shouldShowActionButtons =
      showActionButtons &&
      entry.toolCalls &&
      entry.toolCalls?.[0].toolName !== 'askFollowUpQuestion' &&
      entry.toolCalls?.[0].toolName !== 'attemptCompletion';

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
        message:
          toolCallResponse.status === 'success'
            ? 'The tool call was executed successfully'
            : toolCallResponse,
        toolResponses: [toolCallResponse],
      } as AddConversationEntryParams);
      dispatch(replaceTempEntry(newToolCallResponseEntry));
      setIsToolCallPending(false);
    };

    const onReject = (reason: string, entry: ConversationEntry) => {
      dispatch(
        processMessage({
          message: `I reject the ${entry.toolCalls?.[0].toolName} tool call that was made. Reason: ${reason}`,
          parentId: entry.id,
          tempIdRef,
        }),
      );
    };

    const rejectionMenu: Required<MenuProps>['items'][number][] =
      REJECTION_REASONS.map((reason) => ({
        key: reason,
        label: reason,
        onClick: () => onReject(reason, entry),
      }));

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
                    <span style={{ textOverflow: 'ellipsis' }}>
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
                        ellipsis={{ rows: 2, expandable: 'collapsible' }}
                      >
                        {JSON.stringify(value)}
                      </Typography.Paragraph>
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Collapse.Panel>
            </Collapse>

            {/* Approve and Reject buttons */}
            {shouldShowActionButtons && (
              <Space wrap={true}>
                <Button
                  type='primary'
                  ghost={true}
                  onClick={() => onApprove(entry)}
                  loading={isToolCallPending}
                >
                  Approve
                </Button>
                <Dropdown menu={{ items: rejectionMenu }} trigger={['hover']}>
                  <Button type='default' danger>
                    Reject
                  </Button>
                </Dropdown>
              </Space>
            )}
          </Space>
        ))}
      </div>
    );
  },
);
