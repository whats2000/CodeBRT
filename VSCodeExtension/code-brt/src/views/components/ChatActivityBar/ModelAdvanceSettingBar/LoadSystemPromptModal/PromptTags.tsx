import React, { useRef, useState } from 'react';
import { AutoComplete, ColorPicker, Space, Tag, theme } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import type { Tag as TagType } from '../../../../../types';
import { BaseSelectRef } from 'rc-select';

type PromptTagsProps = {
  id: string;
  tags: TagType[];
  allTags: string[]; // List of all available tags for the AutoComplete
  tagColors: React.MutableRefObject<{ [key: string]: string }>;
  onTagsChange: (promptId: string, newTags: TagType[]) => void;
};

export const PromptTags: React.FC<PromptTagsProps> = ({
  id,
  tags,
  allTags,
  tagColors,
  onTagsChange,
}) => {
  const { token } = theme.useToken();
  const inputRef = useRef<BaseSelectRef>(null);

  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputColor, setInputColor] = useState('#108ee9');
  const [editingTag, setEditingTag] = useState<string | null>(null);

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

  const handleInputChange = (value: string) => {
    setInputValue(value);

    if (tagColors.current[value]) {
      setInputColor(tagColors.current[value]);
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

  const handleTagDoubleClick = (tagName: string) => {
    // Set the tag being edited
    setEditingTag(tagName);
    setInputColor(tagColors.current[tagName]);
  };

  const handleColorChange = (newColor: string) => {
    // Update the color for all tags with the same name
    const updatedTags = tags.map((tag) =>
      tag.name === editingTag ? { ...tag, color: newColor } : tag,
    );
    tagColors.current[editingTag as string] = newColor;
    setEditingTag(null);
    onTagsChange(id, updatedTags);
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
            onDoubleClick={() => handleTagDoubleClick(tag.name)} // Handle double-click
            style={{ marginTop: 3, marginBottom: 3 }}
          >
            {tag.name}
          </Tag>
        ))}
      {editingTag && (
        <ColorPicker
          value={inputColor}
          onChange={(color) => handleColorChange(color.toHexString())}
        />
      )}
      {inputVisible ? (
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
            onChange={(color) => setInputColor(color.toHexString())}
          />
        </Space>
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
