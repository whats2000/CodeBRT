import React, { useRef, useState } from 'react';
import { AutoComplete, ColorPicker, Space, Tag, theme } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import type { Tag as TagType } from '../../../../../types';
import { BaseSelectRef } from 'rc-select';

type PromptTagsProps = {
  id: string;
  tags: TagType[];
  allTags: string[];
  tagColors: React.MutableRefObject<{ [key: string]: string }>;
  onTagsChange: (promptId: string, newTags: TagType[]) => void;
  onTagEdit: (oldTag: TagType, newTag: TagType) => void;
};

export const PromptTags: React.FC<PromptTagsProps> = ({
  id,
  tags,
  allTags,
  tagColors,
  onTagsChange,
  onTagEdit,
}) => {
  const { token } = theme.useToken();
  const inputRef = useRef<BaseSelectRef>(null);

  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputColor, setInputColor] = useState('#108ee9');
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleTagClose = (removedTag: TagType) => {
    onTagsChange(
      id,
      tags.filter((tag) => tag.name !== removedTag.name),
    );
  };

  const handleTagDoubleClick = (tag: TagType, index: number) => {
    setEditingTag(tag);
    setEditingIndex(index);
    setInputValue(tag.name);
    setInputColor(tag.color);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setInputColor(tagColors.current[value] || '#108ee9');
  };

  const handleInputConfirm = () => {
    if (editingTag && inputValue) {
      const newTag: TagType = {
        name: inputValue,
        description: '',
        color: inputColor,
      };

      // Update the tagColors reference
      tagColors.current[inputValue] = inputColor;

      // Update the tag list
      const newTags = [...tags];
      newTags[editingIndex as number] = newTag;

      // Apply the change to all matching tags
      onTagEdit(editingTag, newTag);

      // Reset editing state
      setEditingTag(null);
      setEditingIndex(null);
    } else if (!editingTag && inputValue) {
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

  const handleColorChange = (newColor: string) => {
    setInputColor(newColor);
  };

  return (
    <Space size={'small'} wrap>
      {tags.map((tag, index) => (
        <React.Fragment key={`${tag.name}-${index}`}>
          {editingTag && editingIndex === index ? (
            <Space>
              <AutoComplete
                size={'small'}
                ref={inputRef}
                style={{ width: 200 }}
                options={allTags?.map((tag) => ({ value: tag }))}
                value={inputValue}
                onChange={handleInputChange}
                onSelect={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleInputConfirm();
                  }
                }}
                placeholder='Enter or select tag'
              />
              <ColorPicker
                size={'small'}
                value={inputColor}
                onChange={(color) => handleColorChange(color.toHexString())}
              />
            </Space>
          ) : (
            <Tag
              color={tag.color}
              closable
              onClose={(e) => {
                e.preventDefault();
                handleTagClose(tag);
              }}
              onDoubleClick={() => handleTagDoubleClick(tag, index)}
              style={{ marginTop: 3, marginBottom: 3 }}
            >
              {tag.name}
            </Tag>
          )}
        </React.Fragment>
      ))}
      {!editingTag && inputVisible && (
        <Space>
          <AutoComplete
            size={'small'}
            ref={inputRef}
            style={{ width: 200 }}
            options={allTags?.map((tag) => ({ value: tag }))}
            value={inputValue}
            onChange={handleInputChange}
            onSelect={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleInputConfirm();
              }
            }}
            placeholder='Enter or select tag'
          />
          <ColorPicker
            size={'small'}
            value={inputColor}
            onChange={(color) => handleColorChange(color.toHexString())}
          />
        </Space>
      )}
      {!inputVisible && !editingTag && (
        <Tag
          onClick={() => setInputVisible(true)}
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
