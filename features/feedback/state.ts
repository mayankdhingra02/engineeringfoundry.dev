export type FeedbackActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  referenceId?: string;
  fieldErrors?: Partial<Record<"category" | "message" | "contact_email" | "contact_consent", string>>;
};

export const initialFeedbackActionState: FeedbackActionState = { status: "idle" };
