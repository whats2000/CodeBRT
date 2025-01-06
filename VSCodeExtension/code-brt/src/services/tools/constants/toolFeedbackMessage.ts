export const TOOL_FEEDBACK_MESSAGE: {
  [key in 'askFollowUpQuestion' | 'attemptCompletion' | 'default']: string;
} = {
  askFollowUpQuestion:
    '[User Feedback Received] \n' +
    'The user has provided feedback for this task. \n' +
    'Action Required: Carefully review the feedback and make appropriate adjustments.\n\n' +
    'Feedback Details:\n',
  attemptCompletion:
    '[Task Adjustment Needed] \n' +
    'Status: The task was marked as complete, but the user provided feedback requiring adjustments. \n' +
    'Action Required: \n' +
    '- Review the feedback carefully.\n' +
    '- Analyze any gaps or issues based on user comments.\n' +
    '- Update the process and rework the task as necessary.\n' +
    '- Provide a follow-up confirmation after adjustments.\n\n' +
    'Feedback Details:\n',
  default:
    '[Execution Rejected with Feedback] \n' +
    'Reason: The tool call was not executed due to user feedback.\n' +
    'Action Required: Analyze the feedback carefully and revise the approach accordingly.\n\n' +
    'Feedback Details:\n',
};
