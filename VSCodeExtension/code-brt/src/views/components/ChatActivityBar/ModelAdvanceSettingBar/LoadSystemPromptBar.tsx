import React, { useState, useContext, useEffect, useRef } from 'react';
import type { GlobalToken } from 'antd';
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
  theme,
  Popover,
  AutoComplete,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';

import type {
  ConversationModelAdvanceSettings,
  SystemPrompt,
  Tag as TagType,
} from '../../../../types';
import { WebviewContext } from '../../../WebviewContext';
import { PromptTags } from './LoadSystemPromptModal/PromptTags';
import { EditPromptForm } from './LoadSystemPromptModal/EditPromptForm';

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

type LoadSystemPromptBarProps = {
  open: boolean;
  onClose: () => void;
  setNewAdvanceSettings: React.Dispatch<
    React.SetStateAction<ConversationModelAdvanceSettings>
  >;
};

export const LoadSystemPromptBar: React.FC<LoadSystemPromptBarProps> = ({
  open,
  onClose,
  setNewAdvanceSettings,
}) => {
  const { callApi } = useContext(WebviewContext);
  const { token } = theme.useToken();

  const [showFilter, setShowFilter] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterName, setFilterName] = useState<string>(''); // State for name filter
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<SystemPrompt[]>([]);
  const [isEditPromptFormOpen, setIsEditPromptFormOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState<SystemPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Centralized tag colors mapping
  const tagColors = useRef<{ [key: string]: string }>({});

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      callApi('getSettingByKey', 'systemPrompts')
        .then((response) => {
          const promptsWithTags = response.map((prompt: SystemPrompt) => ({
            ...prompt,
            tags: Array.isArray(prompt.tags) ? prompt.tags : [],
          }));

          // Initialize tagColors ref with existing tags
          promptsWithTags.forEach((prompt: SystemPrompt) => {
            prompt.tags.forEach((tag) => {
              if (!tagColors.current[tag.name]) {
                tagColors.current[tag.name] = tag.color;
              }
            });
          });

          setSystemPrompts(promptsWithTags);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Failed to get system prompts:', error);
          setIsLoading(false);
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
    const filteredByTags =
      filterTags.length === 0
        ? systemPrompts
        : systemPrompts.filter((prompt) =>
            filterTags.every((tag) => prompt.tags.some((t) => t.name === tag)),
          );

    const filteredByName = filterName
      ? filteredByTags.filter((prompt) =>
          prompt.name.toLowerCase().includes(filterName.toLowerCase()),
        )
      : filteredByTags;

    setFilteredPrompts(filteredByName);
  }, [filterTags, filterName, systemPrompts]);

  const handleLoad = (content: string) => {
    setNewAdvanceSettings((prevSettings) => ({
      ...prevSettings,
      systemPrompt: content,
    }));
  };

  const handleDelete = (id: string) => {
    const updatedPrompts = systemPrompts.filter((prompt) => prompt.id !== id);
    setSystemPrompts(updatedPrompts);

    callApi('setSettingByKey', 'systemPrompts', updatedPrompts).catch(
      (error) => {
        console.error('Failed to delete system prompt:', error);
      },
    );
  };

  const handleDrawerClose = () => {
    if (isLoading) {
      onClose();
      return;
    }

    // Save the updated system prompts when the drawer is closed
    callApi('setSettingByKey', 'systemPrompts', systemPrompts).catch(
      (error) => {
        console.error('Failed to update system prompts:', error);
      },
    );

    onClose();
  };

  const onTagsChange = (promptId: string, newTags: TagType[]) => {
    setSystemPrompts((prevPrompts) =>
      prevPrompts.map((prompt) =>
        prompt.id === promptId ? { ...prompt, tags: newTags } : prompt,
      ),
    );
  };

  const openEditModal = (prompt: SystemPrompt) => {
    setEditPrompt(prompt);
    setIsEditPromptFormOpen(true);
  };

  const saveEditedPrompt = (updatedPrompt: SystemPrompt) => {
    setSystemPrompts((prevPrompts) =>
      prevPrompts.map((prompt) =>
        prompt.id === updatedPrompt.id ? updatedPrompt : prompt,
      ),
    );
    setIsEditPromptFormOpen(false);
  };

  // Method to update all tags with the same name across all prompts
  const changeTag = (oldTag: TagType, newTag: TagType) => {
    setSystemPrompts((prevPrompts) =>
      prevPrompts.map((prompt) => {
        const updatedTags = prompt.tags.map((tag) =>
          tag.name === oldTag.name ? { ...tag, ...newTag } : tag,
        );
        return { ...prompt, tags: updatedTags };
      }),
    );

    // Update the tagColors ref
    if (tagColors.current[oldTag.name]) {
      delete tagColors.current[oldTag.name];
    }
    tagColors.current[newTag.name] = newTag.color;
  };

  return (
    <>
      <StyledDrawer
        title={
          <Flex justify={'space-between'} align={'center'}>
            <Typography.Text>Load System Prompt</Typography.Text>
            <Tooltip
              title={showFilter ? 'Hide Filters' : 'Show Filters'}
              placement={'left'}
            >
              <Button
                type={showFilter ? 'primary' : 'default'}
                icon={<FilterOutlined />}
                onClick={() => setShowFilter((prev) => !prev)}
              />
            </Tooltip>
          </Flex>
        }
        open={open}
        onClose={handleDrawerClose}
        placement={'right'}
        loading={isLoading}
      >
        {showFilter && (
          <div style={{ padding: 16 }}>
            <AutoComplete
              style={{ width: '100%', marginBottom: 16 }}
              placeholder='Search by name'
              options={systemPrompts.map((prompt) => ({ value: prompt.name }))}
              value={filterName}
              onChange={(value) => setFilterName(value)}
              filterOption={(inputValue, option) =>
                option?.value
                  .toLowerCase()
                  .includes(inputValue.toLowerCase()) as boolean
              }
            />
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
          dataSource={showFilter ? filteredPrompts : systemPrompts}
          renderItem={(item) => (
            <StyledListItem
              $token={token}
              actions={[
                <Button
                  type='text'
                  icon={<EditOutlined />}
                  ghost={true}
                  onClick={() => openEditModal(item)}
                />,
                <Popconfirm
                  title='Are you sure you want to delete this prompt?'
                  onConfirm={() => handleDelete(item.id)}
                  okText='Yes'
                  cancelText='No'
                >
                  <Button
                    type={'text'}
                    danger={true}
                    icon={<DeleteOutlined />}
                  />
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
                  <Popover
                    placement={'left'}
                    content={
                      item.description.length > 0 && (
                        <Typography.Text>{item.description}</Typography.Text>
                      )
                    }
                  >
                    <Typography.Text>{item.name}</Typography.Text>
                  </Popover>
                </div>
                {showFilter && (
                  <PromptTags
                    id={item.id}
                    tags={item.tags}
                    tagColors={tagColors}
                    allTags={allTags}
                    onTagsChange={onTagsChange}
                    onTagEdit={changeTag}
                  />
                )}
              </Space>
            </StyledListItem>
          )}
        />
      </StyledDrawer>
      {editPrompt && (
        <EditPromptForm
          open={isEditPromptFormOpen}
          prompt={editPrompt}
          onClose={() => setIsEditPromptFormOpen(false)}
          onSave={saveEditedPrompt}
        />
      )}
    </>
  );
};
