import type { FurtherReadingItem } from "@/components/system-design-article";

const postgresData = { title: "PostgreSQL data definition", publisher: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/current/ddl.html" };
const postgresIndexes = { title: "PostgreSQL indexes", publisher: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/current/indexes.html" };
const postgresIsolation = { title: "Transaction isolation", publisher: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/current/transaction-iso.html" };
const dynamoModeling = { title: "DynamoDB data-modeling best practices", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html" };

export const dataStorageSources: Record<string, readonly FurtherReadingItem[]> = {
  "data-modeling": [dynamoModeling, postgresData],
  "sql-vs-nosql": [postgresData, dynamoModeling],
  "sql-databases": [postgresData],
  "key-value-stores": [dynamoModeling],
  "document-databases": [{ title: "MongoDB schema validation", publisher: "MongoDB Documentation", url: "https://www.mongodb.com/docs/manual/core/schema-validation/" }, { title: "Embedded data", publisher: "MongoDB Documentation", url: "https://www.mongodb.com/docs/manual/data-modeling/embedding/" }],
  "wide-column-databases": [{ title: "Cassandra data definition", publisher: "Apache Cassandra Documentation", url: "https://cassandra.apache.org/doc/latest/cassandra/developing/cql/ddl.html" }],
  "database-indexes": [postgresIndexes],
  transactions: [postgresData, postgresIsolation],
  "isolation-levels": [postgresIsolation],
  replication: [{ title: "PostgreSQL warm standby and replication", publisher: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/current/warm-standby.html" }],
  sharding: [dynamoModeling, { title: "Cassandra partition keys", publisher: "Apache Cassandra Documentation", url: "https://cassandra.apache.org/doc/latest/cassandra/developing/cql/ddl.html#the-primary-key" }],
  "consistent-hashing": [{ title: "Consistent Hashing and Random Trees", publisher: "Karger et al., STOC 1997", url: "https://doi.org/10.1145/258533.258660" }],
  "consistency-models": [{ title: "DynamoDB read consistency", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html" }],
  "cap-theorem": [{ title: "CAP Twelve Years Later", publisher: "Eric Brewer, IEEE Computer", url: "https://doi.org/10.1109/MC.2012.37" }],
  pacelc: [{ title: "Consistency Tradeoffs in Modern Distributed Database System Design", publisher: "Daniel J. Abadi, IEEE Computer", url: "https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf" }],
  denormalization: [{ title: "Embedded Data in Your MongoDB Schema", publisher: "MongoDB Documentation", url: "https://www.mongodb.com/docs/manual/data-modeling/embedding/" }],
  "unique-id-generation": [{ title: "RFC 9562: Universally Unique IDentifiers", publisher: "IETF / RFC Editor", url: "https://www.rfc-editor.org/rfc/rfc9562.html" }],
  "object-storage": [{ title: "Amazon S3 objects overview", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingObjects.html" }, { title: "Managing the lifecycle of objects", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html" }],
  "large-file-uploads": [{ title: "Multipart upload overview", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html" }, { title: "Upload with presigned URLs", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html" }],
  "time-series-databases": [{ title: "Amazon Timestream concepts", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/timestream/latest/developerguide/concepts.html" }],
};
