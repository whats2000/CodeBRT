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
      <p>CodeBRT 0.4.7:</p>
      <ul>
        <li>
          Now CodeBRT will support two new language localizations: Traditional
          Chinese and Simplified Chinese
        </li>
      </ul>
      <p>CodeBRT 0.4.6:</p>
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
        <li>
          Fix the Gemini response string may contain `\"` and "\r\n" that will
          break the code when write to file
        </li>
      </ul>
      <p>CodeBRT 0.4.4:</p>
      <ul>
        <li>Add more languages for code completion</li>
        <li>Fix the update note name</li>
      </ul>
    </Modal>
  );
};
