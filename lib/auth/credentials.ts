export const PASSWORD_REQUIREMENT =
  "Use at least 8 characters with at least one letter and one number.";

export type AuthField =
  | "full_name"
  | "email"
  | "password"
  | "confirm_password";

export type AuthFieldErrors = Partial<Record<AuthField, string>>;

type CredentialInput = {
  fullName?: string;
  email: string;
  password: string;
  confirmation?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignInCredentials({ email, password }: CredentialInput) {
  const errors: AuthFieldErrors = {};
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    errors.email = "Enter a valid email address.";
  }
  if (!password) errors.password = "Enter your password.";
  return errors;
}

export function validateSignUpCredentials({
  fullName = "",
  email,
  password,
  confirmation = "",
}: CredentialInput) {
  const errors = validateSignInCredentials({ email, password });
  if (fullName.length < 2 || fullName.length > 80) {
    errors.full_name = "Enter your name using 2–80 characters.";
  }
  if (
    password.length < 8 ||
    password.length > 128 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    errors.password = PASSWORD_REQUIREMENT;
  }
  if (confirmation !== password) {
    errors.confirm_password = "Passwords do not match.";
  }
  return errors;
}
