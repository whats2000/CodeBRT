import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Tag,
  ColorPicker,
  Flex,
  AutoComplete,
  Space,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import type { SystemPrompt, Tag as TagType } from '../../../../types';
import { WebviewContext } from '../../../WebviewContext';

interface SaveSystemPromptModalProps {
  open: boolean;
  onClose: () => void;
  currentPromptContent: string;
}

export const SaveSystemPromptModal: React.FC<SaveSystemPromptModalProps> = ({
  open,
  onClose,
  currentPromptContent,
}) => {
  const { callApi } = useContext(WebviewContext);
  const [form] = Form.useForm();

  const [partialSettings, setPartialSettings] = useState<{
    systemPrompts: SystemPrompt[];
  }>({
    systemPrompts: [],
  });

  const [tags, setTags] = useState<TagType[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [color, setColor] = useState('#108ee9');

  const tagColors = useRef<{ [key: string]: string }>({});

  useEffect(() => {
    if (open) {
      callApi('getSetting', 'systemPrompts').then(
        (response: SystemPrompt[]) => {
          setPartialSettings({ systemPrompts: response });
          const tagsAvailable = new Set<string>();
          response.forEach((prompt) => {
            if (Array.isArray(prompt.tags)) {
              prompt.tags.forEach((tag) => tagsAvailable.add(tag.name));
            }
          });
          setAllTags(Array.from(tagsAvailable));
        },
      );
      form.setFieldsValue({
        name: '',
        description: '',
        content: currentPromptContent,
        tags: [],
      });
    }
  }, [open, currentPromptContent]);

  const handleSave = () => {
    form
      .validateFields()
      .then((values) => {
        const newPrompt: SystemPrompt = {
          id: `prompt-${Date.now()}`,
          name: values.name,
          description: values.description,
          content: values.content,
          tags,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        callApi('setSetting', 'systemPrompts', [
          ...partialSettings.systemPrompts,
          newPrompt,
        ]).then(() => {
          onClose();
        });
      })
      .catch((error) => {
        console.error('Failed to save system prompt:', error);
      });
  };

  const handleTagClose = (removedTag: TagType) => {
    setTags(tags.filter((tag) => tag !== removedTag));
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);

    if (tagColors.current[value]) {
      setColor(tagColors.current[value]);
    }
  };

  const handleInputConfirm = () => {
    if (inputValue) {
      // Check if the tag name already exists in the tagColors mapping
      if (!tagColors.current[inputValue]) {
        tagColors.current[inputValue] = color;
      }

      const newTag: TagType = {
        name: inputValue,
        description: '',
        color: tagColors.current[inputValue],
      };

      if (!tags.some((tag) => tag.name === inputValue)) {
        setTags([...tags, newTag]);
      }
    }
    setInputVisible(false);
    setInputValue('');
  };

  return (
    <Modal
      title='Save System Prompt'
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText='Save'
      cancelText='Cancel'
    >
      <Form form={form} layout='vertical'>
        <Form.Item
          label='Prompt Name'
          name='name'
          rules={[
            { required: true, message: 'Please enter a name for the prompt' },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item label='Description' name='description'>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 10 }} />
        </Form.Item>
        <Form.Item
          label='Content'
          name='content'
          rules={[
            { required: true, message: 'Please enter the prompt content' },
          ]}
        >
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 10 }} />
        </Form.Item>
        <Form.Item label='Tags'>
          <Flex gap={10}>
            {tags.map((tag) => (
              <Tag
                key={tag.name}
                color={tag.color}
                closable
                onClose={() => handleTagClose(tag)}
              >
                {tag.name}
              </Tag>
            ))}
            {inputVisible ? (
              <Space>
                <AutoComplete
                  size={'small'}
                  style={{ width: 200 }}
                  options={allTags?.map((tag) => ({ value: tag }))}
                  searchValue={inputValue}
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
                  value={color}
                  onChange={(newColor) => setColor(newColor.toHexString())}
                />
              </Space>
            ) : (
              <Button size='small' type='dashed' onClick={showInput}>
                <PlusOutlined /> New Tag
              </Button>
            )}
          </Flex>
        </Form.Item>
      </Form>
    </Modal>
  );
};
