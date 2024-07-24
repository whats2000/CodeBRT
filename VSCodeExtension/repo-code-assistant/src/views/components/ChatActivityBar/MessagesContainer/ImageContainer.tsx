import React, { useContext, useEffect, useState } from 'react';
import { Card, Flex, Image as ImageComponent, Typography } from 'antd';
import { WarningOutlined } from '@ant-design/icons';

import type { ConversationEntry } from '../../../../types';
import { WebviewContext } from '../../../WebviewContext';

type ImageContainerProps = {
  entry: ConversationEntry;
};

export const ImageContainer: React.FC<ImageContainerProps> = ({ entry }) => {
  const { callApi } = useContext(WebviewContext);

  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadImageUrls = async () => {
      const urls: Record<string, string> = {};
      if (!entry.images) return;

      for (const image of entry.images) {
        try {
          urls[image] = (await callApi('getWebviewUri', image)) as string;
        } catch (error) {
          urls[image] = '';
        }
      }
      setImageUrls(urls);
    };

    loadImageUrls().then();
  }, [entry.images, callApi]);

  return (
    <ImageComponent.PreviewGroup>
      <Flex wrap={true}>
        {entry.images &&
          entry.images.map((image, index) => (
            <Card
              size={'small'}
              style={{
                width: '45%',
                margin: '2.5%',
                display: 'flex',
                alignItems: 'center',
              }}
              key={`${image}-${index}`}
            >
              {imageUrls[image] !== '' ? (
                <ImageComponent
                  src={imageUrls[image] || image}
                  alt='Referenced Image'
                />
              ) : (
                <Card.Meta
                  description={
                    <Typography.Text type={'warning'}>
                      <WarningOutlined /> Referenced image not found, might have
                      been deleted.
                    </Typography.Text>
                  }
                />
              )}
            </Card>
          ))}
      </Flex>
    </ImageComponent.PreviewGroup>
  );
};
