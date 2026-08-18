import type { BehavioralActionState } from "./actions";

export function behavioralErrorProps(state: BehavioralActionState, name: string) {
  const message = state.fieldErrors?.[name];
  return { "aria-invalid": Boolean(message), "aria-describedby": message ? `${name}-error` : undefined } as const;
}

export function BehavioralFieldError({ state, name }: { state: BehavioralActionState; name: string }) {
  const message = state.fieldErrors?.[name];
  return message ? <small className="field-error" id={`${name}-error`}>{message}</small> : null;
}

