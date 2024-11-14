// Mock globby
module.exports = {
  globby: jest
    .fn()
    .mockResolvedValue(['test/file1', 'test/file2', 'test/file3']),

  // Mock fs
  Options: {
    dot: true,
  },
};
