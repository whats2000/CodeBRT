import React, { useRef, useState } from 'react';
import { ColorPicker, Input, InputRef, Space, Tag, theme } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import type { Tag as TagType } from '../../../../../types';

type PromptTagsProps = {
  id: string;
  tags: TagType[];
  onTagsChange: (id: string, newTags: TagType[]) => void;
};

export const PromptTags: React.FC<PromptTagsProps> = ({
  id,
  tags,
  onTagsChange,
}) => {
  const { token } = theme.useToken();
  const inputRef = useRef<InputRef>(null);

  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputColor, setInputColor] = useState('#108ee9');

  const handleTagClose = (removedTag: TagType) => {
    const updatedTags = tags.filter((tag) => tag.name !== removedTag.name);
    onTagsChange(id, updatedTags);
  };

  const showInput = () => {
    setInputVisible(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputConfirm = () => {
    if (inputValue && !tags.some((tag) => tag.name === inputValue)) {
      const newTag: TagType = {
        name: inputValue,
        description: '',
        color: inputColor,
      };
      onTagsChange(id, [...tags, newTag]);
    }
    setInputVisible(false);
    setInputValue('');
  };

  return (
    <Space size={'small'} wrap>
      {tags.length > 0 &&
        tags.map((tag, index) => (
          <Tag
            key={`${tag.name}-${index}`}
            color={tag.color}
            closable
            onClose={(e) => {
              e.preventDefault();
              handleTagClose(tag);
            }}
            style={{ marginTop: 3, marginBottom: 3 }}
          >
            {tag.name}
          </Tag>
        ))}
      {inputVisible ? (
        <Input.Group compact={true}>
          <Input
            ref={inputRef}
            type='text'
            size='small'
            style={{ width: 78 }}
            value={inputValue}
            onChange={handleInputChange}
            onPressEnter={handleInputConfirm}
          />
          <ColorPicker
            size={'small'}
            defaultValue={inputColor}
            onChange={(color) => setInputColor(color.toHexString())}
          />
        </Input.Group>
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
