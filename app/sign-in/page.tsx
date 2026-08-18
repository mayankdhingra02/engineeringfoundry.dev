import { redirect } from "next/navigation";
import { safeInternalPath } from "@/lib/auth/redirects";

export default async function LegacySignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const requestedNext = (await searchParams).next;
  redirect(
    requestedNext
      ? `/signin?next=${encodeURIComponent(safeInternalPath(requestedNext))}`
      : "/signin",
  );
}
