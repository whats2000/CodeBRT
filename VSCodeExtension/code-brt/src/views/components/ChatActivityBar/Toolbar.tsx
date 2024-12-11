import React, { useContext, useEffect, useState } from 'react';
import { Flex, MenuProps, SelectProps, Tooltip } from 'antd';
import { Select, Button, Space, Dropdown, Drawer } from 'antd';
import {
  PlusOutlined,
  HistoryOutlined,
  SettingOutlined,
  MenuOutlined,
  AudioOutlined,
  PicRightOutlined,
  RocketOutlined,
  BellOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import packageJson from '../../../../package.json';
import { ExtensionSettings, ModelServiceType } from '../../../types';
import type { AppDispatch, RootState } from '../../redux';
import { setConversationHistory } from '../../redux/slices/conversationSlice';
import {
  loadModelService,
  swapModel,
} from '../../redux/slices/modelServiceSlice';
import { WebviewContext } from '../../WebviewContext';
import { useRefs } from '../../context/RefContext';
import { EditModelListBar } from './Toolbar/EditModelListBar';
import { HistorySidebar } from './Toolbar/HistorySidebar';
import { SettingsBar } from './Toolbar/SettingsBar';
import { VoiceSettingsBar } from './Toolbar/VoiceSettingsBar';
import { WhatsNewModal } from './Toolbar/WhatsNewModal';
import { CodeCompletionSettingsBar } from './Toolbar/CodeCompletionSettingsBar';
import { useWindowSize } from '../../hooks';
import { AVAILABLE_MODEL_SERVICES } from '../../../constants';
import { setRefId, startTour } from '../../redux/slices/tourSlice';
import { updateAndSaveSetting } from '../../redux/slices/settingsSlice';

const StyledSpace = styled(Space)`
  display: flex;
  justify-content: space-between;
  padding: 10px 15px 10px 10px;
`;

const EditModelListButton = styled(Button)`
  display: flex;
  align-items: center;
`;

type ToolbarProps = {
  setTheme: (newTheme: {
    primaryColor?: ExtensionSettings['themePrimaryColor'];
    algorithm?: ExtensionSettings['themeAlgorithm'];
    borderRadius?: ExtensionSettings['themeBorderRadius'];
  }) => Promise<void>;
};

export const Toolbar: React.FC<ToolbarProps> = ({ setTheme }) => {
  const { t, i18n } = useTranslation('common');
  const { callApi } = useContext(WebviewContext);
  const { registerRef } = useRefs();

  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [isCodeCompletionSettingsOpen, setIsCodeCompletionSettingsOpen] =
    useState(false);
  const [isSelectModelOpen, setIsSelectModelOpen] = useState(false);
  const [isEditModelListOpen, setIsEditModelListOpen] = useState(false);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { activeModelService, availableModels, selectedModel, isLoading } =
    useSelector((state: RootState) => state.modelService);

  const { innerWidth } = useWindowSize();

  const modelServiceSelectRef = registerRef('modelServiceSelect');
  const modelSelectRef = registerRef('modelSelect');
  const settingsButtonRef = registerRef('settingsButton');

  useEffect(() => {
    dispatch(
      setRefId({
        tourName: 'quickStart',
        stepIndex: 7,
        targetId: 'modelServiceSelect',
      }),
    );
    dispatch(
      setRefId({
        tourName: 'quickStart',
        stepIndex: 8,
        targetId: 'modelSelect',
      }),
    );
    dispatch(
      setRefId({
        tourName: 'quickStart',
        stepIndex: 9,
        targetId: 'settingsButton',
      }),
    );
  }, []);

  useEffect(() => {
    // Check the local storage for the version update
    const storedVersion = localStorage.getItem('code-brt.version');
    const currentVersion = packageJson.version;

    // If no version is stored, this is likely a new user
    // We don't want to show update notes to a new user
    if (storedVersion && storedVersion !== currentVersion) {
      setIsWhatsNewOpen(true);
    }

    // Always update the version in local storage
    localStorage.setItem('code-brt.version', currentVersion);
  }, []);

  useEffect(() => {
    if (activeModelService === 'loading...' || isLoading) {
      return;
    }

    dispatch(loadModelService(activeModelService));
  }, [activeModelService]);

  const createNewChat = () => {
    if (activeModelService === 'loading...') {
      return;
    }
    callApi('addNewConversationHistory')
      .then(async (newConversationHistory) =>
        dispatch(setConversationHistory(await newConversationHistory)),
      )
      .catch((error) =>
        console.error('Failed to clear conversation history:', error),
      );
  };

  const handleModelServiceChange = (value: ModelServiceType | 'loading...') => {
    if (value === 'loading...' || value === activeModelService || isLoading) {
      return;
    }
    dispatch(loadModelService(value));
  };

  const handleModelChange = (value: string) => {
    dispatch(swapModel(value));
  };

  const toggleHistorySidebar = () => {
    setIsHistorySidebarOpen(!isHistorySidebarOpen);
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
    }
  };

  const openEditModelList = () => {
    setIsEditModelListOpen(true);
  };

  const saveAndSwapLanguage = (language: 'en-US' | 'zh-TW' | 'zh-CN') => {
    i18n.changeLanguage(language);
    dispatch(updateAndSaveSetting({ key: 'language', value: language }));
  };

  const settingMenuItems: MenuProps['items'] = [
    {
      key: 'general',
      onClick: () => setIsSettingsOpen(true),
      label: t('toolBar.generalSettings'),
      icon: <SettingOutlined />,
    },
    {
      key: 'voice',
      onClick: () => setIsVoiceSettingsOpen(true),
      label: t('toolBar.voiceSettings'),
      icon: <AudioOutlined />,
    },
    {
      key: 'code completion',
      onClick: () => setIsCodeCompletionSettingsOpen(true),
      label: t('toolBar.codeCompletionSettings'),
      icon: <PicRightOutlined />,
    },
    {
      key: 'quick guide',
      onClick: () => dispatch(startTour({ tourName: 'quickStart' })),
      label: t('toolBar.quickGuide'),
      icon: <RocketOutlined />,
    },
    {
      key: `what's new`,
      onClick: () => setIsWhatsNewOpen(true),
      label: t('toolBar.whatsNew'),
      icon: <BellOutlined />,
    },
    {
      key: 'language',
      label: 'Language',
      icon: <GlobalOutlined />,
      children: [
        {
          key: 'en-US',
          onClick: () => saveAndSwapLanguage('en-US'),
          label: 'English',
        },
        {
          key: 'zh-TW',
          onClick: () => saveAndSwapLanguage('zh-TW'),
          label: '繁體中文',
        },
        {
          key: 'zh-CN',
          onClick: () => saveAndSwapLanguage('zh-CN'),
          label: '简体中文',
        },
      ],
    },
  ];

  const settingMenuItemsSmallWidth: MenuProps['items'] = [
    {
      key: 'History',
      onClick: toggleHistorySidebar,
      label: t('toolBar.history'),
      icon: <HistoryOutlined />,
    },
    {
      key: 'New Chat',
      onClick: createNewChat,
      label: t('toolBar.newChat'),
      icon: <PlusOutlined />,
    },
    ...settingMenuItems,
  ];

  const modelServiceOptions: SelectProps['options'] =
    AVAILABLE_MODEL_SERVICES.map((service) => ({
      key: service,
      label: service,
      value: service,
    }));

  const modelOptions: SelectProps['options'] = [
    ...availableModels.map((model, index) => ({
      key: `available-${index}`,
      label: model,
      value: model,
    })),
    {
      key: 'edit',
      label: (
        <EditModelListButton
          icon={<SettingOutlined />}
          onClick={openEditModelList}
          style={{ width: '100%' }}
        >
          Edit Model List
        </EditModelListButton>
      ),
      value: 'edit',
      disabled: true,
      style: { paddingLeft: 0, paddingRight: 0 },
    },
  ];

  return (
    <>
      <Drawer
        title={
          <Flex justify={'space-between'} align={'center'}>
            <span>Select Model</span>
            <Space>
              <Button
                icon={<HistoryOutlined />}
                onClick={toggleHistorySidebar}
              />
              <Button icon={<PlusOutlined />} onClick={createNewChat} />
              <Dropdown menu={{ items: settingMenuItems }}>
                <Button icon={<SettingOutlined />} />
              </Dropdown>
            </Space>
          </Flex>
        }
        placement='right'
        open={isSelectModelOpen}
        onClose={() => setIsSelectModelOpen(false)}
        loading={isLoading}
      >
        <Select
          value={isLoading ? 'Loading...' : selectedModel}
          onChange={handleModelChange}
          style={{ width: '100%' }}
          options={modelOptions}
        />
      </Drawer>
      <StyledSpace>
        <Space wrap>
          <div ref={modelServiceSelectRef}>
            <Select
              showSearch
              value={activeModelService}
              onChange={handleModelServiceChange}
              style={{
                width: innerWidth >= 550 ? 125 : innerWidth >= 320 ? 200 : 150,
              }}
              loading={isLoading}
              options={modelServiceOptions}
            />
          </div>
          <div ref={modelSelectRef}>
            <Select
              showSearch
              value={isLoading ? 'Loading...' : selectedModel}
              onChange={handleModelChange}
              style={{
                width:
                  innerWidth >= 550 ? '100%' : innerWidth >= 320 ? 200 : 150,
                minWidth: 150,
              }}
              loading={isLoading}
              options={modelOptions}
            />
          </div>
        </Space>
        {innerWidth < 400 ? (
          <Dropdown menu={{ items: settingMenuItemsSmallWidth }}>
            <Button ref={settingsButtonRef} icon={<MenuOutlined />} />
          </Dropdown>
        ) : (
          <Space>
            <Tooltip title={t('toolBar.history')}>
              <Button
                icon={<HistoryOutlined />}
                onClick={toggleHistorySidebar}
              />
            </Tooltip>
            <Tooltip title={t('toolBar.newChat')}>
              <Button icon={<PlusOutlined />} onClick={createNewChat} />
            </Tooltip>
            <Dropdown menu={{ items: settingMenuItems }}>
              <Button ref={settingsButtonRef} icon={<SettingOutlined />} />
            </Dropdown>
          </Space>
        )}
      </StyledSpace>
      <HistorySidebar
        isOpen={isHistorySidebarOpen}
        onClose={toggleHistorySidebar}
      />
      <SettingsBar
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        setTheme={setTheme}
      />
      <VoiceSettingsBar
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
      />
      <EditModelListBar
        isOpen={isEditModelListOpen}
        onClose={() => setIsEditModelListOpen(false)}
      />
      <CodeCompletionSettingsBar
        isOpen={isCodeCompletionSettingsOpen}
        onClose={() => setIsCodeCompletionSettingsOpen(false)}
      />
      <WhatsNewModal
        isOpen={isWhatsNewOpen}
        onClose={() => setIsWhatsNewOpen(false)}
      />
    </>
  );
};
