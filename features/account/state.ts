export type AccountActionState = {
  status: "idle" | "error" | "success";
  message: string;
  conflict?: boolean;
  revision?: string;
};

export const initialAccountActionState: AccountActionState = { status: "idle", message: "" };
