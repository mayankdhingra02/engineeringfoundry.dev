import { DistributedCachingLessonContent, RedisCachingLessonContent } from "./caching/distributed";
import { CacheEvictionLessonContent, CachePlacementLessonContent, CacheTtlLessonContent, WhyCachingLessonContent } from "./caching/fundamentals";
import { CacheFailureModesLessonContent, CachePenetrationLessonContent, CacheStampedesLessonContent, CacheWarmingLessonContent, HotKeysLessonContent } from "./caching/pressure";
import { CacheAsideLessonContent, CacheInvalidationLessonContent, ReadThroughLessonContent, WriteBehindLessonContent, WriteThroughLessonContent } from "./caching/strategies";

export const cachingLessonIds = new Set([
  "caching", "cache-placement", "cache-aside", "read-through", "write-through", "write-behind", "cache-ttl", "cache-eviction", "cache-invalidation", "cache-stampedes", "hot-keys", "cache-penetration", "cache-warming", "distributed-caching", "cache-failure-modes", "redis-caching",
]);

export function CachingLessonContent({ lessonId }: { lessonId: string }) {
  switch (lessonId) {
    case "caching": return <WhyCachingLessonContent />;
    case "cache-placement": return <CachePlacementLessonContent />;
    case "cache-aside": return <CacheAsideLessonContent />;
    case "read-through": return <ReadThroughLessonContent />;
    case "write-through": return <WriteThroughLessonContent />;
    case "write-behind": return <WriteBehindLessonContent />;
    case "cache-ttl": return <CacheTtlLessonContent />;
    case "cache-eviction": return <CacheEvictionLessonContent />;
    case "cache-invalidation": return <CacheInvalidationLessonContent />;
    case "cache-stampedes": return <CacheStampedesLessonContent />;
    case "hot-keys": return <HotKeysLessonContent />;
    case "cache-penetration": return <CachePenetrationLessonContent />;
    case "cache-warming": return <CacheWarmingLessonContent />;
    case "distributed-caching": return <DistributedCachingLessonContent />;
    case "cache-failure-modes": return <CacheFailureModesLessonContent />;
    case "redis-caching": return <RedisCachingLessonContent />;
    default: return null;
  }
}
