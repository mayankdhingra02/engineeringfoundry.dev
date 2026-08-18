import type { FurtherReadingItem } from "@/components/system-design-article";

const elasticShards = { title: "Clusters, nodes, and shards", publisher: "Elastic Documentation", url: "https://www.elastic.co/docs/deploy-manage/distributed-architecture/clusters-nodes-shards" };
const openSearchShards = { title: "Search shards API", publisher: "OpenSearch Documentation", url: "https://docs.opensearch.org/latest/api-reference/search-apis/search-shards/" };
const redisSorted = { title: "Redis sorted sets", publisher: "Redis Documentation", url: "https://redis.io/docs/latest/develop/data-types/sorted-sets/" };
const redisProb = { title: "Probabilistic data types", publisher: "Redis Documentation", url: "https://redis.io/docs/latest/develop/data-types/" };
const redisBloom = { title: "Bloom filter", publisher: "Redis Documentation", url: "https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/" };
const robots = { title: "Robots Exclusion Protocol", publisher: "IETF RFC 9309", url: "https://www.rfc-editor.org/rfc/rfc9309" };
const crdtPaper = { title: "A comprehensive study of convergent and commutative replicated data types", publisher: "INRIA", url: "https://dsf.berkeley.edu/cs286/papers/crdt-tr2011.pdf" };
const vectorDocs = { title: "Vector Search overview", publisher: "Google Cloud Documentation", url: "https://cloud.google.com/vertex-ai/docs/vector-search/overview" };
const kserve = { title: "KServe model serving architecture", publisher: "KServe Documentation", url: "https://kserve.github.io/website/" };
const feast = { title: "Feature store introduction", publisher: "Feast Documentation", url: "https://docs.feast.dev/master" };

export const specializedSources: Record<string, readonly FurtherReadingItem[]> = {
  "full-text-search": [elasticShards], "inverted-indexes": [elasticShards], "search-engine-concepts": [elasticShards, openSearchShards], "search-autocomplete": [elasticShards], "tries-prefix-search": [elasticShards],
  "geospatial-search": [elasticShards], geohashing: [elasticShards], quadtrees: [elasticShards],
  "notification-delivery": [redisProb], "job-schedulers": [redisProb], leaderboards: [redisSorted], "distributed-counters": [redisProb], "web-crawling": [robots, redisBloom], "media-processing": [redisProb],
  "bloom-filters": [redisBloom], hyperloglog: [redisProb], "count-min-sketch": [redisProb],
  "collaborative-editing": [crdtPaper], "operational-transformation": [crdtPaper], crdts: [crdtPaper],
  "vector-search": [vectorDocs], "embeddings-infrastructure": [vectorDocs], "model-serving": [kserve], "feature-stores": [feast], "choosing-specialized-blocks": [elasticShards, redisProb, vectorDocs],
};
