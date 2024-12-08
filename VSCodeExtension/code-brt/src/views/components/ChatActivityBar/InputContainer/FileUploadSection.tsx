import React, { useContext, useEffect, useState } from 'react';
import { Image, Upload } from 'antd';
import type { UploadFile } from 'antd/lib/upload/interface';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../redux';
import { deleteFile } from '../../../redux/slices/fileUploadSlice';
import { WebviewContext } from '../../../WebviewContext';

const UploadedImageContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const StyledUpload = styled(Upload)`
  div.ant-upload-list-item-container {
    margin-bottom: 10px;
  }
`;

type FileUploadSectionProps = {};

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({}) => {
  const { callApi } = useContext(WebviewContext);
  const [previewImage, setPreviewImage] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const dispatch = useDispatch<AppDispatch>();
  const conversationHistory = useSelector(
    (state: RootState) => state.conversation,
  );
  const { uploadedFiles } = useSelector((state: RootState) => state.fileUpload);

  useEffect(() => {
    // Note: The link will break in vscode webview, so we need to remove the href attribute to prevent it.
    const links = document.querySelectorAll<HTMLLinkElement>('a');
    links.forEach((link) => {
      link.href = '';
    });
  }, [fileList]);

  useEffect(() => {
    const updateImageUris = async () => {
      const urls = await Promise.all(
        uploadedFiles.map(async (filePath) => {
          const uri = await callApi('getWebviewUri', filePath);
          return uri as string;
        }),
      );

      setFileList(
        urls.map((url, index) => ({
          uid: index.toString(),
          name: uploadedFiles[index].split('\\').pop() as string,
          status: 'done',
          url,
        })),
      );
    };
    updateImageUris().catch((error) => console.error(error));
  }, [uploadedFiles, callApi]);

  const handlePreview = async (file: UploadFile) => {
    if (
      !file.url
        ?.split('.')
        .pop()
        ?.match(/(png|jpe?g|gif|webp)/i)
    ) {
      return;
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const handleRemove = (file: UploadFile) => {
    const index = fileList.indexOf(file);
    const newFileList = [...fileList];
    newFileList.splice(index, 1);
    dispatch(deleteFile(uploadedFiles[index]));
    setFileList(newFileList);
  };

  return (
    <>
      {previewImage && (
        <Image
          wrapperStyle={{ display: 'none' }}
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            afterOpenChange: (visible) => !visible && setPreviewImage(''),
          }}
          src={previewImage}
        />
      )}
      <UploadedImageContainer>
        <StyledUpload
          fileList={conversationHistory.isProcessing ? [] : fileList}
          listType='picture-card'
          onRemove={handleRemove}
          onPreview={handlePreview}
          supportServerRender={false}
        />
      </UploadedImageContainer>
    </>
  );
};
