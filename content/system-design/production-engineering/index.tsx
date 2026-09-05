import { AuthnAuthzLessonContent, JwtLessonContent, OAuthOidcLessonContent, SessionsTokensLessonContent } from "./identity-security";
import { DistributedTracingLessonContent, LogsLessonContent, MetricsLessonContent, ObservabilityLessonContent, RequestIdsLessonContent } from "./observability-signals";
import { ApiAbuseDdosLessonContent, EncryptionLessonContent, SecretsManagementLessonContent, TenantAuthorizationLessonContent, TlsLessonContent } from "./platform-security";
import { AlertsLessonContent, ErrorBudgetsLessonContent, SlisLessonContent, SlosLessonContent } from "./service-reliability";

export const productionEngineeringLessonIds = new Set([
  "observability", "logs", "metrics", "distributed-tracing", "request-ids",
  "alerts", "slis", "slos", "error-budgets",
  "authn-authz", "sessions-tokens", "jwt", "oauth-oidc",
  "tls", "encryption", "secrets-management", "api-abuse-ddos", "tenant-authorization",
]);

export function ProductionEngineeringLessonContent({ lessonId }: { lessonId: string }) {
  switch (lessonId) {
    case "observability": return <ObservabilityLessonContent />;
    case "logs": return <LogsLessonContent />;
    case "metrics": return <MetricsLessonContent />;
    case "distributed-tracing": return <DistributedTracingLessonContent />;
    case "request-ids": return <RequestIdsLessonContent />;
    case "alerts": return <AlertsLessonContent />;
    case "slis": return <SlisLessonContent />;
    case "slos": return <SlosLessonContent />;
    case "error-budgets": return <ErrorBudgetsLessonContent />;
    case "authn-authz": return <AuthnAuthzLessonContent />;
    case "sessions-tokens": return <SessionsTokensLessonContent />;
    case "jwt": return <JwtLessonContent />;
    case "oauth-oidc": return <OAuthOidcLessonContent />;
    case "tls": return <TlsLessonContent />;
    case "encryption": return <EncryptionLessonContent />;
    case "secrets-management": return <SecretsManagementLessonContent />;
    case "api-abuse-ddos": return <ApiAbuseDdosLessonContent />;
    case "tenant-authorization": return <TenantAuthorizationLessonContent />;
    default: return null;
  }
}
