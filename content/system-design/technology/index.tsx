import { EtcdTechnologyLessonContent, FlinkTechnologyLessonContent, ZooKeeperTechnologyLessonContent } from "./coordination-streaming";
import { KafkaTechnologyLessonContent, PostgreSqlTechnologyLessonContent, RedisTechnologyLessonContent } from "./core-platforms";
import { DynamoDbTechnologyLessonContent, ElasticsearchTechnologyLessonContent, S3TechnologyLessonContent } from "./data-search-object";
import { CassandraTechnologyLessonContent, RabbitMqTechnologyLessonContent, SqsTechnologyLessonContent } from "./distributed-messaging";

export const technologyLessonIds = new Set(["redis", "kafka-deep-dive", "postgresql", "dynamodb", "elasticsearch", "s3", "cassandra", "rabbitmq", "sqs", "zookeeper", "etcd", "flink-deep-dive"]);

export function TechnologyLessonContent({ lessonId }: { lessonId: string }) {
  switch (lessonId) {
    case "redis": return <RedisTechnologyLessonContent />;
    case "kafka-deep-dive": return <KafkaTechnologyLessonContent />;
    case "postgresql": return <PostgreSqlTechnologyLessonContent />;
    case "dynamodb": return <DynamoDbTechnologyLessonContent />;
    case "elasticsearch": return <ElasticsearchTechnologyLessonContent />;
    case "s3": return <S3TechnologyLessonContent />;
    case "cassandra": return <CassandraTechnologyLessonContent />;
    case "rabbitmq": return <RabbitMqTechnologyLessonContent />;
    case "sqs": return <SqsTechnologyLessonContent />;
    case "zookeeper": return <ZooKeeperTechnologyLessonContent />;
    case "etcd": return <EtcdTechnologyLessonContent />;
    case "flink-deep-dive": return <FlinkTechnologyLessonContent />;
    default: return null;
  }
}
