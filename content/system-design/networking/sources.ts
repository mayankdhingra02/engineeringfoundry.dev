import type { FurtherReadingItem } from "@/components/system-design-article";

const httpSemantics = { title: "RFC 9110: HTTP Semantics", publisher: "IETF / RFC Editor", url: "https://www.rfc-editor.org/rfc/rfc9110.html" };

export const networkingSources: Record<string, readonly FurtherReadingItem[]> = {
  "request-path": [httpSemantics, { title: "Default cache behavior", publisher: "Cloudflare Developers", url: "https://developers.cloudflare.com/cache/concepts/default-cache-behavior/" }],
  dns: [{ title: "RFC 1034: Domain Names — Concepts and Facilities", publisher: "IETF / RFC Editor", url: "https://www.rfc-editor.org/rfc/rfc1034.html" }],
  http: [httpSemantics, { title: "RFC 8446: TLS 1.3", publisher: "IETF / RFC Editor", url: "https://www.rfc-editor.org/rfc/rfc8446.html" }],
  rest: [httpSemantics],
  pagination: [{ title: "REST API Guidelines: Collections", publisher: "Microsoft", url: "https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md#collections" }],
  "idempotent-apis": [httpSemantics],
  grpc: [{ title: "Core concepts, architecture and lifecycle", publisher: "gRPC", url: "https://grpc.io/docs/what-is-grpc/core-concepts/" }],
  graphql: [{ title: "GraphQL Specification", publisher: "GraphQL Foundation", url: "https://spec.graphql.org/September2025/" }],
  "realtime-communication": [{ title: "RFC 6455: The WebSocket Protocol", publisher: "IETF / RFC Editor", url: "https://www.rfc-editor.org/rfc/rfc6455.html" }, { title: "Using server-sent events", publisher: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events" }],
  "reverse-proxies": [httpSemantics],
  "load-balancing": [{ title: "How Elastic Load Balancing works", publisher: "AWS Documentation", url: "https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html" }],
  "api-gateway": [{ title: "Gateway Routing pattern", publisher: "Azure Architecture Center", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/gateway-routing" }],
  "service-discovery": [{ title: "DNS for Services and Pods", publisher: "Kubernetes Documentation", url: "https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/" }],
  cdn: [{ title: "Cloudflare Cache", publisher: "Cloudflare Developers", url: "https://developers.cloudflare.com/cache/" }, { title: "Purge Cached Content", publisher: "Cloudflare Developers", url: "https://developers.cloudflare.com/api/resources/cache/methods/purge/" }],
  "rate-limiting": [{ title: "RFC 6585: Additional HTTP Status Codes", publisher: "IETF / RFC Editor", url: "https://www.rfc-editor.org/rfc/rfc6585.html" }, { title: "Rate Limiting pattern", publisher: "Azure Architecture Center", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/rate-limiting-pattern" }],
};
