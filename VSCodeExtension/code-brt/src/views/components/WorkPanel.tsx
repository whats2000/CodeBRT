import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Button,
  ConfigProvider,
  Flex,
  Input,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';

import { useThemeConfig } from '../hooks';
import { WebviewContext } from '../WebviewContext';
import type { AppDispatch, RootState } from '../redux';
import { deleteFile, handleFilesUpload } from '../redux/slices/fileUploadSlice';

export const WorkPanel = () => {
  const [theme] = useThemeConfig();

  const { callApi } = useContext(WebviewContext);

  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const dispatch = useDispatch<AppDispatch>();

  const { uploadedFiles } = useSelector((state: RootState) => state.fileUpload);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (uploadedFiles.length > 0) {
        uploadedFiles.forEach((file) => {
          dispatch(deleteFile(file));
        });
      }
    };
  }, []);

  useEffect(() => {
    const fetchExtractedText = async () => {
      setExtractedText(await callApi('extractPdfText', uploadedFiles[0]));
    };

    if (uploadedFiles.length > 0) {
      setIsProcessing(true);
      fetchExtractedText()
        .catch(console.error)
        .finally(() => setIsProcessing(false));
    }
  }, [uploadedFiles, dispatch]);

  const handleUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach((file) => {
        dispatch(deleteFile(file));
      });
    }

    dispatch(handleFilesUpload(event.target.files));
    event.target.value = '';
  };

  const handleClearButtonClick = () => {
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach((file) => {
        dispatch(deleteFile(file));
      });

      setExtractedText('');
    }
  };

  return (
    <ConfigProvider theme={theme}>
      {isProcessing && <Spin spinning={isProcessing} fullscreen={true} />}
      <input
        type='file'
        accept='.pdf'
        ref={fileInputRef}
        onInput={handleFileChange}
        style={{ display: 'none' }}
      />
      <Space direction={'vertical'} size={16} style={{ width: '100%' }}>
        <Typography.Title level={4}>PDF Text Extractor</Typography.Title>
        <Typography.Text>
          This is an feature in development, it will extract text from the
          first, in expected feature it will send the text to the LLM for
          helping to follow pdf guild requirement. Currently it only will
          display the conversion.
        </Typography.Text>
        <Typography.Text>
          Please upload a PDF file to extract text from it.
        </Typography.Text>
        <Typography.Text type={'warning'}>
          Note: This feature is still in development and may not work as
          expected.
        </Typography.Text>
        <Flex gap={16} style={{ width: '100%' }}>
          <Input.TextArea
            autoSize={true}
            allowClear={true}
            value={extractedText}
            onClear={handleClearButtonClick}
            style={{ width: '100%' }}
          />
          <Space direction={'vertical'} size={8}>
            <Button
              icon={<UploadOutlined />}
              onClick={handleUploadButtonClick}
            />
            <Tag color={'blue'}>{uploadedFiles.length} files uploaded</Tag>
            <Tag color={'yellow'}>{extractedText.length} characters</Tag>
          </Space>
        </Flex>
      </Space>
    </ConfigProvider>
  );
};
