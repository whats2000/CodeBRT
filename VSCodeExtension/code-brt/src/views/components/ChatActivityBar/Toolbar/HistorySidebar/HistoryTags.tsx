import React, { useRef, useState } from 'react';
import { Input, InputRef, Space, Tag, theme } from 'antd';
import { TweenOneGroup } from 'rc-tween-one';
import { PlusOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';

import type { AppDispatch } from '../../../../redux';
import { MODEL_SERVICE_CONSTANTS } from '../../../../../constants';
import {
  addTagToConversation,
  removeTagFromConversation,
} from '../../../../redux/slices/conversationIndexSlice';

type HistoryTagsProps = {
  tags?: string[];
  historyID: string;
};

export const HistoryTags: React.FC<HistoryTagsProps> = ({
  tags,
  historyID,
}) => {
  if (!tags) {
    return null;
  }

  const { token } = theme.useToken();

  const dispatch = useDispatch<AppDispatch>();

  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<InputRef>(null);

  const handleTagClose = (historyID: string, tag: string) => {
    dispatch(removeTagFromConversation({ historyID, tag }));
  };

  const showInput = () => {
    setInputVisible(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputConfirm = (historyID: string) => {
    if (inputValue && !tags?.includes(inputValue)) {
      dispatch(addTagToConversation({ historyID, tag: inputValue }));
    }
    setInputVisible(false);
    setInputValue('');
  };

  return (
    <Space size={'small'} wrap>
      {(tags?.length || -1) > 0 && (
        <TweenOneGroup
          appear={false}
          enter={{ scale: 0.8, opacity: 0, type: 'from', duration: 100 }}
          leave={{ opacity: 0, width: 0, scale: 0, duration: 200 }}
          onEnd={(e: any) => {
            if (e.type === 'appear' || e.type === 'enter') {
              (e.target as any).style = 'display: inline-block';
            }
          }}
        >
          {tags?.map((tag, index) => {
            const color = Object.keys(MODEL_SERVICE_CONSTANTS).includes(tag)
              ? MODEL_SERVICE_CONSTANTS[
                  tag as keyof typeof MODEL_SERVICE_CONSTANTS
                ].color
              : undefined;
            return (
              <Tag
                key={`${historyID}-${index}`}
                color={color}
                closable
                onClose={(e) => {
                  e.preventDefault();
                  handleTagClose(historyID, tag);
                }}
                style={{ marginTop: 3, marginBottom: 3 }}
              >
                {tag}
              </Tag>
            );
          })}
        </TweenOneGroup>
      )}
      {inputVisible ? (
        <Input
          ref={inputRef}
          type='text'
          size='small'
          style={{ width: 78 }}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={() => handleInputConfirm(historyID)}
          onPressEnter={() => handleInputConfirm(historyID)}
        />
      ) : (
        <Tag
          onClick={showInput}
          style={{
            background: token.colorBgContainer,
            borderStyle: 'dashed',
          }}
        >
          <PlusOutlined /> New Tag
        </Tag>
      )}
    </Space>
  );
};
