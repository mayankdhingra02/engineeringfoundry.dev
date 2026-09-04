import { systemDesignTopicManifest } from "@/data/system-design/manifest";
import { getSystemDesignItemState } from "@/lib/system-design/queries";
import { canonicalSystemDesignProblemIds } from "@/lib/system-design/workspace";
import { SystemDesignProgressEditor, SystemDesignSignedOutProgress } from "./progress-editor";

export async function SystemDesignPrivateProgress({ itemId }: { itemId: string }) {
  const itemType = itemId.startsWith("problem-") ? "design_problem" : "concept";
  const canonicalId = itemType === "design_problem" ? itemId.slice("problem-".length) : itemId;
  const latestHref = itemType === "design_problem"
    ? canonicalSystemDesignProblemIds.has(canonicalId)
      ? `/system-design/problems/${canonicalId}`
      : null
    : systemDesignTopicManifest.find((item) => item.published && item.id === canonicalId)?.slug ?? null;
  if (!latestHref) return null;
  const state = await getSystemDesignItemState(canonicalId, itemType);
  return state.signedIn ? <SystemDesignProgressEditor itemId={canonicalId} itemType={itemType} progress={state.progress} latestHref={latestHref} compact /> : <SystemDesignSignedOutProgress accountPlatformAvailable={state.accountPlatformAvailable} />;
}
