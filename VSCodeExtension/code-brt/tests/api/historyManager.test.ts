import * as fs from 'fs';
import * as path from 'path';

import { HistoryManager } from '../../src/api';

const CLEAN_AFTER_ALL = true;

describe('HistoryManager', () => {
  const workspacePath = path.join(__dirname, '../../tests/testsWorkspace');

  if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath);
  }

  const vscodePath = path.join(workspacePath, '.vscode');
  const historiesPath = path.join(vscodePath, 'histories');

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
    extensionPath: workspacePath,
  } as any);

  test('should add a new conversation history', async () => {
    const newHistory = await historyManager.addNewConversationHistory();

    expect(newHistory).toBeDefined();
    expect(newHistory.root).toBeDefined();

    // Before the first entry, the history should be empty
    expect(historyManager.getHistoryIndexes()[newHistory.root]).toBeUndefined();

    await historyManager.addConversationEntry(null, 'user', 'test message');

    // After the first entry, the history should be available
    expect(historyManager.getHistoryIndexes()[newHistory.root]).toBeDefined();

    const filePath = path.join(historiesPath, `${newHistory.root}.json`);

    console.log(filePath);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('should add a new conversation entry', async () => {
    const newHistory = await historyManager.addNewConversationHistory();
    const entryId = (
      await historyManager.addConversationEntry(null, 'user', 'test message')
    ).id;

    expect(entryId).toBeDefined();
    expect(
      historyManager.getHistoryBeforeEntry().entries[entryId],
    ).toBeDefined();

    const filePath = path.join(historiesPath, `${newHistory.root}.json`);

    const history = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(history.entries[entryId]).toBeDefined();
  });

  test('should edit a conversation entry', async () => {
    const newHistory = await historyManager.addNewConversationHistory();
    const entryId = (
      await historyManager.addConversationEntry(null, 'user', 'test message')
    ).id;

    await historyManager.editConversationEntry(entryId, 'updated message');

    const filePath = path.join(historiesPath, `${newHistory.root}.json`);
    const history = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(history.entries[entryId].message).toBe('updated message');
  });

  test('should update the title of a conversation history', async () => {
    const newHistory = await historyManager.addNewConversationHistory();
    await historyManager.addConversationEntry(null, 'user', 'test message');
    const newTitle = 'Updated Title';
    await historyManager.updateHistoryTitleById(newHistory.root, newTitle);

    expect(historyManager.getHistoryIndexes()[newHistory.root].title).toBe(
      newTitle,
    );

    const filePath = path.join(vscodePath, 'historyIndex.json');
    const historyIndex = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(historyIndex[newHistory.root].title).toBe(newTitle);
  });

  test('should switch to a different conversation history', async () => {
    const newHistory1 = await historyManager.addNewConversationHistory();
    await historyManager.addConversationEntry(null, 'user', 'test message');
    const newHistory2 = await historyManager.addNewConversationHistory();
    await historyManager.addConversationEntry(null, 'user', 'test message');

    await historyManager.switchHistory(newHistory2.root);
    expect(historyManager.getHistoryBeforeEntry().root).toBe(newHistory2.root);

    await historyManager.switchHistory(newHistory1.root);
    expect(historyManager.getHistoryBeforeEntry().root).toBe(newHistory1.root);
  });

  test('should delete a conversation history', async () => {
    const newHistory = await historyManager.addNewConversationHistory();
    const rootId = newHistory.root;

    const deletedHistory = await historyManager.deleteHistory(rootId);

    expect(deletedHistory).toBeDefined();

    expect(historyManager.getHistoryIndexes()[rootId]).toBeUndefined();

    const filePath = path.join(historiesPath, `${rootId}.json`);
    expect(fs.existsSync(filePath)).toBe(false);
  });
});
