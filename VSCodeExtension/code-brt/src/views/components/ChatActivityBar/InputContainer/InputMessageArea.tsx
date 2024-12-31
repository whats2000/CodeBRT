import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Button, Flex, Mentions, Space, Tag, Tooltip, Typography } from 'antd';
import {
  CodeOutlined,
  FileOutlined,
  FolderOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import debounce from 'lodash/debounce';

import type { ConversationHistory } from '../../../../types';
import type { AppDispatch, RootState } from '../../../redux';
import { INPUT_MESSAGE_KEY } from '../../../../constants';
import { CancelOutlined } from '../../../icons';
import { useRefs } from '../../../context/RefContext';
import { setRefId } from '../../../redux/slices/tourSlice';
import { WebviewContext } from '../../../WebviewContext';

type InputMessageAreaProps = {
  inputMessage: string;
  setInputMessage: React.Dispatch<React.SetStateAction<string>>;
  conversationHistory: ConversationHistory & {
    tempId: string | null;
    isLoading: boolean;
    isProcessing: boolean;
  };
  sendMessage: () => Promise<void>;
  isToolResponse: boolean;
};

export const InputMessageArea: React.FC<InputMessageAreaProps> = ({
  inputMessage,
  setInputMessage,
  conversationHistory,
  sendMessage,
  isToolResponse,
}) => {
  const { t } = useTranslation('common');
  const { callApi } = useContext(WebviewContext);
  const { registerRef } = useRefs();
  const ref = useRef<string>('');
  const [enterPressCount, setEnterPressCount] = useState(0);
  const dispatch = useDispatch<AppDispatch>();
  const { settings } = useSelector((state: RootState) => state.settings);
  const { activeModelService } = useSelector(
    (state: RootState) => state.modelService,
  );
  const inputMessageRef = registerRef('inputMessage');
  const [options, setOptions] = useState<
    {
      key: string;
      label: React.ReactNode;
      value: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(
      setRefId({
        tourName: 'quickStart',
        targetId: 'inputMessage',
        stepIndex: 3,
      }),
    );
  }, [dispatch]);

  const debounceSearch = useCallback(
    debounce(async (search: string) => {
      const query = search.replace(/^(file:|folder:)/, '');
      setLoading(true);
      const files = (await callApi('getFilesOrDirectoriesList', query)).filter(
        (file) => file && file.includes(query),
      );
      setLoading(false);
      if (files.length === 0) {
        return;
      }
      setOptions(
        files.map((file) => {
          return {
            key: file,
            label: (
              <Flex wrap={'wrap'} justify='space-between' gap={5}>
                <Space>
                  {file.includes('.') ? <FileOutlined /> : <FolderOutlined />}
                  <Typography.Text>{file.split(/[\\/]/).pop()}</Typography.Text>
                </Space>
                <Tooltip title={file} placement={'right'}>
                  <Typography.Text type='secondary'>{file}</Typography.Text>
                </Tooltip>
              </Flex>
            ),
            value: file.includes('.') ? `file:${file}` : `folder:${file}`,
          };
        }),
      );
    }, 300),
    [callApi],
  );

  const handleInputMessageChange = (text: string) => {
    setInputMessage(text);
    localStorage.setItem(INPUT_MESSAGE_KEY, text);
  };

  const resetEnterPressCount = () => setEnterPressCount(0);

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (conversationHistory.isProcessing) {
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      const doubleEnterSendMessages = settings.doubleEnterSendMessages;

      if (!doubleEnterSendMessages) {
        await sendMessage();
        return;
      }

      event.preventDefault();
      if (enterPressCount === 0) {
        setTimeout(resetEnterPressCount, 500);
      }
      setEnterPressCount((prev) => prev + 1);

      if (enterPressCount + 1 >= 2 && !conversationHistory.isProcessing) {
        await sendMessage();
        resetEnterPressCount();
      }
    } else {
      resetEnterPressCount();
    }
  };

  const handleCancelResponse = () => {
    if (activeModelService === 'loading...') {
      return;
    }

    callApi('stopLanguageModelResponse', activeModelService).catch(
      console.error,
    );
  };

  const onSearch = (search: string, prefix: string) => {
    ref.current = search;
    setOptions([]);

    if (prefix === '#') {
      void debounceSearch(search);
      return;
    }

    if (prefix === '@') {
      setOptions([
        {
          key: 'workspaceProblem',
          label: (
            <Space>
              <FolderOutlined />
              <Typography.Text>
                {t('inputMessageArea.workspaceProblem')}
              </Typography.Text>
            </Space>
          ),
          value: 'problem:workspace',
        },
        {
          key: 'terminalProblem',
          label: (
            <Space>
              <CodeOutlined />
              <Typography.Text>
                {t('inputMessageArea.terminalProblem')}
              </Typography.Text>
            </Space>
          ),
          value: 'problem:terminal',
        },
      ]);
      return;
    }
  };

  return (
    <Flex gap={10} style={{ width: '100%' }} ref={inputMessageRef}>
      <Mentions
        value={inputMessage}
        onChange={handleInputMessageChange}
        onKeyDown={handleKeyDown}
        placeholder={t('inputMessageArea.pasteImagesOrMention')}
        disabled={conversationHistory.isProcessing || isToolResponse}
        autoSize={{
          minRows: 1,
          maxRows: conversationHistory.isProcessing ? 2 : 10,
        }}
        allowClear
        prefix={['@', '#']}
        onSearch={onSearch}
        loading={loading}
        options={options}
      />
      <Flex vertical={true}>
        <Button
          onClick={
            conversationHistory.isProcessing
              ? handleCancelResponse
              : sendMessage
          }
          disabled={isToolResponse}
        >
          {conversationHistory.isProcessing ? (
            <CancelOutlined />
          ) : (
            <SendOutlined />
          )}
        </Button>
        {inputMessage.length > 100 && (
          <Tag
            color='warning'
            style={{ marginTop: 5, width: '100%', textAlign: 'center' }}
          >
            {inputMessage.length}
          </Tag>
        )}
      </Flex>
    </Flex>
  );
};
