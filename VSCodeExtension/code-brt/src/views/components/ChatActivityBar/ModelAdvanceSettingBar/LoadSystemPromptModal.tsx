import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  List,
  Button,
  Typography,
  Popconfirm,
  Drawer,
  Tooltip,
  Select,
  Space,
  Flex,
  GlobalToken,
  theme,
} from 'antd';
import { DeleteOutlined, EditOutlined, TagOutlined } from '@ant-design/icons';

import type {
  ConversationModelAdvanceSettings,
  SystemPrompt,
  Tag as TagType,
} from '../../../../types';
import { WebviewContext } from '../../../WebviewContext';
import { PromptTags } from './LoadSystemPromptModal/PromptTags';
import styled from 'styled-components';

const StyledDrawer = styled(Drawer)`
  & .ant-drawer-header {
    padding: 10px;
  }

  & .ant-drawer-body {
    padding: 0;
  }
`;

const StyledListItem = styled(List.Item)<{
  $token: GlobalToken;
}>`
  cursor: pointer;
  margin: 4px;
  padding: 8px 0 !important;
  border-radius: 4px;

  background-color: transparent;

  &:hover {
    background-color: ${({ $token }) => $token.colorBgTextHover};
  }
`;

type LoadSystemPromptModalProps = {
  open: boolean;
  onClose: () => void;
  setNewAdvanceSettings: React.Dispatch<
    React.SetStateAction<ConversationModelAdvanceSettings>
  >;
};

export const LoadSystemPromptModal: React.FC<LoadSystemPromptModalProps> = ({
  open,
  onClose,
  setNewAdvanceSettings,
}) => {
  const { callApi } = useContext(WebviewContext);
  const { token } = theme.useToken();

  const [showTags, setShowTags] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<SystemPrompt[]>([]);

  // Centralized tag colors mapping
  const tagColors = useRef<{ [key: string]: string }>({});

  useEffect(() => {
    if (open) {
      callApi('getSetting', 'systemPrompts').then((response) => {
        const promptsWithTags = response.map((prompt: SystemPrompt) => ({
          ...prompt,
          tags: Array.isArray(prompt.tags) ? prompt.tags : [],
        }));
        setSystemPrompts(promptsWithTags);
      });
    }
  }, [open]);

  useEffect(() => {
    const tagsAvailable = new Set<string>();
    systemPrompts.forEach((prompt) => {
      if (Array.isArray(prompt.tags)) {
        prompt.tags.forEach((tag) => tagsAvailable.add(tag.name));
      }
    });
    setAllTags(Array.from(tagsAvailable));
  }, [systemPrompts]);

  useEffect(() => {
    if (filterTags.length === 0) {
      setFilteredPrompts(systemPrompts);
    } else {
      const filtered = systemPrompts.filter((prompt) =>
        filterTags.every((tag) => prompt.tags.some((t) => t.name === tag)),
      );
      setFilteredPrompts(filtered);
    }
  }, [filterTags, systemPrompts]);

  const handleLoad = (content: string) => {
    setNewAdvanceSettings((prevSettings) => ({
      ...prevSettings,
      systemPrompt: content,
    }));
  };

  const handleDelete = (id: string) => {
    const updatedPrompts = systemPrompts.filter((prompt) => prompt.id !== id);
    setSystemPrompts(updatedPrompts);

    callApi('setSetting', 'systemPrompts', updatedPrompts).catch((error) => {
      console.error('Failed to delete system prompt:', error);
    });
  };

  const handleDrawerClose = () => {
    // Save the updated system prompts when the drawer is closed
    callApi('setSetting', 'systemPrompts', systemPrompts)
      .then(() => {
        console.log('System prompts updated successfully');
      })
      .catch((error) => {
        console.error('Failed to update system prompts:', error);
      });

    onClose();
  };

  const onTagsChange = (promptId: string, newTags: TagType[]) => {
    setSystemPrompts((prevPrompts) =>
      prevPrompts.map((prompt) =>
        prompt.id === promptId ? { ...prompt, tags: newTags } : prompt,
      ),
    );
  };

  return (
    <StyledDrawer
      title={
        <Flex justify={'space-between'} align={'center'}>
          <Typography.Text>Load System Prompt</Typography.Text>
          <Tooltip title='Show Tags'>
            <Button
              type={showTags ? 'primary' : 'default'}
              icon={<TagOutlined />}
              onClick={() => setShowTags((prev) => !prev)}
            />
          </Tooltip>
        </Flex>
      }
      open={open}
      onClose={handleDrawerClose} // Use the new handler here
      placement={'right'}
    >
      {showTags && (
        <div style={{ padding: 16 }}>
          <Select
            mode='tags'
            style={{ width: '100%' }}
            placeholder='Filter by tags'
            value={filterTags}
            onChange={setFilterTags}
          >
            {allTags.map((tag) => (
              <Select.Option key={tag} value={tag}>
                {tag}
              </Select.Option>
            ))}
          </Select>
        </div>
      )}
      <List
        dataSource={filteredPrompts}
        renderItem={(item) => (
          <StyledListItem
            $token={token}
            actions={[
              <Button type='text' icon={<EditOutlined />} ghost={true} />,
              <Popconfirm
                title='Are you sure you want to delete this prompt?'
                onConfirm={() => handleDelete(item.id)}
                okText='Yes'
                cancelText='No'
              >
                <Button type={'text'} danger={true} icon={<DeleteOutlined />} />
              </Popconfirm>,
            ]}
          >
            <Space
              direction='vertical'
              style={{ paddingLeft: 24, width: '100%', maxWidth: '65%' }}
            >
              <div
                onClick={() => handleLoad(item.content)}
                style={{ width: '100%' }}
              >
                <Typography.Text>{item.name}</Typography.Text>
              </div>
              {showTags && (
                <PromptTags
                  id={item.id}
                  tags={item.tags}
                  tagColors={tagColors}
                  allTags={allTags}
                  onTagsChange={onTagsChange}
                />
              )}
            </Space>
          </StyledListItem>
        )}
      />
    </StyledDrawer>
  );
};
