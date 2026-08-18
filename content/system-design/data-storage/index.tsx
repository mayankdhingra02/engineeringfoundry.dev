import { DatabaseIndexesLessonContent, DenormalizationLessonContent, IsolationConcurrencyLessonContent, TransactionsLessonContent } from "./correctness";
import { CapTheoremLessonContent, ConsistencyModelsLessonContent, ConsistentHashingLessonContent, PacelcLessonContent, ReplicationLessonContent, ShardingLessonContent } from "./distribution";
import { DataModelingLessonContent, DocumentDatabasesLessonContent, KeyValueStoresLessonContent, RelationalDatabasesLessonContent, SqlVsNosqlLessonContent, WideColumnDatabasesLessonContent } from "./modeling";
import { LargeFileUploadsLessonContent, ObjectStorageLessonContent, TimeSeriesDatabasesLessonContent, UniqueIdGenerationLessonContent } from "./storage";

export const dataStorageLessonIds = new Set([
  "data-modeling",
  "sql-vs-nosql",
  "sql-databases",
  "key-value-stores",
  "document-databases",
  "wide-column-databases",
  "database-indexes",
  "transactions",
  "isolation-levels",
  "replication",
  "sharding",
  "consistent-hashing",
  "consistency-models",
  "cap-theorem",
  "pacelc",
  "denormalization",
  "unique-id-generation",
  "object-storage",
  "large-file-uploads",
  "time-series-databases",
]);

export function DataStorageLessonContent({ lessonId }: { lessonId: string }) {
  switch (lessonId) {
    case "data-modeling": return <DataModelingLessonContent />;
    case "sql-vs-nosql": return <SqlVsNosqlLessonContent />;
    case "sql-databases": return <RelationalDatabasesLessonContent />;
    case "key-value-stores": return <KeyValueStoresLessonContent />;
    case "document-databases": return <DocumentDatabasesLessonContent />;
    case "wide-column-databases": return <WideColumnDatabasesLessonContent />;
    case "database-indexes": return <DatabaseIndexesLessonContent />;
    case "transactions": return <TransactionsLessonContent />;
    case "isolation-levels": return <IsolationConcurrencyLessonContent />;
    case "replication": return <ReplicationLessonContent />;
    case "sharding": return <ShardingLessonContent />;
    case "consistent-hashing": return <ConsistentHashingLessonContent />;
    case "consistency-models": return <ConsistencyModelsLessonContent />;
    case "cap-theorem": return <CapTheoremLessonContent />;
    case "pacelc": return <PacelcLessonContent />;
    case "denormalization": return <DenormalizationLessonContent />;
    case "unique-id-generation": return <UniqueIdGenerationLessonContent />;
    case "object-storage": return <ObjectStorageLessonContent />;
    case "large-file-uploads": return <LargeFileUploadsLessonContent />;
    case "time-series-databases": return <TimeSeriesDatabasesLessonContent />;
    default: return null;
  }
}
