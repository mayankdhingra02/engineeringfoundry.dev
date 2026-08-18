import { ApiGatewayLessonContent, LoadBalancingLessonContent, RateLimitingLessonContent, ServiceDiscoveryLessonContent } from "./routing-control";
import { CdnLessonContent, RealtimeCommunicationLessonContent, ReverseProxyLessonContent } from "./realtime-edge";
import { GraphqlLessonContent, GrpcLessonContent, IdempotentApisLessonContent, PaginationLessonContent, RestLessonContent } from "./api-design";
import { DnsLessonContent, HttpLessonContent, RequestPathLessonContent } from "./transport";

export const networkingLessonIds = new Set([
  "request-path",
  "dns",
  "http",
  "rest",
  "pagination",
  "idempotent-apis",
  "grpc",
  "graphql",
  "realtime-communication",
  "reverse-proxies",
  "load-balancing",
  "api-gateway",
  "service-discovery",
  "cdn",
  "rate-limiting",
]);

export function NetworkingLessonContent({ lessonId }: { lessonId: string }) {
  switch (lessonId) {
    case "request-path": return <RequestPathLessonContent />;
    case "dns": return <DnsLessonContent />;
    case "http": return <HttpLessonContent />;
    case "rest": return <RestLessonContent />;
    case "pagination": return <PaginationLessonContent />;
    case "idempotent-apis": return <IdempotentApisLessonContent />;
    case "grpc": return <GrpcLessonContent />;
    case "graphql": return <GraphqlLessonContent />;
    case "realtime-communication": return <RealtimeCommunicationLessonContent />;
    case "reverse-proxies": return <ReverseProxyLessonContent />;
    case "load-balancing": return <LoadBalancingLessonContent />;
    case "api-gateway": return <ApiGatewayLessonContent />;
    case "service-discovery": return <ServiceDiscoveryLessonContent />;
    case "cdn": return <CdnLessonContent />;
    case "rate-limiting": return <RateLimitingLessonContent />;
    default: return null;
  }
}
