import type { FurtherReadingItem } from "@/components/system-design-article";

const awsCaching = { title: "Caching challenges and strategies", publisher: "Amazon Builders' Library", url: "https://aws.amazon.com/builders-library/caching-challenges-and-strategies/" };
const redisEviction = { title: "Key eviction", publisher: "Redis Documentation", url: "https://redis.io/docs/latest/develop/reference/eviction/" };
const redisExpire = { title: "EXPIRE command", publisher: "Redis Documentation", url: "https://redis.io/docs/latest/commands/expire/" };
const redisPersistence = { title: "Redis persistence", publisher: "Redis Documentation", url: "https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/" };
const redisReplication = { title: "Redis replication", publisher: "Redis Documentation", url: "https://redis.io/docs/latest/operate/oss_and_stack/management/replication/" };
const bloomFilter = { title: "Bloom filter", publisher: "Redis Documentation", url: "https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/" };
const httpCaching = { title: "RFC 9111: HTTP Caching", publisher: "IETF / RFC Editor", url: "https://www.rfc-editor.org/rfc/rfc9111.html" };

export const cachingSources: Record<string, readonly FurtherReadingItem[]> = {
  caching: [awsCaching, httpCaching],
  "cache-placement": [awsCaching, httpCaching],
  "cache-aside": [awsCaching],
  "read-through": [awsCaching],
  "write-through": [awsCaching],
  "write-behind": [awsCaching],
  "cache-ttl": [awsCaching, redisExpire],
  "cache-eviction": [awsCaching, redisEviction],
  "cache-invalidation": [awsCaching, httpCaching],
  "cache-stampedes": [awsCaching],
  "hot-keys": [awsCaching],
  "cache-penetration": [awsCaching, bloomFilter],
  "cache-warming": [awsCaching],
  "distributed-caching": [awsCaching, redisReplication],
  "cache-failure-modes": [awsCaching],
  "redis-caching": [redisEviction, redisExpire, redisPersistence, redisReplication],
};
