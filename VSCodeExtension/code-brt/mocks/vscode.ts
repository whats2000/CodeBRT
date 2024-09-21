module.exports = {
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
  },
  workspace: {
    workspaceFolders: [
      {
        uri: {
          fsPath: 'tests/testsWorkspace',
        },
      },
    ],
  },
};
