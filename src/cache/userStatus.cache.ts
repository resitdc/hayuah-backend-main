import { LRUCache } from "lru-cache";

export const userStatusCache = new LRUCache<string, boolean>({
  max: 10000,
  ttl: 1000 * 60 * 2
});