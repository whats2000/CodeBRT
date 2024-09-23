//CacheManager.ts

import LRUCache from 'lru-cache';
import { AutocompleteContext, Position } from './types';
import { createHash } from 'crypto';

export class CacheManager {
  private cache: LRUCache<string, AutocompleteContext>;

  constructor(maxCacheSize: number, maxCacheAge: number) {
    this.cache = new LRUCache({
      max: maxCacheSize,
      ttl: maxCacheAge,
      allowStale: false,
    });
  }

  generateCacheKey(
    filepath: string,
    position: Position,
    contents: string,
  ): string {
    const contentHash = createHash('md5').update(contents).digest('hex');
    return `${filepath}:${position.line}:${position.character}:${contentHash}`;
  }

  get(key: string): AutocompleteContext | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: AutocompleteContext): void {
    this.cache.set(key, value);
  }
}
