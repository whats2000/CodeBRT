import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Button,
  Collapse,
  Descriptions,
  Dropdown,
  MenuProps,
  Progress,
  Space,
  Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  CodeOutlined,
  EditOutlined,
  FileOutlined,
  GlobalOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  PlaySquareOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  StopOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import type {
  ConversationEntry,
  NonWorkspaceToolType,
  ToolCallEntry,
  WorkspaceToolType,
} from '../../../../types';
import type { AppDispatch, RootState } from '../../../redux';
import { useDispatch, useSelector } from 'react-redux';
import { processToolCall } from '../../../redux/slices/conversationSlice';
import ReactMarkdown from 'react-markdown';
import { RendererCode } from '../../common/RenderCode';
import { WebviewContext } from '../../../WebviewContext';

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
  tempIdRef: React.MutableRefObject<string | null>;
};

export const ToolActionContainer = React.memo<ToolActionContainerProps>(
  ({ entry, showActionButtons, tempIdRef }) => {
    const { t } = useTranslation('common');
    const { callApi } = useContext(WebviewContext);
    const [autoApproveCountdown, setAutoApproveCountdown] = useState<
      number | null
    >(null);
    const AUTO_APPROVE_DELAY_SECONDS = 5;
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // Add a reference to track if auto-approve has been initiated
    const autoApproveInitiatedRef = useRef<boolean>(false);

    const dispatch = useDispatch<AppDispatch>();

    const { isProcessing } = useSelector(
      (state: RootState) => state.conversation,
    );
    const { activeModelService } = useSelector(
      (state: RootState) => state.modelService,
    );

    const { settings } = useSelector((state: RootState) => state.settings);

    const REJECTION_REASONS = [
      'today',
      'incorrectParameters',
      'selectWrongTool',
      'unnecessaryToolUsage',
      'securityConcern',
      'other',
    ];

    const shouldAutoApprove = (toolCall: ToolCallEntry): boolean => {
      if (!settings?.autoApproveActions || !toolCall) {
        return false;
      }

      // Check if this tool type is in the auto-approve list
      const isToolTypeApproved = settings.autoApproveActions.includes(
        toolCall.toolName as WorkspaceToolType | NonWorkspaceToolType,
      );

      // Additional check for executeCommand
      if (isToolTypeApproved && toolCall.toolName === 'executeCommand') {
        const command = toolCall.parameters.command as string;

        // Check against blacklist regex patterns
        return !settings.autoApproveExecuteCommandBlacklistRegex?.some(
          (pattern) => {
            try {
              const regex = new RegExp(pattern);
              return regex.test(command);
            } catch (e) {
              // If regex is invalid, skip this pattern
              return false;
            }
          },
        );
      }

      return isToolTypeApproved;
    };

    const isToolCallRecent = (toolCall: ToolCallEntry): boolean => {
      if (!toolCall.create_time) return true; // If no timestamp, assume it's recent
      
      const createTime = new Date(toolCall.create_time).getTime();
      const currentTime = new Date().getTime();
      const millisecondsSinceCreation = currentTime - createTime;
      
      // Consider the tool call "recent" if it was created less than AUTO_APPROVE_DELAY_SECONDS + 1 seconds ago
      return millisecondsSinceCreation < (AUTO_APPROVE_DELAY_SECONDS + 1) * 1000;
    };

    const shouldShowActionButtons =
      showActionButtons &&
      entry.toolCalls &&
      entry.toolCalls?.[0].toolName !== 'askFollowUpQuestion' &&
      entry.toolCalls?.[0].toolName !== 'attemptCompletion';

    useEffect(() => {
      // Start auto-approve countdown if applicable
      if (shouldShowActionButtons && entry.toolCalls && !isProcessing && !autoApproveInitiatedRef.current) {
        const toolCall = entry.toolCalls[0];

        // Only auto-approve if the tool call is eligible and was created recently
        if (shouldAutoApprove(toolCall) && isToolCallRecent(toolCall)) {
          // Mark that we've initiated auto-approve for this tool call
          autoApproveInitiatedRef.current = true;
          
          setAutoApproveCountdown(AUTO_APPROVE_DELAY_SECONDS);

          intervalRef.current = setInterval(() => {
            setAutoApproveCountdown((prev) => {
              if (prev === null || prev <= 0) {
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
                }
                return null;
              }
              return prev - 1;
            });
          }, 1000);

          timeoutRef.current = setTimeout(() => {
            void onApprove(entry);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            timeoutRef.current = null;
          }, AUTO_APPROVE_DELAY_SECONDS * 1000);

          return () => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          };
        }
      }
    }, [entry, shouldShowActionButtons, isProcessing]);

    const cancelAutoApprove = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setAutoApproveCountdown(null);
    };

    const onApprove = async (entry: ConversationEntry) => {
      const toolCall = entry.toolCalls?.[0];
      if (isProcessing || !toolCall) {
        return;
      }
      dispatch(
        processToolCall({ toolCall, entry, activeModelService, tempIdRef }),
      );
    };

    const onReject = async (reason: string, entry: ConversationEntry) => {
      if (isProcessing || !entry.toolCalls?.[0]) {
        return;
      }

      // We currently always use English for the rejection reasons
      const reasonText =
        reason === 'today'
          ? t('toolActionContainer.rejectionReasons.today', {
              date: new Date().toLocaleDateString(),
              lng: 'en-US',
            })
          : t(`toolActionContainer.rejectionReasons.${reason}`, {
              lng: 'en-US',
            });

      dispatch(
        processToolCall({
          toolCall: entry.toolCalls?.[0],
          entry,
          activeModelService,
          rejectByUserMessage: t('toolActionContainer.rejectByUserMessage', {
            toolName: entry.toolCalls?.[0].toolName,
            reason: reasonText,
            lng: 'en-US',
          }),
          tempIdRef,
        }),
      );
    };

    const rejectionMenu: Required<MenuProps>['items'][number][] =
      REJECTION_REASONS.map((reason) => ({
        key: reason,
        label:
          reason === 'today'
            ? t('toolActionContainer.rejectionReasons.today', {
                date: new Date().toLocaleDateString(),
              })
            : t(`toolActionContainer.rejectionReasons.${reason}`),
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

    const executeTheFinalResult = (toolCall: ToolCallEntry) => {
      if (
        toolCall.toolName !== 'attemptCompletion' ||
        !toolCall.parameters.command
      ) {
        // Well tho this technically should not happen
        return;
      }

      // Execute the command
      void callApi(
        'runCommand',
        toolCall.parameters.command,
        toolCall.parameters.relativePath,
      );
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
                      {toolCall.toolName}
                    </span>
                  </Space>
                }
                key='1'
              >
                <Descriptions column={1} size='small'>
                  {Object.entries(toolCall.parameters).map(([key, value]) => (
                    <Descriptions.Item
                      key={key}
                      label={key}
                      style={{ width: '100%' }}
                    >
                      {typeof value === 'string' &&
                      (key == 'content' ||
                        key == 'question' ||
                        key == 'result') ? (
                        <div style={{ width: '100%' }}>
                          <ReactMarkdown components={RendererCode}>
                            {warpWithCode(toolCall, key, value)}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <Typography.Paragraph
                          ellipsis={{ rows: 2, expandable: 'collapsible' }}
                        >
                          {JSON.stringify(value, null, 2)}
                        </Typography.Paragraph>
                      )}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Collapse.Panel>
            </Collapse>

            {/* Approve and Reject buttons */}
            {shouldShowActionButtons && (
              <Space wrap={true} direction='vertical' style={{ width: '100%' }}>
                <Space wrap={true}>
                  <Button
                    type='primary'
                    ghost={true}
                    onClick={() => onApprove(entry)}
                    loading={isProcessing}
                  >
                    {autoApproveCountdown !== null
                      ? `${t('toolActionContainer.approve')} (${autoApproveCountdown}s)`
                      : t('toolActionContainer.approve')}
                  </Button>
                  <Dropdown menu={{ items: rejectionMenu }} trigger={['hover']}>
                    <Button type='default' danger>
                      {t('toolActionContainer.reject')}
                    </Button>
                  </Dropdown>
                  {autoApproveCountdown !== null && (
                    <Button
                      icon={<StopOutlined />}
                      onClick={cancelAutoApprove}
                      type='default'
                    >
                      {t(
                        'toolActionContainer.cancelAutoApprove',
                        'Cancel Auto',
                      )}
                    </Button>
                  )}
                </Space>
                {autoApproveCountdown !== null && (
                  <Progress
                    percent={
                      ((AUTO_APPROVE_DELAY_SECONDS - autoApproveCountdown) /
                        AUTO_APPROVE_DELAY_SECONDS) *
                      100
                    }
                    showInfo={false}
                    size='small'
                    status='active'
                  />
                )}
              </Space>
            )}
            {toolCall.toolName === 'attemptCompletion' &&
              toolCall.parameters.command && (
                <Button
                  icon={<PlaySquareOutlined />}
                  onClick={() => executeTheFinalResult(toolCall)}
                  type={'primary'}
                  block={true}
                  ghost={true}
                >
                  {t('toolActionContainer.runCommand')}
                </Button>
              )}
          </Space>
        ))}
      </div>
    );
  },
);
