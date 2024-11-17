import React, { useContext } from 'react';
import { SyncOutlined } from '@ant-design/icons';
import { FloatButton } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../redux';

import { WebviewContext } from '../../WebviewContext';
import {
  finishLoading,
  setConversationHistory,
  startLoading,
} from '../../redux/slices/conversationSlice';

type SyncFileChangeFloatButtonProps = {
  floatButtonBaseYPosition: number;
};

export const SyncFileChangeFloatButton: React.FC<
  SyncFileChangeFloatButtonProps
> = ({ floatButtonBaseYPosition }) => {
  const { callApi } = useContext(WebviewContext);

  const conversationHistory = useSelector(
    (state: RootState) => state.conversation,
  );
  const { isLoading } = useSelector((state: RootState) => state.settings);

  const dispatch = useDispatch<AppDispatch>();

  const handleSyncFileChange = async () => {
    if (conversationHistory.isLoading || isLoading) {
      return;
    }
    dispatch(startLoading());
    try {
      const newHistory = await callApi('syncFileChangeContext', [], true);
      dispatch(setConversationHistory(newHistory));
    } catch (error) {
      console.error(error);
    } finally {
      dispatch(finishLoading());
    }
  };

  return (
    <FloatButton
      tooltip={'Synchronize the file changes to chat history'}
      icon={
        conversationHistory.isLoading || isLoading ? (
          <SyncOutlined spin={true} />
        ) : (
          <SyncOutlined />
        )
      }
      style={{
        insetInlineEnd: 40,
        bottom: floatButtonBaseYPosition + 110,
      }}
      onClick={handleSyncFileChange}
    />
  );
};
