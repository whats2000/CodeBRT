export const DIRS_TO_IGNORE = [
  'node_modules',
  '__pycache__',
  'env',
  'venv',
  'target/dependency',
  'build/dependencies',
  'dist',
  'out',
  'bundle',
  'vendor',
  'tmp',
  'temp',
  'deps',
  'pkg',
  'Pods',
  '.*', // Exclude hidden directories
].map((dir) => `**/${dir}/**`);
