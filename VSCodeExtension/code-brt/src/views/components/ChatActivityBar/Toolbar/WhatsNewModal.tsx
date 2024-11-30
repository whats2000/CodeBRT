import React from 'react';
import { Button, Modal } from 'antd';

type WhatsNewModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title="What's New"
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <p>CodeBRT 0.4.4:</p>
      <ul>
        <li>Add more languages for code completion</li>
        <li>
          Fix the update note name
        </li>
      </ul>
      <p>CodeBRT 0.4.3:</p>
      <ul>
        <li>Fixed save version for a file that is not exist in file system</li>
        <li>
          Fix swap model service while fetching the model list will save the
          wrong model list
        </li>
      </ul>
      <p>CodeBRT 0.4.2:</p>
      <ul>
        <li>Fixed rollback for writeToFile tool call</li>
        <li>Add a instruction format for the user feedback</li>
      </ul>
    </Modal>
  );
};
