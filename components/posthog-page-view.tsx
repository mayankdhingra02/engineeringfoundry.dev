"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { capturePageView } from "@/lib/analytics";

export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}${pathname}${query ? `?${query}` : ""}`;
    if (lastUrl.current === url) return;
    lastUrl.current = url;
    capturePageView(url);
  }, [pathname, query]);

  return null;
}
