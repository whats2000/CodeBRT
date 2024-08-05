import * as fs from 'fs';
import * as path from 'path';

import { HistoryManager } from '../../src/api/historyManager';

const CLEAN_AFTER_ALL = true;

describe('HistoryManager', () => {
  const workspacePath = path.join(__dirname, '../../tests/testsWorkspace');
  const historiesPath = path.join(workspacePath, '.vscode/histories');

  afterAll(() => {
    if (!CLEAN_AFTER_ALL) {
      return;
    }

    // Clean up the histories folder
    if (fs.existsSync(historiesPath)) {
      const files = fs.readdirSync(historiesPath);
      for (const file of files) {
        const filePath = path.join(historiesPath, file);
        fs.unlinkSync(filePath);
      }
    }
    // Clean up the test workspace
    if (fs.existsSync(workspacePath)) {
      const files = fs.readdirSync(workspacePath);
      for (const file of files) {
        const filePath = path.join(workspacePath, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          fs.rmdirSync(filePath, { recursive: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
    }
  });

  const historyManager = new HistoryManager({
    extensionPath: '',
  } as any);

  test('should add a new conversation history', async () => {
    const newHistory = await historyManager.addNewConversationHistory();

    expect(newHistory).toBeDefined();
    expect(newHistory.root).toBeDefined();
    expect(historyManager.getHistories()[newHistory.root]).toBeDefined();

    const filePath = path.join(historiesPath, `${newHistory.root}.json`);

    console.log(filePath);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('should add a new conversation entry', async () => {
    const newHistory = await historyManager.addNewConversationHistory();
    const entryId = await historyManager.addConversationEntry(
      null,
      'user',
      'test message',
    );

    expect(entryId).toBeDefined();
    expect(
      historyManager.getHistoryBeforeEntry().entries[entryId],
    ).toBeDefined();

    const filePath = path.join(historiesPath, `${newHistory.root}.json`);

    const history = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(history.entries[entryId]).toBeDefined();
  });
});
