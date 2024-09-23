// src/types/lru-cache.d.ts
declare module 'lru-cache' {
  interface LRUCacheOptions<K, V> {
    max?: number;
    ttl?: number;
    allowStale?: boolean;
  }

  class LRUCache<K, V> {
    constructor(options?: LRUCacheOptions<K, V>);
    get(key: K): V | undefined;
    set(key: K, value: V): void;
  }

  export = LRUCache;
}
