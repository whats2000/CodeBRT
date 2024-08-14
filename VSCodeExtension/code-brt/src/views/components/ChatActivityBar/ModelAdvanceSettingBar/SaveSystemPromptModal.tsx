import React, { useState, useContext, useEffect } from 'react';
import { Modal, Form, Input, Button, Tag, ColorPicker, Flex } from 'antd';
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
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [color, setColor] = useState('#108ee9');

  useEffect(() => {
    if (open) {
      callApi('getSetting', 'systemPrompts').then((response) => {
        setPartialSettings({ systemPrompts: response });
      });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputConfirm = () => {
    if (inputValue && !tags.find((tag) => tag.name === inputValue)) {
      const newTag: TagType = {
        name: inputValue,
        description: '',
        color,
      };
      setTags([...tags, newTag]);
    }
    setInputVisible(false);
    setInputValue('');
  };

  console.log(partialSettings);

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
              <Input
                type='text'
                size='small'
                style={{ width: 78 }}
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputConfirm}
                onPressEnter={handleInputConfirm}
              />
            ) : (
              <Button.Group>
                <Button size='small' type='dashed' onClick={showInput}>
                  <PlusOutlined /> New Tag
                </Button>
                <ColorPicker
                  value={color}
                  size={'small'}
                  onChange={(newColor) => setColor(newColor.toHexString())}
                />
              </Button.Group>
            )}
          </Flex>
        </Form.Item>
      </Form>
    </Modal>
  );
};
