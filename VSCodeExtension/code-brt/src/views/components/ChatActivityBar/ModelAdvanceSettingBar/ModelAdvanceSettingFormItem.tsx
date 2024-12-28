import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import React from 'react';
import { ClearOutlined, QuestionCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import type { ConversationModelAdvanceSettings } from '../../../../types';
import { MODEL_ADVANCE_SETTINGS } from '../../../../constants';

type FormItemProps<K extends keyof ConversationModelAdvanceSettings> = {
  settingName: K;
  value: ConversationModelAdvanceSettings[K];
  handleMoreInfoToggle: (key: K) => void;
  handleInputChange: (
    key: K,
    value: ConversationModelAdvanceSettings[K] | null,
  ) => void;
  clearField: (key: K) => void;
};

export const ModelAdvanceSettingFormItem: React.FC<
  FormItemProps<keyof ConversationModelAdvanceSettings>
> = ({
  settingName,
  value,
  handleMoreInfoToggle,
  handleInputChange,
  clearField,
}) => {
  const { t, i18n } = useTranslation('common');
  return (
    <Form.Item
      label={
        <Space>
          <span>
            {t(`modelAdvanceSettingFormItem.${settingName}`)}{' '}
            {i18n.language !== 'en-US' &&
              `(${t(`modelAdvanceSettingFormItem.${settingName}`, {
                lng: 'en-US',
              })})`}
          </span>
          <Tooltip title={t('modelAdvanceSettingFormItem.clickToShowMoreInfo')}>
            <Typography.Link
              type={'secondary'}
              onClick={() => handleMoreInfoToggle(settingName)}
            >
              <QuestionCircleFilled />
            </Typography.Link>
          </Tooltip>
        </Space>
      }
      key={settingName}
      layout={'vertical'}
    >
      {settingName === 'systemPrompt' ? (
        <Input.TextArea
          allowClear={true}
          value={(value as string) || ''}
          onChange={(e) => handleInputChange(settingName, e.target.value)}
          placeholder={t('modelAdvanceSettingFormItem.enterSystemPrompt')}
          autoSize={{ minRows: 2, maxRows: 10 }}
        />
      ) : settingName === 'stop' ? (
        <Row gutter={8} align={'middle'}>
          <Col flex={'auto'}>
            <Input.TextArea
              value={(value as string[] | undefined)?.join('\n') || ''}
              onChange={(e) =>
                handleInputChange(settingName, e.target.value.split('\n'))
              }
              placeholder={t('modelAdvanceSettingFormItem.enterStopSequence')}
              autoSize={{ minRows: 2, maxRows: 10 }}
            />
          </Col>
          <Col>
            <Tooltip
              title={t('modelAdvanceSettingFormItem.clearField')}
              placement={'right'}
            >
              <Button
                type={'text'}
                danger
                icon={<ClearOutlined />}
                onClick={() => clearField(settingName)}
              />
            </Tooltip>
          </Col>
        </Row>
      ) : (
        <Row gutter={8} align={'middle'}>
          <Col flex={'auto'}>
            <InputNumber
              max={MODEL_ADVANCE_SETTINGS[settingName].range.max}
              min={MODEL_ADVANCE_SETTINGS[settingName].range.min}
              style={{ width: '100%' }}
              value={value as number | null}
              onChange={(val) => handleInputChange(settingName, val)}
              placeholder={t(`modelAdvanceSettingFormItem.${settingName}`)}
              changeOnWheel={true}
            />
          </Col>
          <Col>
            <Tooltip
              title={t('modelAdvanceSettingFormItem.clearField')}
              placement={'right'}
            >
              <Button
                type={'text'}
                danger
                icon={<ClearOutlined />}
                onClick={() => clearField(settingName)}
              />
            </Tooltip>
          </Col>
        </Row>
      )}
    </Form.Item>
  );
};
