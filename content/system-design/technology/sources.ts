import type { FurtherReadingItem } from "@/components/system-design-article";

const redisTypes = { title: "Redis data types", publisher: "Redis Documentation", url: "https://redis.io/docs/latest/develop/data-types/" };
const redisEviction = { title: "Key eviction", publisher: "Redis Documentation", url: "https://redis.io/docs/latest/develop/reference/eviction/" };
const redisPersistence = { title: "Redis persistence", publisher: "Redis Documentation", url: "https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/" };
const redisReplication = { title: "Redis replication", publisher: "Redis Documentation", url: "https://redis.io/docs/latest/operate/oss_and_stack/management/replication/" };
const redisCluster = { title: "Redis Cluster specification", publisher: "Redis Documentation", url: "https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/" };
const kafkaIntro = { title: "Apache Kafka introduction", publisher: "Apache Kafka Documentation", url: "https://kafka.apache.org/documentation/" };
const kafkaDesign = { title: "Kafka design and delivery semantics", publisher: "Apache Kafka Documentation", url: "https://kafka.apache.org/documentation/#design" };
const postgresMvcc = { title: "PostgreSQL MVCC introduction", publisher: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/current/mvcc-intro.html" };
const postgresIndexes = { title: "PostgreSQL indexes", publisher: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/current/indexes.html" };
const postgresReplication = { title: "PostgreSQL warm standby and streaming replication", publisher: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/current/warm-standby.html" };
const dynamoConsistency = { title: "DynamoDB read consistency", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html" };
const dynamoIndexes = { title: "DynamoDB global secondary indexes", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html" };
const dynamoWrites = { title: "DynamoDB read and write operations", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/read-write-operations.html" };
const elasticShards = { title: "Shard allocation, relocation, and recovery", publisher: "Elastic Documentation", url: "https://www.elastic.co/docs/deploy-manage/distributed-architecture/shard-allocation-relocation-recovery" };
const elasticRefresh = { title: "Elasticsearch refresh parameter", publisher: "Elastic Documentation", url: "https://www.elastic.co/docs/reference/elasticsearch/rest-apis/refresh-parameter" };
const openSearchRefresh = { title: "OpenSearch Refresh Index API", publisher: "OpenSearch Documentation", url: "https://docs.opensearch.org/latest/api-reference/index-apis/refresh/" };
const s3Overview = { title: "Amazon S3 and its data consistency model", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/" };
const s3Multipart = { title: "Multipart upload overview", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html" };
const s3Events = { title: "Amazon S3 Event Notifications", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventNotifications.html" };
const cassandraArchitecture = { title: "Cassandra Dynamo architecture", publisher: "Apache Cassandra Documentation", url: "https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html" };
const cassandraModel = { title: "Cassandra data definition and partition keys", publisher: "Apache Cassandra Documentation", url: "https://cassandra.apache.org/doc/latest/cassandra/developing/cql/ddl.html" };
const rabbitExchanges = { title: "RabbitMQ exchanges and routing", publisher: "RabbitMQ Documentation", url: "https://www.rabbitmq.com/tutorials/amqp-concepts#exchanges" };
const rabbitReliability = { title: "RabbitMQ reliability guide", publisher: "RabbitMQ Documentation", url: "https://www.rabbitmq.com/docs/reliability" };
const sqsVisibility = { title: "Amazon SQS visibility timeout", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html" };
const sqsTypes = { title: "Amazon SQS queue types", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-queue-types.html" };
const zookeeperGuide = { title: "ZooKeeper Programmer's Guide", publisher: "Apache ZooKeeper Documentation", url: "https://zookeeper.apache.org/doc/current/zookeeperProgrammers.html" };
const etcdApi = { title: "etcd v3.6 API design", publisher: "etcd Documentation", url: "https://etcd.io/docs/v3.6/learning/api/" };
const etcdCoordination = { title: "etcd for distributed coordination", publisher: "etcd Documentation", url: "https://etcd.io/docs/v3.6/learning/why/" };
const flinkState = { title: "Stateful stream processing", publisher: "Apache Flink Documentation", url: "https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/stateful-stream-processing/" };
const flinkTime = { title: "Streaming analytics: event time and watermarks", publisher: "Apache Flink Documentation", url: "https://nightlies.apache.org/flink/flink-docs-stable/docs/learn-flink/streaming_analytics/" };

export const technologySources: Record<string, readonly FurtherReadingItem[]> = {
  redis: [redisTypes, redisEviction, redisPersistence, redisReplication, redisCluster],
  "kafka-deep-dive": [kafkaIntro, kafkaDesign],
  postgresql: [postgresMvcc, postgresIndexes, postgresReplication],
  dynamodb: [dynamoConsistency, dynamoIndexes, dynamoWrites],
  elasticsearch: [elasticShards, elasticRefresh, openSearchRefresh],
  s3: [s3Overview, s3Multipart, s3Events],
  cassandra: [cassandraArchitecture, cassandraModel],
  rabbitmq: [rabbitExchanges, rabbitReliability],
  sqs: [sqsVisibility, sqsTypes],
  zookeeper: [zookeeperGuide],
  etcd: [etcdApi, etcdCoordination],
  "flink-deep-dive": [flinkState, flinkTime],
};
