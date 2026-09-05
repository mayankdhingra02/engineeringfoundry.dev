import type { FurtherReadingItem } from "@/components/system-design-article";

const awsDmsOverview = { title: "High-level view of AWS Database Migration Service", publisher: "AWS", url: "https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Introduction.HighLevelView.html" };
const awsDmsValidation = { title: "AWS DMS data validation", publisher: "AWS", url: "https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Validating.html" };
const googleIncident = { title: "Incident Management Guide", publisher: "Google SRE", url: "https://sre.google/resources/practices-and-processes/incident-management-guide/" };
const googlePostmortem = { title: "Postmortem Culture: Learning from Failure", publisher: "Google SRE", url: "https://sre.google/workbook/postmortem-culture/" };
const postgresRecovery = { title: "Continuous Archiving and Point-in-Time Recovery", publisher: "PostgreSQL", url: "https://www.postgresql.org/docs/current/continuous-archiving.html" };
const owaspThreatModel = { title: "Threat Modeling Cheat Sheet", publisher: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html" };
const nistThreatModel = { title: "NIST SP 800-154: Guide to Data-Centric System Threat Modeling", publisher: "NIST", url: "https://csrc.nist.gov/pubs/sp/800/154/ipd" };
const awsCost = { title: "Manage demand and supply resources", publisher: "AWS Well-Architected", url: "https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/manage-demand-and-supply-resources.html" };
const googleCost = { title: "Well-Architected Framework: cost optimization", publisher: "Google Cloud", url: "https://cloud.google.com/architecture/framework/cost-optimization" };
const googleOwnership = { title: "Evolving the SRE Engagement Model", publisher: "Google SRE", url: "https://sre.google/sre-book/evolving-sre-engagement-model/" };
const awsDmsCdc = { title: "Creating tasks for ongoing replication", publisher: "AWS", url: "https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Task.CDC.html" };
const kubernetesArchitecture = { title: "Kubernetes cluster architecture", publisher: "Kubernetes", url: "https://kubernetes.io/docs/concepts/architecture/" };
const envoyArchitecture = { title: "Envoy architecture overview", publisher: "Envoy", url: "https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/intro/arch_overview" };
const stripeLedger = { title: "Reporting and reconciliation", publisher: "Stripe", url: "https://docs.stripe.com/plan-integration/get-started/reporting-reconciliation" };
const stripeIdempotency = { title: "Idempotent requests", publisher: "Stripe", url: "https://docs.stripe.com/api/idempotent_requests" };
const stripeDisputes = { title: "How disputes work", publisher: "Stripe", url: "https://docs.stripe.com/disputes/how-disputes-work" };
const hdfsArchitecture = { title: "HDFS Architecture", publisher: "Apache Hadoop", url: "https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HdfsDesign.html" };
const gfsPaper = { title: "The Google File System", publisher: "Google Research", url: "https://research.google/pubs/the-google-file-system/" };
const redshiftStorage = { title: "Amazon Redshift managed storage considerations", publisher: "AWS", url: "https://docs.aws.amazon.com/redshift/latest/mgmt/managing-cluster-considerations.html" };
const dremelPaper = { title: "Dremel: Interactive Analysis of Web-Scale Datasets", publisher: "Google Research", url: "https://research.google/pubs/dremel-interactive-analysis-of-web-scale-datasets-2/" };

export const requiredClosureSourcesReviewedAt = "2026-09-04";

export const requiredClosureSources: Record<string, readonly FurtherReadingItem[]> = {
  "schema-data-migration": [awsDmsOverview, awsDmsValidation],
  "incident-recovery-postmortems": [googleIncident, googlePostmortem, postgresRecovery],
  "security-threat-modeling": [owaspThreatModel, nistThreatModel],
  "cost-efficiency": [awsCost, googleCost],
  "operational-ownership": [googleOwnership, googleIncident],
  "backfill-rebuild": [awsDmsCdc, awsDmsValidation],
  "control-plane-data-plane": [kubernetesArchitecture, envoyArchitecture],
  "payments-ledgers": [stripeLedger, stripeIdempotency, stripeDisputes],
  "distributed-file-systems": [hdfsArchitecture, gfsPaper],
  "storage-compute-separation": [redshiftStorage, dremelPaper],
};
