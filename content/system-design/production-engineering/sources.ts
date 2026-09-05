import type { FurtherReadingItem } from "@/components/system-design-article";

const otelPrimer = { title: "OpenTelemetry specification overview", publisher: "OpenTelemetry", url: "https://opentelemetry.io/docs/specs/otel/overview/" };
const otelSignals = { title: "Signals", publisher: "OpenTelemetry", url: "https://opentelemetry.io/docs/concepts/signals/" };
const otelContext = { title: "Context propagation", publisher: "OpenTelemetry", url: "https://opentelemetry.io/docs/concepts/context-propagation/" };
const otelLogs = { title: "OpenTelemetry logging specification", publisher: "OpenTelemetry", url: "https://opentelemetry.io/docs/specs/otel/logs/" };
const sreMonitoring = { title: "Monitoring distributed systems", publisher: "Google SRE", url: "https://sre.google/sre-book/monitoring-distributed-systems/" };
const sreSlo = { title: "Service level objectives", publisher: "Google SRE", url: "https://sre.google/sre-book/service-level-objectives/" };
const sreAlerting = { title: "Alerting on SLOs", publisher: "Google SRE Workbook", url: "https://sre.google/workbook/alerting-on-slos/" };
const sreBudget = { title: "Error budget policy", publisher: "Google SRE Workbook", url: "https://sre.google/workbook/error-budget-policy/" };
const rfc9846 = { title: "RFC 9846: The Transport Layer Security (TLS) Protocol Version 1.3", publisher: "IETF", url: "https://www.rfc-editor.org/rfc/rfc9846.html" };
const rfc6749 = { title: "RFC 6749: The OAuth 2.0 Authorization Framework", publisher: "IETF", url: "https://www.rfc-editor.org/rfc/rfc6749.html" };
const rfc6750 = { title: "RFC 6750: OAuth 2.0 Bearer Token Usage", publisher: "IETF", url: "https://www.rfc-editor.org/rfc/rfc6750.html" };
const rfc9700 = { title: "RFC 9700: Best Current Practice for OAuth 2.0 Security", publisher: "IETF", url: "https://www.rfc-editor.org/rfc/rfc9700.html" };
const rfc7519 = { title: "RFC 7519: JSON Web Token (JWT)", publisher: "IETF", url: "https://www.rfc-editor.org/rfc/rfc7519.html" };
const rfc7636 = { title: "RFC 7636: Proof Key for Code Exchange", publisher: "IETF", url: "https://www.rfc-editor.org/rfc/rfc7636.html" };
const rfc8725 = { title: "RFC 8725: JSON Web Token Best Current Practices", publisher: "IETF", url: "https://www.rfc-editor.org/rfc/rfc8725.html" };
const oidc = { title: "OpenID Connect Core 1.0 incorporating errata set 2", publisher: "OpenID Foundation", url: "https://openid.net/specs/openid-connect-core-1_0-errata2.html" };
const nistZeroTrust = { title: "NIST SP 800-207A: A Zero Trust Architecture Model for Access Control in Cloud-Native Applications", publisher: "NIST", url: "https://csrc.nist.gov/pubs/sp/800/207/a/final" };
const nistKeyManagement = { title: "NIST SP 800-57 Part 1 Rev. 5: Recommendation for Key Management", publisher: "NIST", url: "https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final" };
const owaspAuthorization = { title: "Authorization Cheat Sheet", publisher: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html" };
const owaspTenant = { title: "Multi Tenant Security Cheat Sheet", publisher: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html" };
const owaspSession = { title: "Session Management Cheat Sheet", publisher: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html" };
const owaspTls = { title: "Transport Layer Security Cheat Sheet", publisher: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html" };
const owaspCrypto = { title: "Cryptographic Storage Cheat Sheet", publisher: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html" };
const owaspSecrets = { title: "Secrets Management Cheat Sheet", publisher: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html" };
const owaspApi = { title: "OWASP API Security Top 10 — 2023", publisher: "OWASP", url: "https://owasp.org/API-Security/editions/2023/en/0x11-t10/" };
const owaspDos = { title: "Denial of Service Cheat Sheet", publisher: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html" };

export const productionEngineeringSourcesReviewedAt = "2026-09-04";

export const productionEngineeringSources: Record<string, readonly FurtherReadingItem[]> = {
  observability: [otelPrimer, otelSignals, sreMonitoring],
  logs: [otelLogs, otelContext],
  metrics: [otelSignals, sreMonitoring],
  "distributed-tracing": [otelSignals, otelContext],
  "request-ids": [otelContext, otelLogs],
  alerts: [sreAlerting, sreMonitoring],
  slis: [sreSlo, sreMonitoring],
  slos: [sreSlo, sreMonitoring],
  "error-budgets": [sreBudget, sreSlo],
  "authn-authz": [nistZeroTrust, owaspAuthorization],
  "sessions-tokens": [owaspSession, rfc6750],
  jwt: [rfc7519, rfc8725],
  "oauth-oidc": [rfc6749, rfc7636, rfc9700, oidc],
  tls: [rfc9846, owaspTls],
  encryption: [nistKeyManagement, owaspCrypto],
  "secrets-management": [nistKeyManagement, owaspSecrets],
  "api-abuse-ddos": [owaspApi, owaspDos],
  "tenant-authorization": [owaspTenant, owaspAuthorization],
};
