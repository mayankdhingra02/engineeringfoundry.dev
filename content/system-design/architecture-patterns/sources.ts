import type { FurtherReadingItem } from "@/components/system-design-article";

const postgresReplication = { title: "PostgreSQL warm standby and replication", publisher: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/current/warm-standby.html" };
const postgresIsolation = { title: "PostgreSQL transaction isolation", publisher: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/current/transaction-iso.html" };
const postgresLocks = { title: "PostgreSQL explicit locking", publisher: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/current/explicit-locking.html" };
const awsCaching = { title: "Caching challenges and strategies", publisher: "Amazon Builders' Library", url: "https://aws.amazon.com/builders-library/caching-challenges-and-strategies/" };
const dynamoPartitions = { title: "Designing partition keys to distribute workloads", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-uniform-load.html" };
const dynamoWriteSharding = { title: "Using write sharding to distribute workloads evenly", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-sharding.html" };
const pubsubBasics = { title: "Overview of the Pub/Sub service", publisher: "Google Cloud Documentation", url: "https://docs.cloud.google.com/pubsub/docs/pubsub-basics" };
const azureCompetingConsumers = { title: "Competing Consumers pattern", publisher: "Microsoft Azure Architecture Center", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/competing-consumers" };
const azureBackgroundJobs = { title: "Best practices for background jobs", publisher: "Microsoft Azure Architecture Center", url: "https://learn.microsoft.com/en-us/azure/architecture/best-practices/background-jobs" };
const azureAsyncReply = { title: "Asynchronous Request-Reply pattern", publisher: "Microsoft Azure Architecture Center", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/asynchronous-request-reply" };
const dataflowOverview = { title: "Dataflow overview", publisher: "Google Cloud Documentation", url: "https://docs.cloud.google.com/dataflow/docs/overview" };
const dataflowPlanning = { title: "Plan your Dataflow pipeline", publisher: "Google Cloud Documentation", url: "https://docs.cloud.google.com/dataflow/docs/guides/plan-pipelines" };
const azureCqrs = { title: "CQRS pattern", publisher: "Microsoft Azure Architecture Center", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs" };
const azureSaga = { title: "Saga distributed transactions pattern", publisher: "Microsoft Azure Architecture Center", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/saga" };
const awsIdempotency = { title: "Making retries safe with idempotent APIs", publisher: "Amazon Builders' Library", url: "https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/" };
const s3Multipart = { title: "Uploading and copying objects using multipart upload", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html" };

export const architecturePatternSourcesReviewedAt = "2026-09-04";

export const architecturePatternSources: Record<string, readonly FurtherReadingItem[]> = {
  "scaling-reads": [postgresReplication, awsCaching],
  "scaling-writes": [dynamoPartitions, dynamoWriteSharding],
  "read-heavy-systems": [awsCaching, postgresReplication],
  "write-heavy-systems": [dynamoPartitions, azureCompetingConsumers],
  "fan-out": [pubsubBasics, azureCompetingConsumers],
  "fanout-read-write": [pubsubBasics, awsCaching],
  "background-jobs": [azureBackgroundJobs, azureCompetingConsumers],
  "long-running-jobs": [azureAsyncReply, azureBackgroundJobs],
  "batch-vs-streaming": [dataflowOverview, dataflowPlanning],
  cqrs: [azureCqrs, azureSaga],
  "handling-hot-partitions": [dynamoPartitions, dynamoWriteSharding],
  "handling-contention": [postgresIsolation, postgresLocks],
  "multi-step-workflows": [azureSaga, awsIdempotency],
  "large-file-processing": [s3Multipart, azureBackgroundJobs],
};
