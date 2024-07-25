import type { ConversationEntry } from '../types';

export const traverseHistory = (
  entries: { [key: string]: ConversationEntry },
  current: string,
): ConversationEntry[] => {
  const entryStack = [];
  let currentEntry = entries[current];

  while (currentEntry) {
    entryStack.push(currentEntry);
    if (currentEntry.parent) {
      currentEntry = entries[currentEntry.parent];
    } else {
      break;
    }
  }

  return entryStack.reverse();
};
