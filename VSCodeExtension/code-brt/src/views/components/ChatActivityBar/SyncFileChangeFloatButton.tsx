import React, { useContext, useEffect } from 'react';
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
import { setRefId } from '../../redux/slices/tourSlice';
import { useRefs } from '../../context/RefContext';

type SyncFileChangeFloatButtonProps = {
  floatButtonBaseYPosition: number;
};

export const SyncFileChangeFloatButton: React.FC<
  SyncFileChangeFloatButtonProps
> = ({ floatButtonBaseYPosition }) => {
  const { callApi } = useContext(WebviewContext);
  const { registerRef } = useRefs();

  const conversationHistory = useSelector(
    (state: RootState) => state.conversation,
  );
  const { isLoading } = useSelector((state: RootState) => state.settings);
  const { isProcessing } = useSelector(
    (state: RootState) => state.conversation,
  );

  const dispatch = useDispatch<AppDispatch>();

  const syncFileChangeFloatButton = registerRef('syncFileChangeFloatButton');

  useEffect(() => {
    dispatch(
      setRefId({
        tourName: 'quickStart',
        stepIndex: 6,
        targetId: 'syncFileChangeFloatButton',
      }),
    );
  }, []);

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
    <>
      <div
        ref={syncFileChangeFloatButton}
        style={{
          position: 'absolute',
          insetInlineEnd: 40,
          bottom: floatButtonBaseYPosition + 110,
          height: 40,
          width: 40,
        }}
      />
      <FloatButton
        tooltip={'Synchronize the file changes to chat history'}
        icon={
          conversationHistory.isLoading || isLoading || isProcessing ? (
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
    </>
  );
};
