import { getSystemDesignItemState } from "@/lib/system-design/queries";
import { SystemDesignProgressEditor, SystemDesignSignedOutProgress } from "./progress-editor";

export async function SystemDesignPrivateProgress({ itemId }: { itemId: string }) {
  const itemType = itemId.startsWith("problem-") ? "design_problem" : "concept";
  const canonicalId = itemType === "design_problem" ? itemId.slice("problem-".length) : itemId;
  const state = await getSystemDesignItemState(canonicalId, itemType);
  return state.signedIn ? <SystemDesignProgressEditor itemId={canonicalId} itemType={itemType} progress={state.progress} compact /> : <SystemDesignSignedOutProgress accountPlatformAvailable={state.accountPlatformAvailable} />;
}
