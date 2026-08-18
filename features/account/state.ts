export type AccountActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialAccountActionState: AccountActionState = { status: "idle", message: "" };
