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
      <p>CodeBRT 0.4.5:</p>
      <ul>
        <li>Fixed can not save some settings when the workspace is not open</li>
        <li>
          Add a fuser when the write to file operation content contains omission
          comment or mark as partial code
        </li>
        <li>
          Add a right click menu to fast open the chat activity bar, toggle
          inline code completion
        </li>
        <li>Add a send to chat at menu when select text in editor</li>
      </ul>
      <p>CodeBRT 0.4.4:</p>
      <ul>
        <li>Add more languages for code completion</li>
        <li>Fix the update note name</li>
      </ul>
      <p>CodeBRT 0.4.3:</p>
      <ul>
        <li>Fixed save version for a file that is not exist in file system</li>
        <li>
          Fix swap model service while fetching the model list will save the
          wrong model list
        </li>
      </ul>
    </Modal>
  );
};
