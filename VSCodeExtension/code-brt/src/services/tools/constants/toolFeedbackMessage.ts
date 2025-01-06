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
    'Suggestion Received: The user has provided feedback requiring adjustments to the task execution. \n' +
    'Action Required: Review the feedback, update the process, and rework the task.\n\n' +
    'Feedback Details:\n',
  default:
    '[Execution Rejected with Feedback] \n' +
    'Reason: The tool call was not executed due to user feedback.\n' +
    'Action Required: Analyze the feedback carefully and revise the approach accordingly.\n\n' +
    'Feedback Details:\n',
};
