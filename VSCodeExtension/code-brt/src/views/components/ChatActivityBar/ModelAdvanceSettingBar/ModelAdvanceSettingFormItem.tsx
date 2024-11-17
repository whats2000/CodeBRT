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
  return (
    <Form.Item
      label={
        <Space>
          <span>
            {settingName.charAt(0).toUpperCase() +
              settingName.slice(1).replace(/([A-Z])/g, ' $1')}
          </span>
          <Tooltip title='Click to show more information'>
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
          value={(value as string) || ''}
          onChange={(e) => handleInputChange(settingName, e.target.value)}
          placeholder='Enter system prompt'
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
              placeholder='Enter stop sequence separated by new line'
              autoSize={{ minRows: 2, maxRows: 10 }}
            />
          </Col>
          <Col>
            <Tooltip title='Clear field' placement={'right'}>
              <Button
                type='text'
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
              placeholder={`Enter ${settingName}`}
              changeOnWheel={true}
            />
          </Col>
          <Col>
            <Tooltip title='Clear field' placement={'right'}>
              <Button
                type='text'
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
