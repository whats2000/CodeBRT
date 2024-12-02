import React, { useContext, useEffect, useState } from 'react';
import { Button, Flex, Input, Tag } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';

import type { ConversationHistory } from '../../../../types';
import type { AppDispatch, RootState } from '../../../redux';
import { INPUT_MESSAGE_KEY } from '../../../../constants';
import { CancelOutlined } from '../../../icons';
import { useWindowSize } from '../../../hooks';
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
  const { callApi } = useContext(WebviewContext);
  const { innerWidth } = useWindowSize();
  const { registerRef } = useRefs();
  const [enterPressCount, setEnterPressCount] = useState(0);
  const dispatch = useDispatch<AppDispatch>();
  const { settings } = useSelector((state: RootState) => state.settings);
  const { activeModelService } = useSelector(
    (state: RootState) => state.modelService,
  );
  const inputMessageRef = registerRef('inputMessage');

  useEffect(() => {
    dispatch(
      setRefId({
        tourName: 'quickStart',
        targetId: 'inputMessage',
        stepIndex: 3,
      }),
    );
  }, [dispatch]);

  const handleInputMessageChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setInputMessage(e.target.value);
    localStorage.setItem(INPUT_MESSAGE_KEY, e.target.value);
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

  return (
    <Flex gap={10} style={{ width: '100%' }} ref={inputMessageRef}>
      <Input.TextArea
        value={inputMessage}
        onChange={handleInputMessageChange}
        onKeyDown={handleKeyDown}
        placeholder={innerWidth > 520 ? 'Paste images...' : 'Ask...'}
        disabled={conversationHistory.isProcessing || isToolResponse}
        autoSize={{
          minRows: 1,
          maxRows: conversationHistory.isProcessing ? 2 : 10,
        }}
        allowClear
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
