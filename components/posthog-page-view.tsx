"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { capturePageView, isPrivateAnalyticsPath } from "@/lib/analytics";

export function PostHogPageView() {
  const pathname = usePathname();
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    if (isPrivateAnalyticsPath(pathname)) {
      lastUrl.current = null;
      return;
    }

    const url = `${window.location.origin}${pathname}`;
    if (lastUrl.current === url) return;
    lastUrl.current = url;
    capturePageView(url);
  }, [pathname]);

  return null;
}
