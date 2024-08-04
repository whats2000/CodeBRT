const packageJson = require('../package.json');
const path = require('path');
const vsce = require('@vscode/vsce');
const childProcess = require('child_process');
const hash = childProcess
  .execSync('git rev-parse --short HEAD')
  .toString()
  .trim();
const isTag =
  childProcess.execSync('git tag --points-at HEAD').toString().trim() !== '';

const name = packageJson.name;
const version = isTag ? packageJson.version : `${packageJson.version}+${hash}`;

vsce
  .createVSIX({
    cwd: path.resolve(process.cwd(), 'dist'),
    packagePath: path.resolve(
      process.cwd(),
      'build',
      `${name}-${version}.vsix`,
    ),
    preRelease: false,
    baseContentUrl: 'https://none',
    baseImagesUrl: 'https://none',
    allowMissingRepository: true,
  })
  .then();
