import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Divider, GlobalToken, Select, Tooltip } from 'antd';
import { Drawer, List, Typography, Button, theme, Flex } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { differenceInDays, isBefore, isToday, isYesterday } from 'date-fns';
import { useTranslation } from 'react-i18next';

import type { ConversationHistoryIndexList } from '../../../../types';
import type { AppDispatch, RootState } from '../../../redux';
import { WebviewContext } from '../../../WebviewContext';
import { switchHistory } from '../../../redux/slices/conversationSlice';
import { HistoryListItem } from './HistorySidebar/HistoryListItem';
import {
  fetchAndSortConversationIndex,
  setFilterTags,
  updateHistoryTitle,
} from '../../../redux/slices/conversationIndexSlice';

const StyledDrawer = styled(Drawer)`
  & .ant-drawer-header {
    padding: 10px;
  }

  ${({ loading }) =>
    !loading &&
    `
      & .ant-drawer-body {
        padding: 0;
      }
    `}
`;

const StyledList = styled(List)<{ $token: GlobalToken }>`
  background-color: ${({ $token }) => $token.colorBgContainer};
  padding: 1px 0;
`;

const NoHistoryMessageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

type HistorySidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const HistorySidebar = React.memo<HistorySidebarProps>(
  ({ isOpen, onClose }) => {
    const { callApi } = useContext(WebviewContext);
    const { t } = useTranslation('common');

    const dispatch = useDispatch<AppDispatch>();
    const conversationHistory = useSelector(
      (state: RootState) => state.conversation,
    );
    const activeModelService = useSelector(
      (state: RootState) => state.modelService.activeModelService,
    );
    const { historyIndexes, isLoading, filterTags, allTags } = useSelector(
      (state: RootState) => state.conversationIndex,
    );

    const [editingHistoryID, setEditingHistoryID] = useState<string | null>(
      null,
    );
    const [titleInput, setTitleInput] = useState('');
    const [showFilter, setShowFilter] = useState(false);

    const { token } = theme.useToken();

    useEffect(() => {
      if (isOpen) {
        if (activeModelService === 'loading...') {
          return;
        }

        dispatch(fetchAndSortConversationIndex());
      }
    }, [isOpen, activeModelService]);

    const handleSwitchHistory = (historyID: string) => {
      if (editingHistoryID || conversationHistory.root === historyID) {
        return;
      }

      dispatch(switchHistory(historyID));
      onClose();
    };

    const handleTitleDoubleClick = (historyID: string, title: string) => {
      setEditingHistoryID(historyID);
      setTitleInput(title);
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setTitleInput(e.target.value);
    };

    const handleTitleBlur = (historyID: string) => {
      if (activeModelService === 'loading...') {
        return;
      }

      callApi('updateHistoryTitleById', historyID, titleInput)
        .then(() => {
          dispatch(updateHistoryTitle({ historyID, title: titleInput }));
        })
        .catch((error) =>
          callApi(
            'alertMessage',
            `Failed to update title: ${error}`,
            'error',
          ).catch(console.error),
        );
      setEditingHistoryID(null);
    };

    const getFilteredHistoriesIds = (
      histories: ConversationHistoryIndexList,
    ) => {
      if (!showFilter) {
        return Object.keys(histories);
      }

      return Object.keys(histories).filter((historyID) =>
        filterTags.length > 0
          ? histories[historyID].tags?.some
            ? histories[historyID].tags.some((tag) => filterTags.includes(tag))
            : false
          : true,
      );
    };

    const renderHistoryListItem = (historyID: string, dividerText?: string) => {
      return (
        <>
          {dividerText && (
            <Divider plain style={{ margin: '8px 0' }}>
              {dividerText}
            </Divider>
          )}
          <HistoryListItem
            historyID={historyID}
            switchHistory={handleSwitchHistory}
            editingHistoryID={editingHistoryID}
            titleInput={titleInput}
            handleTitleChange={handleTitleChange}
            handleTitleBlur={handleTitleBlur}
            handleTitleDoubleClick={handleTitleDoubleClick}
            showTags={showFilter}
          />
        </>
      );
    };

    const renderWithDividers = (historyID: string, index: number) => {
      const historyIDs = getFilteredHistoriesIds(historyIndexes);
      const historyUpdateTime = new Date(historyIndexes[historyID].update_time);
      const prevHistoryUpdateTime =
        index > 0
          ? new Date(historyIndexes[historyIDs[index - 1]]?.update_time)
          : null;
      const now = new Date(); // Current date

      let dividerText = '';

      // Determine the divider text
      if (
        index === 0 ||
        !prevHistoryUpdateTime ||
        !isSameTimePeriod(historyUpdateTime, prevHistoryUpdateTime, now)
      ) {
        dividerText = getTimePeriod(historyUpdateTime, now);
      }

      return renderHistoryListItem(historyID, dividerText);
    };

    // Helper function to get the time period for a date
    const getTimePeriod = (date: Date, now: Date): string => {
      if (isToday(date) || isBefore(now, date)) {
        return t('historySidebar.today');
      } else if (isYesterday(date)) {
        return t('historySidebar.yesterday');
      } else {
        const daysDifference = differenceInDays(now, date);
        if (daysDifference <= 7) {
          return t('historySidebar.last7Days');
        } else if (daysDifference <= 30) {
          return t('historySidebar.last1Month');
        } else {
          return t('HistorySidebar.earlier');
        }
      }
    };

    const isSameTimePeriod = (date1: Date, date2: Date, now: Date): boolean => {
      return getTimePeriod(date1, now) === getTimePeriod(date2, now);
    };

    return (
      <StyledDrawer
        title={
          <Flex justify={'space-between'} align={'center'}>
            <Typography.Text>
              {t('historySidebar.chatHistoryTitle')}
            </Typography.Text>
            <Tooltip
              title={showFilter ? t('hideFilter') : t('showFilter')}
              placement={'right'}
            >
              <Button
                type={showFilter ? 'primary' : 'default'}
                icon={<FilterOutlined />}
                onClick={() => setShowFilter((prev) => !prev)}
              />
            </Tooltip>
          </Flex>
        }
        open={isOpen}
        onClose={onClose}
        placement='left'
        loading={isLoading || conversationHistory.isLoading || !isOpen}
      >
        {Object.keys(historyIndexes).length === 0 ? (
          <NoHistoryMessageContainer>
            <Typography.Text>
              {t('historySidebar.nothingCurrently')}
            </Typography.Text>
          </NoHistoryMessageContainer>
        ) : (
          <>
            {showFilter && (
              <div style={{ padding: 16 }}>
                <Select
                  showSearch={true}
                  mode={'tags'}
                  style={{ width: '100%' }}
                  value={filterTags}
                  options={allTags
                    .filter((tag) => !filterTags.includes(tag))
                    .map((item) => ({
                      value: item,
                      label: item,
                    }))}
                  placeholder={t('filterByTags')}
                  onChange={(newTags) => dispatch(setFilterTags(newTags))}
                />
              </div>
            )}
            <StyledList
              $token={token}
              split={false}
              dataSource={getFilteredHistoriesIds(historyIndexes)}
              renderItem={
                renderWithDividers as <T>(
                  item: T,
                  index: number,
                ) => React.ReactNode
              }
            />
          </>
        )}
      </StyledDrawer>
    );
  },
);
