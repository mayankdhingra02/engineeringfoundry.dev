export const PUBLIC_PROFILE_UNAVAILABLE_MESSAGE =
  "This public profile is temporarily unavailable. Please try again.";

export class PublicProfileUnavailableError extends Error {
  constructor() {
    super(PUBLIC_PROFILE_UNAVAILABLE_MESSAGE);
    this.name = "PublicProfileUnavailableError";
  }
}

export function resolvePublicProfileQuery<T>({
  data,
  error,
}: {
  data: T | null;
  error: unknown;
}): T | null {
  if (error) throw new PublicProfileUnavailableError();
  return data;
}
