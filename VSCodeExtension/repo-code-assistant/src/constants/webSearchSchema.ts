export const webSearchSchema = {
  name: 'webSearch',
  description: `Use this tool to fetch the latest information from the web, especially for time-sensitive or recent data.
          
          Guidelines:
          1. Ensure queries are well-defined. Example: 'Google AI recent developments 2024'.
          2. Utilize this tool for queries involving recent events or updates.
          3. Refuse only if the query is unclear or beyond the tool's scope. Suggest refinements if needed.
          4. Extract up to 6000 characters per webpage. Default to 4 results.
          
          Validate information before presenting and provide balanced views if there are discrepancies.`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'The query to search for. Ensure the query is specific and well-defined to get precise results.',
      },
      maxCharsPerPage: {
        type: 'number',
        description:
          'The maximum number of characters to extract from each webpage. Default is 6000. Adjust if a different limit is required.',
      },
      numResults: {
        type: 'number',
        description:
          'The number of results to return. Default is 4. Modify if more or fewer results are needed.',
      },
    },
    required: ['query'],
  },
};
