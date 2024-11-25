import React from 'react';
import { Button, Modal, Typography } from 'antd';

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
      <p>CodeBERT 0.4.2:</p>
      <ul>
        <li>Fixed rollback for writeToFile tool call</li>
        <li>Add a instruction format for the user feedback</li>
      </ul>
      <p>CodeBERT 0.4.0:</p>
      <ul>
        <li>
          Improved code completion suggestions with support hole-filler models
          for Ollama, check the{' '}
          <Typography.Text code>Code Completion</Typography.Text> setting in the
          setting menu and configure it in the{' '}
          <Typography.Text code>Auto Trigger Configuration</Typography.Text>
        </li>
        <li>
          Added support for OpenRouter as a new service provider, and a browse
          model for quick finding the right model, check the{' '}
          <Typography.Text code>Model Service</Typography.Text> selection in the
          top of the chat view
        </li>
        <li>
          Added a quick tour for new users, this can be start from the setting
          menu. You can restart the tour anytime by clicking the
          <Typography.Text code>Quick Start Guide</Typography.Text> in the
          setting menu
        </li>
        <li>
          Added support for Agents Tool which allow language model to control
          the IDE, this can be toggle from the magic wand icon float button at
          the right bottom corner
        </li>
        <li>
          Add a sync button to sync the code changes between the IDE and the
          conversation history. This can be found in the right bottom corner
          with a sync icon
        </li>
        <li>
          Improved UI design for the tool call interface, which allow user to
          approve or reject or even feedback to the model
        </li>
      </ul>
    </Modal>
  );
};
