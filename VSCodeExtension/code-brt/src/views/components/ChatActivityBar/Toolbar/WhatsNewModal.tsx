import React from 'react';
import { Button, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import Resources from '../../../../locales/resource';

type WhatsNewModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation('updateNotes');
  const updateNotes: Resources['updateNotes']['notes'] = t('notes', {
    returnObjects: true,
  });
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={t('title')}
      footer={<Button onClick={onClose}>{t('common:close')}</Button>}
    >
      {updateNotes.map((note) => (
        <>
          <p>CodeBRT {note.version}:</p>
          <ul>
            {note.notes.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </>
      ))}
    </Modal>
  );
};
