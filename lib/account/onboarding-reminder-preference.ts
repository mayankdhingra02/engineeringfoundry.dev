import { validIanaTimeZone } from "../interview-calendar/model.ts";
import { PrivateDataUnavailableError } from "../persistence/errors.ts";

export const ONBOARDING_REMINDER_PREFERENCE_PRIVATE_DATA_DOMAIN =
  "onboarding reminder preference";

function unavailable(): never {
  throw new PrivateDataUnavailableError(
    ONBOARDING_REMINDER_PREFERENCE_PRIVATE_DATA_DOMAIN,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * A successful zero-row response is the sole unsaved state. Failed or
 * malformed private reads must not become a writable browser-detected default.
 */
export function resolveOnboardingReminderPreferenceQuery(
  input: unknown,
): string | null {
  if (
    !isRecord(input) ||
    !Object.hasOwn(input, "data") ||
    !Object.hasOwn(input, "error") ||
    input.error !== null
  ) {
    unavailable();
  }

  if (input.data === null) return null;
  if (
    !isRecord(input.data) ||
    Object.keys(input.data).length !== 1 ||
    !Object.hasOwn(input.data, "preferred_timezone")
  ) {
    unavailable();
  }

  const timezone = input.data.preferred_timezone;
  if (timezone === null) return null;
  if (typeof timezone !== "string" || !validIanaTimeZone(timezone)) {
    unavailable();
  }
  return timezone;
}
