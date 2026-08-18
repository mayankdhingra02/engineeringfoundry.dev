import { redirect } from "next/navigation";
import { safeInternalPath } from "@/lib/auth/redirects";

export default async function LegacySignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const requestedNext = (await searchParams).next;
  redirect(
    requestedNext
      ? `/signup?next=${encodeURIComponent(safeInternalPath(requestedNext))}`
      : "/signup",
  );
}
