import { siteConfig } from "@/config/site";

/**
 * Canonical origin for links embedded in calendar exports.
 *
 * Exported events outlive the request that produced them, so the preparation
 * link inside an `.ics` file or a Google template must point at the real site
 * rather than whatever host served the request. Local development keeps its own
 * origin so exports remain clickable while testing.
 */
export function calendarExportOrigin(request: Request) {
  const url = new URL(request.url);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return url.origin;
  return new URL(siteConfig.url).origin;
}
