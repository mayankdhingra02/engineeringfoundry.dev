import type { FurtherReadingItem } from "@/components/system-design-article";

const kafkaIntro = { title: "Apache Kafka introduction", publisher: "Apache Kafka Documentation", url: "https://kafka.apache.org/documentation/#intro_concepts_and_terms" };
const kafkaDesign = { title: "Kafka design and delivery semantics", publisher: "Apache Kafka Documentation", url: "https://kafka.apache.org/documentation/#design" };
const sqsVisibility = { title: "Amazon SQS visibility timeout", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html" };
const sqsDlq = { title: "Amazon SQS dead-letter queues", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html" };
const rabbitReliability = { title: "RabbitMQ reliability guide", publisher: "RabbitMQ Documentation", url: "https://www.rabbitmq.com/docs/reliability" };
const rabbitExchanges = { title: "RabbitMQ exchanges", publisher: "RabbitMQ Documentation", url: "https://www.rabbitmq.com/tutorials/amqp-concepts#exchanges" };
const flinkState = { title: "Stateful stream processing", publisher: "Apache Flink Documentation", url: "https://nightlies.apache.org/flink/flink-docs-lts/docs/concepts/stateful-stream-processing/" };
const flinkTime = { title: "Timely stream processing", publisher: "Apache Flink Documentation", url: "https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/" };

export const messagingSources: Record<string, readonly FurtherReadingItem[]> = {
  "sync-vs-async": [rabbitReliability], "message-queues": [sqsVisibility, rabbitReliability], "producers-consumers": [rabbitReliability], "queue-vs-pubsub": [rabbitExchanges, kafkaIntro], "pub-sub": [rabbitExchanges], "event-streaming": [kafkaIntro], "queue-vs-stream": [kafkaIntro, sqsVisibility], partitions: [kafkaIntro], "consumer-groups": [kafkaIntro], "message-ordering": [kafkaIntro], "delivery-semantics": [kafkaDesign, rabbitReliability], "idempotent-consumers": [kafkaDesign], "message-retries": [sqsVisibility], "dead-letter-queues": [sqsDlq], deduplication: [kafkaDesign], backpressure: [rabbitReliability], "event-driven-architecture": [kafkaIntro], "event-sourcing": [kafkaIntro], "transactional-outbox": [kafkaDesign], "change-data-capture": [kafkaIntro], kafka: [kafkaIntro, kafkaDesign], "kafka-partitions-replication": [kafkaIntro, kafkaDesign], "kafka-consumer-groups-offsets": [kafkaIntro], "kafka-delivery-guarantees": [kafkaDesign], "kafka-vs-queues": [kafkaIntro, rabbitReliability], "rabbitmq-sqs": [rabbitExchanges, rabbitReliability, sqsVisibility], flink: [flinkState, flinkTime],
};
