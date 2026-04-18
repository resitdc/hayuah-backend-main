import { LRUCache } from "lru-cache";

export const revokedJtiCache = new LRUCache<string, boolean>({
  max: 10000,
  ttl: 1000 * 60 * 15
});
