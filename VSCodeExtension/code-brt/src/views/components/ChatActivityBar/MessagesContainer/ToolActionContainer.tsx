import React from 'react';
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
  ToolCallEntry,
} from '../../../../types';
import type { AppDispatch, RootState } from '../../../redux';
import { useDispatch, useSelector } from 'react-redux';
import { processToolCall } from '../../../redux/slices/conversationSlice';
import ReactMarkdown from 'react-markdown';
import { RendererCode } from '../../common/RenderCode';

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
  'Today is ' + new Date().toLocaleDateString(),
  'Incorrect parameters',
  'Select wrong tool',
  'Unnecessary tool usage',
  'Security concern',
  'Other',
];

type ToolActionContainerProps = {
  entry: ConversationEntry;
  showActionButtons?: boolean;
  tempIdRef: React.MutableRefObject<string | null>;
};

export const ToolActionContainer = React.memo<ToolActionContainerProps>(
  ({ entry, showActionButtons, tempIdRef }) => {
    const dispatch = useDispatch<AppDispatch>();

    const { isProcessing } = useSelector(
      (state: RootState) => state.conversation,
    );

    const shouldShowActionButtons =
      showActionButtons &&
      entry.toolCalls &&
      entry.toolCalls?.[0].toolName !== 'askFollowUpQuestion' &&
      entry.toolCalls?.[0].toolName !== 'attemptCompletion';

    const onApprove = async (entry: ConversationEntry) => {
      const toolCall = entry.toolCalls?.[0];
      if (isProcessing || !toolCall) {
        return;
      }
      dispatch(processToolCall({ toolCall, entry }));
    };

    const onReject = async (reason: string, entry: ConversationEntry) => {
      if (isProcessing || !entry.toolCalls?.[0]) {
        return;
      }

      dispatch(
        processToolCall({
          toolCall: entry.toolCalls?.[0],
          entry,
          rejectByUserMessage: `I reject the ${entry.toolCalls?.[0].toolName} tool call that was made. Reason: ${reason}`,
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

    const warpWithCode = (
      toolCall: ToolCallEntry,
      key: string,
      renderString: string,
    ) => {
      if (toolCall.toolName !== 'writeToFile' || key !== 'content') {
        return renderString;
      }
      const fileType = (toolCall.parameters['relativePath'] as string)
        ?.split('.')
        .pop();
      if (!fileType) {
        return renderString;
      }
      return `\`\`\`${fileType}\n${renderString}\n\`\`\``;
    };

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
                      {typeof value === 'string' ? (
                        <div style={{ width: '100%' }}>
                          <ReactMarkdown components={RendererCode}>
                            {warpWithCode(toolCall, key, value)}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <Typography.Paragraph
                          ellipsis={{ rows: 2, expandable: 'collapsible' }}
                        >
                          <pre>{JSON.stringify(value, null, 2)}</pre>
                        </Typography.Paragraph>
                      )}
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
                  loading={isProcessing}
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
