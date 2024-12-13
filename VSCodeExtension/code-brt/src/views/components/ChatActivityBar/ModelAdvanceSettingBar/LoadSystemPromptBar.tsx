import React, { useState, useEffect, useRef } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type {
  ConversationModelAdvanceSettings,
  SystemPrompt,
  Tag as TagType,
} from '../../../../types';
import type { AppDispatch, RootState } from 'src/views/redux';
import { PromptTags } from './LoadSystemPromptModal/PromptTags';
import { EditPromptForm } from './LoadSystemPromptModal/EditPromptForm';
import { updateAndSaveSetting } from '../../../redux/slices/settingsSlice';

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
  const { t } = useTranslation('common');
  const { token } = theme.useToken();

  const [showFilter, setShowFilter] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterName, setFilterName] = useState<string>(''); // State for name filter
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<SystemPrompt[]>([]);
  const [isEditPromptFormOpen, setIsEditPromptFormOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState<SystemPrompt | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { settings, isLoading } = useSelector(
    (state: RootState) => state.settings,
  );

  // Centralized tag colors mapping
  const tagColors = useRef<{ [key: string]: string }>({});

  useEffect(() => {
    if (open) {
      const promptsWithTags = settings.systemPrompts.map(
        (prompt: SystemPrompt) => ({
          ...prompt,
          tags: Array.isArray(prompt.tags) ? prompt.tags : [],
        }),
      );

      // Initialize tagColors ref with existing tags
      promptsWithTags.forEach((prompt: SystemPrompt) => {
        prompt.tags.forEach((tag) => {
          if (!tagColors.current[tag.name]) {
            tagColors.current[tag.name] = tag.color;
          }
        });
      });

      setSystemPrompts(promptsWithTags);
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

    dispatch(
      updateAndSaveSetting({ key: 'systemPrompts', value: updatedPrompts }),
    );
  };

  const handleDrawerClose = () => {
    if (isLoading) {
      onClose();
      return;
    }

    dispatch(
      updateAndSaveSetting({ key: 'systemPrompts', value: systemPrompts }),
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
            <Typography.Text>{t('loadSystemPromptBar.title')}</Typography.Text>
            <Tooltip
              title={showFilter ? t('hideFilter') : t('showFilter')}
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
              placeholder={t('searchByName')}
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
              placeholder={t('filterByTags')}
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
                  title={t('loadSystemPromptBar.confirmDelete')}
                  onConfirm={() => handleDelete(item.id)}
                  okText={t('yes')}
                  cancelText={t('no')}
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
