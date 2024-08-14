import React, { useRef, useState } from 'react';
import { ColorPicker, Input, InputRef, Space, Tag, theme } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import type { Tag as TagType } from '../../../../../types';

type PromptTagsProps = {
  id: string;
  tags: TagType[];
  tagColors: React.MutableRefObject<{ [key: string]: string }>;
  onTagsChange: (promptId: string, newTags: TagType[]) => void;
};

export const PromptTags: React.FC<PromptTagsProps> = ({
  id,
  tags,
  tagColors,
  onTagsChange,
}) => {
  const { token } = theme.useToken();
  const inputRef = useRef<InputRef>(null);

  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputColor, setInputColor] = useState('#108ee9');

  const handleTagClose = (removedTag: TagType) => {
    onTagsChange(
      id,
      tags.filter((tag) => tag.name !== removedTag.name),
    );
  };

  const showInput = () => {
    setInputVisible(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    if (tagColors.current[e.target.value]) {
      setInputColor(tagColors.current[e.target.value]);
    }
  };

  const handleInputConfirm = () => {
    if (inputValue) {
      // Check if the tag name already exists in the tagColors mapping
      if (!tagColors.current[inputValue]) {
        tagColors.current[inputValue] = inputColor;
      }

      const newTag: TagType = {
        name: inputValue,
        description: '',
        color: tagColors.current[inputValue],
      };

      if (!tags.some((tag) => tag.name === inputValue)) {
        onTagsChange(id, [...tags, newTag]);
      }
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
        <Input.Group compact>
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
            value={inputColor}
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
