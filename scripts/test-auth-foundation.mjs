import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import {
  validateSignInCredentials,
  validateSignUpCredentials,
} from "../lib/auth/credentials.ts";
import {
  PASSWORD_RECOVERY_CONFIRMATION_ERROR,
  PASSWORD_RECOVERY_FUTURE_SKEW_SECONDS,
  PASSWORD_RECOVERY_INVALID_INPUT_ERROR,
  PASSWORD_RECOVERY_MAX_AGE_SECONDS,
  PASSWORD_RECOVERY_SESSION_ERROR,
  parsePasswordRecoveryActionInput,
  resolveRecentPasswordRecoverySubject,
} from "../lib/auth/password-recovery-claims.ts";
import {
  PUBLIC_PROFILE_UNAVAILABLE_MESSAGE,
  PublicProfileUnavailableError,
  resolvePublicProfileQuery,
} from "../lib/auth/public-profile-query.ts";
import {
  ACCOUNT_NAVIGATION_UNAVAILABLE_MESSAGE,
  AccountNavigationUnavailableError,
  parseAccountNavigationResponse,
  resolveAccountNavigationProfileResult,
  resolveAccountNavigationSettlement,
  resolveAccountNavigationUserResult,
} from "../lib/auth/account-navigation.ts";
import {
  AUTHENTICATED_ACTOR_UNAVAILABLE_MESSAGE,
  AuthenticatedActorUnavailableError,
  resolveAuthenticatedActorUserResult,
} from "../lib/auth/actor-state.ts";
import {
  PROFILE_LINK_MAX_LENGTH,
  canonicalizeProfileLinkUrl,
  parseOptionalProfileLink,
  sanitizePublicProfileLinks,
} from "../lib/auth/profile-links.ts";
import {
  PROFILE_CONFLICT_ERROR,
  PROFILE_EARLIER_SNAPSHOT_SAVED_MESSAGE,
  PROFILE_EXPECTED_REVISION_FIELD,
  PROFILE_INVALID_INPUT_ERROR,
  PROFILE_PERSISTENCE_ERROR,
  PROFILE_SAVED_MESSAGE,
  parseProfileActionEnvelope,
  parseProfileMutationResult,
  resolveProfileActionInput,
  resolveProfileDisplayState,
} from "../lib/auth/profile-action-input.ts";
import { safeInternalPath } from "../lib/auth/redirects.ts";

const failures = [];
const read = (file) => readFileSync(file, "utf8");
const requireText = (source, text, message) => { if (!source.includes(text)) failures.push(message); };
const prohibit = (source, pattern, message) => { if (pattern.test(source)) failures.push(message); };

for (const route of ["app/signin/page.tsx", "app/signup/page.tsx", "app/forgot-password/page.tsx", "app/reset-password/page.tsx", "app/dashboard/page.tsx"]) {
  if (!existsSync(route)) failures.push(`Missing authentication route: ${route}`);
}

for (const [legacyRoute, canonicalRoute] of [["app/sign-in/page.tsx", '"/signin"'], ["app/sign-up/page.tsx", '"/signup"']]) {
  if (!existsSync(legacyRoute)) failures.push(`Missing legacy authentication redirect: ${legacyRoute}`);
  else requireText(read(legacyRoute), canonicalRoute, `${legacyRoute} does not redirect to ${canonicalRoute}.`);
}

try {
  assert.deepEqual(validateSignInCredentials({ email: "invalid", password: "" }), {
    email: "Enter a valid email address.",
    password: "Enter your password.",
  });
  assert.deepEqual(validateSignUpCredentials({ fullName: "A", email: "engineer@example.com", password: "password", confirmation: "different" }), {
    full_name: "Enter your name using 2–80 characters.",
    password: "Use at least 8 characters with at least one letter and one number.",
    confirm_password: "Passwords do not match.",
  });
  assert.deepEqual(validateSignUpCredentials({ fullName: "Ada Lovelace", email: "ada@example.com", password: "Foundry123", confirmation: "Foundry123" }), {});
  assert.equal(safeInternalPath("https://attacker.example/steal"), "/dashboard");
  assert.equal(safeInternalPath("//attacker.example/steal"), "/dashboard");
  assert.equal(safeInternalPath("/applications?status=active"), "/applications?status=active");

  const publicProfile = {
    username: "grace_hopper",
    display_name: "Grace Hopper",
    bio: "Compiler pioneer",
  };
  assert.equal(resolvePublicProfileQuery({ data: publicProfile, error: null }), publicProfile, "A resolved public profile row must pass through unchanged.");
  assert.equal(resolvePublicProfileQuery({ data: null, error: null }), null, "A genuine no-row public profile result must remain null.");
  assert.throws(
    () => resolvePublicProfileQuery({ data: null, error: { message: "database unavailable" } }),
    (error) => error instanceof PublicProfileUnavailableError
      && error.name === "PublicProfileUnavailableError"
      && error.message === PUBLIC_PROFILE_UNAVAILABLE_MESSAGE
      && error.message === "This public profile is temporarily unavailable. Please try again.",
    "A public-profile RPC error must throw the stable unavailable error instead of becoming a false not-found result.",
  );
  assert.throws(
    () => resolvePublicProfileQuery({ data: publicProfile, error: { message: "partial response" } }),
    PublicProfileUnavailableError,
    "An RPC error must take precedence over any accompanying row.",
  );
} catch (error) {
  failures.push(`Credential, redirect, or public-profile query validation failed: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const userId = "123e4567-e89b-42d3-a456-426614174000";
  const missingSession = { name: "AuthSessionMissingError" };
  const retryableAuthError = { name: "AuthRetryableFetchError" };
  const isMissingSession = (error) => error === missingSession;
  const authenticated = resolveAccountNavigationUserResult({
    data: { user: { id: userId, email: "member@example.com", role: "authenticated" } },
    error: null,
  }, isMissingSession);
  assert.deepEqual(authenticated, {
    state: "authenticated",
    user: { id: userId, email: "member@example.com" },
  });
  assert.deepEqual(resolveAccountNavigationUserResult({
    data: { user: null },
    error: missingSession,
  }, isMissingSession), { state: "anonymous" });

  for (const input of [
    null,
    {},
    { data: { user: null } },
    { data: { user: null }, error: null },
    { data: { user: null }, error: retryableAuthError },
    { data: { user: { id: userId } }, error: missingSession },
    { data: { user: { id: "not-a-user", email: null } }, error: null },
    { data: { user: { id: userId, email: "" } }, error: null },
    { data: { user: { id: userId, email: "not-an-email" } }, error: null },
    { data: { user: { id: userId, email: "x".repeat(255) } }, error: null },
    { data: { user: { id: userId, email: null } }, error: null, extra: true },
  ]) {
    assert.throws(
      () => resolveAccountNavigationUserResult(input, isMissingSession),
      AccountNavigationUnavailableError,
      "A failed or malformed account identity result became anonymous or authenticated.",
    );
  }
  assert.throws(
    () => resolveAccountNavigationUserResult({ data: { user: null }, error: missingSession }, () => { throw new Error("bad discriminator"); }),
    AccountNavigationUnavailableError,
    "A failing missing-session discriminator became anonymous.",
  );

  const readyAccount = {
    state: "ready",
    account: {
      username: "member_one",
      display_name: "Member One",
      email: "member@example.com",
    },
  };
  assert.deepEqual(resolveAccountNavigationProfileResult({
    data: { username: "member_one", display_name: "Member One" },
    error: null,
  }, authenticated.user), readyAccount);
  assert.deepEqual(resolveAccountNavigationProfileResult({ data: null, error: null }, authenticated.user), {
    state: "ready",
    account: { username: null, display_name: null, email: "member@example.com" },
  });
  for (const input of [
    null,
    {},
    { data: null },
    { data: null, error: retryableAuthError },
    { data: { username: "member_one", display_name: "Member One", extra: true }, error: null },
    { data: { username: "Member", display_name: "Member One" }, error: null },
    { data: { username: "member_one", display_name: "" }, error: null },
    { data: { username: "member_one", display_name: "   " }, error: null },
    { data: { username: "member_one", display_name: "Member\nOne" }, error: null },
    { data: { username: "member_one", display_name: "x".repeat(81) }, error: null },
  ]) {
    assert.throws(
      () => resolveAccountNavigationProfileResult(input, authenticated.user),
      AccountNavigationUnavailableError,
      "A failed or malformed account profile result became ready.",
    );
  }

  assert.deepEqual(parseAccountNavigationResponse(200, { state: "disabled" }), { state: "disabled" });
  assert.deepEqual(parseAccountNavigationResponse(200, { state: "anonymous" }), { state: "anonymous" });
  assert.deepEqual(parseAccountNavigationResponse(200, readyAccount), readyAccount);
  assert.deepEqual(parseAccountNavigationResponse(503, { state: "unavailable" }), { state: "unavailable" });
  for (const [status, body] of [
    [500, { state: "anonymous" }],
    [200, {}],
    [200, { state: "anonymous", account: null }],
    [200, { ...readyAccount, account: { ...readyAccount.account, unexpected: true } }],
    [200, { ...readyAccount, account: { ...readyAccount.account, username: "Member" } }],
    [200, { ...readyAccount, account: { ...readyAccount.account, display_name: "" } }],
    [200, { ...readyAccount, account: { ...readyAccount.account, email: "not-an-email" } }],
    [503, { state: "ready", account: readyAccount.account }],
    [503, { state: "unavailable", detail: "private" }],
  ]) {
    assert.deepEqual(
      parseAccountNavigationResponse(status, body),
      { state: "unavailable" },
      "A noncanonical account response became a rendered identity state.",
    );
  }

  assert.deepEqual(resolveAccountNavigationSettlement({ state: "loading" }, { state: "unavailable" }), { state: "unavailable" });
  assert.deepEqual(resolveAccountNavigationSettlement(readyAccount, { state: "unavailable" }), readyAccount, "A refresh failure removed the last verified account state.");
  assert.deepEqual(resolveAccountNavigationSettlement(readyAccount, { state: "anonymous" }, true), readyAccount, "An authenticated refresh race removed the last verified account state.");
  assert.deepEqual(resolveAccountNavigationSettlement({ state: "anonymous" }, { state: "anonymous" }, true), { state: "unavailable" }, "A signed-in refresh failure remained falsely anonymous.");
  assert.deepEqual(resolveAccountNavigationSettlement({ state: "loading" }, { state: "anonymous" }), { state: "anonymous" });
  assert.equal(ACCOUNT_NAVIGATION_UNAVAILABLE_MESSAGE, "Account status is temporarily unavailable.");
  assert.equal(new AccountNavigationUnavailableError().message, ACCOUNT_NAVIGATION_UNAVAILABLE_MESSAGE);
} catch (error) {
  failures.push(`Account-navigation identity, profile, response, or settlement validation failed: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const userId = "123e4567-e89b-42d3-a456-426614174000";
  const missingSession = { name: "AuthSessionMissingError" };
  const retryableAuthError = { name: "AuthRetryableFetchError" };
  const isMissingSession = (error) => error === missingSession;

  assert.deepEqual(resolveAuthenticatedActorUserResult({
    data: { user: { id: userId, email: "member@example.com", app_metadata: {} } },
    error: null,
  }, isMissingSession), { state: "authenticated", userId });
  assert.deepEqual(resolveAuthenticatedActorUserResult({
    data: { user: null },
    error: missingSession,
  }, isMissingSession), { state: "anonymous" });

  for (const input of [
    null,
    {},
    { data: { user: null } },
    { data: { user: null }, error: null },
    { data: { user: null }, error: retryableAuthError },
    { data: { user: { id: userId } }, error: missingSession },
    { data: { user: { id: "not-a-user" } }, error: null },
    { data: { user: { id: userId.toUpperCase() } }, error: null },
    { data: { user: { id: userId } }, error: null, extra: true },
  ]) {
    assert.throws(
      () => resolveAuthenticatedActorUserResult(input, isMissingSession),
      AuthenticatedActorUnavailableError,
      "A failed, contradictory, or malformed shared actor result became anonymous or authenticated.",
    );
  }
  assert.throws(
    () => resolveAuthenticatedActorUserResult(
      { data: { user: null }, error: missingSession },
      () => { throw new Error("bad discriminator"); },
    ),
    AuthenticatedActorUnavailableError,
    "A failing shared-actor missing-session discriminator became anonymous.",
  );
  assert.equal(
    AUTHENTICATED_ACTOR_UNAVAILABLE_MESSAGE,
    "Your account session is temporarily unavailable. Please try again.",
  );
  assert.equal(
    new AuthenticatedActorUnavailableError().message,
    AUTHENTICATED_ACTOR_UNAVAILABLE_MESSAGE,
  );
} catch (error) {
  failures.push(`Shared authenticated-actor resolution failed: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const validationInstant = new Date("2026-09-03T18:30:00.900Z");
  const nowSeconds = Math.floor(validationInstant.getTime() / 1_000);
  const subject = "123e4567-e89b-42d3-a456-426614174000";
  const claims = (amr, sub = subject) => ({
    sub,
    aud: "authenticated",
    amr,
  });
  const recovery = (timestamp) => ({ method: "recovery", timestamp });

  assert.equal(PASSWORD_RECOVERY_MAX_AGE_SECONDS, 600);
  assert.equal(PASSWORD_RECOVERY_FUTURE_SKEW_SECONDS, 60);
  assert.equal(PASSWORD_RECOVERY_SESSION_ERROR, "This recovery session is invalid or expired. Request a new reset link.");
  assert.equal(PASSWORD_RECOVERY_INVALID_INPUT_ERROR, "Review the password fields and try again.");
  assert.equal(PASSWORD_RECOVERY_CONFIRMATION_ERROR, "Passwords do not match.");
  assert.equal(resolveRecentPasswordRecoverySubject(claims([recovery(nowSeconds)]), validationInstant), subject);
  assert.equal(resolveRecentPasswordRecoverySubject(claims([recovery(nowSeconds - PASSWORD_RECOVERY_MAX_AGE_SECONDS)]), validationInstant), subject, "The exact recovery-age boundary must remain valid.");
  assert.equal(resolveRecentPasswordRecoverySubject(claims([recovery(nowSeconds + PASSWORD_RECOVERY_FUTURE_SKEW_SECONDS)]), validationInstant), subject, "The exact server-skew boundary must remain valid.");
  assert.equal(resolveRecentPasswordRecoverySubject(claims([
    { method: "password", timestamp: nowSeconds - 30 },
    recovery(nowSeconds - 10),
  ]), validationInstant), subject, "A valid recovery method was lost beside another well-formed AMR entry.");
  assert.equal(
    resolveRecentPasswordRecoverySubject(claims([recovery(nowSeconds)], subject.toUpperCase()), validationInstant),
    subject,
    "A valid UUID subject must be normalized before correlation.",
  );

  const invalidClaimCases = [
    ["null claims", null],
    ["array claims", []],
    ["missing subject", { amr: [recovery(nowSeconds)] }],
    ["non-string subject", claims([recovery(nowSeconds)], 42)],
    ["nil UUID subject", claims([recovery(nowSeconds)], "00000000-0000-0000-0000-000000000000")],
    ["malformed UUID subject", claims([recovery(nowSeconds)], "not-a-user")],
    ["missing AMR", { sub: subject }],
    ["non-array AMR", { sub: subject, amr: "recovery" }],
    ["empty AMR", claims([])],
    ["string-only AMR without freshness", claims(["recovery"])],
    ["null AMR member", claims([null])],
    ["missing method", claims([{ timestamp: nowSeconds }])],
    ["empty method", claims([{ method: "", timestamp: nowSeconds }])],
    ["missing timestamp", claims([{ method: "recovery" }])],
    ["string timestamp", claims([{ method: "recovery", timestamp: String(nowSeconds) }])],
    ["fractional timestamp", claims([recovery(nowSeconds - 0.5)])],
    ["negative timestamp", claims([recovery(-1)])],
    ["unsafe timestamp", claims([recovery(Number.MAX_SAFE_INTEGER + 1)])],
    ["extra AMR member field", claims([{ method: "recovery", timestamp: nowSeconds, provider: "email" }])],
    ["password-only session", claims([{ method: "password", timestamp: nowSeconds }])],
    ["duplicate recovery methods", claims([recovery(nowSeconds), recovery(nowSeconds - 1)])],
    ["malformed sibling entry", claims([recovery(nowSeconds), { method: "password" }])],
    ["stale recovery", claims([recovery(nowSeconds - PASSWORD_RECOVERY_MAX_AGE_SECONDS - 1)])],
    ["recovery beyond future skew", claims([recovery(nowSeconds + PASSWORD_RECOVERY_FUTURE_SKEW_SECONDS + 1)])],
  ];
  for (const [name, value] of invalidClaimCases) {
    assert.equal(resolveRecentPasswordRecoverySubject(value, validationInstant), null, `${name} produced a recovery capability.`);
  }
  assert.equal(resolveRecentPasswordRecoverySubject(claims([recovery(nowSeconds)]), new Date(Number.NaN)), null, "An invalid validation instant produced a recovery capability.");

  const recoveryForm = (password, confirmation = password) => {
    const form = new FormData();
    form.set("password", password);
    form.set("confirm_password", confirmation);
    return form;
  };
  const minimumPassword = "Foundry1";
  const maximumPassword = `A1${"z".repeat(126)}`;
  assert.deepEqual(parsePasswordRecoveryActionInput(recoveryForm(minimumPassword)), { ok: true, value: { password: minimumPassword } });
  assert.deepEqual(parsePasswordRecoveryActionInput(recoveryForm(maximumPassword)), { ok: true, value: { password: maximumPassword } });
  const actionMetadataForm = recoveryForm("Recovery123");
  actionMetadataForm.append("$ACTION_ID_example", "opaque-next-metadata");
  assert.deepEqual(parsePasswordRecoveryActionInput(actionMetadataForm), { ok: true, value: { password: "Recovery123" } }, "Next action metadata was not ignored safely.");

  for (const input of [null, undefined, {}, [], "password", 42]) {
    assert.deepEqual(parsePasswordRecoveryActionInput(input), { ok: false, error: PASSWORD_RECOVERY_INVALID_INPUT_ERROR }, "A non-FormData recovery payload was accepted.");
  }
  for (const name of ["password", "confirm_password"]) {
    const form = recoveryForm("Recovery123");
    form.delete(name);
    assert.deepEqual(parsePasswordRecoveryActionInput(form), { ok: false, error: PASSWORD_RECOVERY_INVALID_INPUT_ERROR }, `A missing ${name} field was accepted.`);
  }
  for (const name of ["password", "confirm_password"]) {
    const form = recoveryForm("Recovery123");
    form.append(name, "Recovery123");
    assert.deepEqual(parsePasswordRecoveryActionInput(form), { ok: false, error: PASSWORD_RECOVERY_INVALID_INPUT_ERROR }, `Duplicate ${name} fields were accepted.`);
  }
  for (const name of ["password", "confirm_password"]) {
    const form = recoveryForm("Recovery123");
    form.set(name, new Blob(["Recovery123"]));
    assert.deepEqual(parsePasswordRecoveryActionInput(form), { ok: false, error: PASSWORD_RECOVERY_INVALID_INPUT_ERROR }, `A file-valued ${name} field was accepted.`);
  }
  for (const [name, value] of [["unknown field", "unexpected"], ["case-variant field", "Password"]]) {
    const form = recoveryForm("Recovery123");
    form.set(value, "Recovery123");
    assert.deepEqual(parsePasswordRecoveryActionInput(form), { ok: false, error: PASSWORD_RECOVERY_INVALID_INPUT_ERROR }, `${name} was accepted.`);
  }
  for (const password of ["Short1", "abcdefgh", "12345678", `A1${"z".repeat(127)}`]) {
    assert.deepEqual(parsePasswordRecoveryActionInput(recoveryForm(password)), { ok: false, error: "Use at least 8 characters with at least one letter and one number." }, `Weak recovery password ${JSON.stringify(password)} was accepted.`);
  }
  assert.deepEqual(parsePasswordRecoveryActionInput(recoveryForm("Recovery123", "Recovery124")), { ok: false, error: PASSWORD_RECOVERY_CONFIRMATION_ERROR });
} catch (error) {
  failures.push(`Password-recovery claim or action-input validation failed: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const canonicalCases = [
    ["github", "https://github.com", "https://github.com/"],
    ["github", "https://www.github.com/octocat", "https://github.com/octocat"],
    ["github", "  HTTPS://WWW.GITHUB.COM/OctoCat?tab=repositories#profile  ", "https://github.com/OctoCat"],
    ["linkedin", "https://linkedin.com/in/member", "https://www.linkedin.com/in/member"],
    ["linkedin", "https://www.linkedin.com", "https://www.linkedin.com/"],
    ["linkedin", "  HTTPS://LINKEDIN.COM/in/Profile-Member?trk=public#about  ", "https://www.linkedin.com/in/Profile-Member"],
  ];
  for (const [platform, input, expected] of canonicalCases) {
    assert.deepEqual(parseOptionalProfileLink(platform, input), { value: expected }, `${platform} link did not canonicalize safely.`);
    assert.equal(canonicalizeProfileLinkUrl(platform, input), expected, `${platform} defensive canonicalization disagrees with input parsing.`);
    assert.equal(canonicalizeProfileLinkUrl(platform, expected), expected, `${platform} canonicalization is not idempotent.`);
  }
  for (const platform of ["github", "linkedin"]) {
    assert.deepEqual(parseOptionalProfileLink(platform, ""), { value: null }, `${platform} blank optional link must remain empty.`);
    assert.deepEqual(parseOptionalProfileLink(platform, "   "), { value: null }, `${platform} whitespace-only optional link must remain empty.`);
    assert.deepEqual(parseOptionalProfileLink(platform, null), { value: null }, `${platform} absent optional link must remain empty.`);
    assert.deepEqual(parseOptionalProfileLink(platform, undefined), { value: null }, `${platform} undefined optional link must remain empty.`);
  }

  const invalidByPlatform = {
    github: [
      "https://attacker.example/phish", "https://linkedin.com/in/member", "https://evilgithub.com/member",
      "https://github.com.evil.test/member", "https://gist.github.com/member", "https://github.com./member",
      "https://127.0.0.1/member", "https://localhost/member", "http://github.com/member", "ftp://github.com/member",
      "javascript:alert(1)", "data:text/plain,github", "//github.com/member", "https://user:password@github.com/member",
      "https://github.com@evil.test/member", "https://github.com:444/member", "https://", "https://github.com/member\nnext",
      String.raw`https://github.com\evil.test/member`, String.raw`https:\\github.com/member`,
      `https://github.com/${"a".repeat(PROFILE_LINK_MAX_LENGTH)}`,
    ],
    linkedin: [
      "https://attacker.example/phish", "https://github.com/member", "https://evillinkedin.com/in/member",
      "https://linkedin.com.evil.test/in/member", "https://uk.linkedin.com/in/member", "https://linkedin.com./in/member",
      "https://127.0.0.1/in/member", "https://localhost/in/member", "http://linkedin.com/in/member", "ftp://linkedin.com/in/member",
      "javascript:alert(1)", "data:text/plain,linkedin", "//linkedin.com/in/member", "https://user:password@linkedin.com/in/member",
      "https://linkedin.com@evil.test/in/member", "https://linkedin.com:444/in/member", "https://", "https://linkedin.com/in/member\u0000next",
      String.raw`https://linkedin.com\evil.test/in/member`, String.raw`https:\\linkedin.com/in/member`,
      `https://linkedin.com/${"a".repeat(PROFILE_LINK_MAX_LENGTH)}`,
    ],
  };
  for (const [platform, values] of Object.entries(invalidByPlatform)) {
    const expectedError = platform === "github" ? "GitHub URL must use https://github.com." : "LinkedIn URL must use https://www.linkedin.com.";
    for (const value of values) {
      assert.deepEqual(parseOptionalProfileLink(platform, value), { value: null, error: expectedError }, `${platform} accepted unsafe link ${JSON.stringify(value)}.`);
      assert.equal(canonicalizeProfileLinkUrl(platform, value), null, `${platform} public sanitization accepted unsafe link ${JSON.stringify(value)}.`);
    }
    for (const value of [42, true, [], {}, new Blob(["https://github.com/member"])]) {
      assert.deepEqual(parseOptionalProfileLink(platform, value), { value: null, error: expectedError }, `${platform} accepted a non-string link.`);
    }
  }

  const unsafeLegacy = { username: "legacy", github_url: "https://attacker.example/phish", linkedin_url: "https://github.com/legacy", extra: "preserved" };
  const sanitizedLegacy = sanitizePublicProfileLinks(unsafeLegacy);
  assert.equal(sanitizedLegacy.github_url, null, "An unsafe legacy GitHub value reached public rendering.");
  assert.equal(sanitizedLegacy.linkedin_url, null, "An unsafe legacy LinkedIn value reached public rendering.");
  assert.equal(sanitizedLegacy.extra, "preserved", "Public-link sanitization changed an unrelated projection field.");
  assert.equal(unsafeLegacy.github_url, "https://attacker.example/phish", "Public-link sanitization mutated its RPC input.");
  const sanitizedSafeAliases = sanitizePublicProfileLinks({ github_url: "https://www.github.com/legacy", linkedin_url: "https://linkedin.com/in/legacy" });
  assert.equal(sanitizedSafeAliases.github_url, "https://github.com/legacy", "A safe legacy GitHub alias was not canonicalized independently.");
  assert.equal(sanitizedSafeAliases.linkedin_url, "https://www.linkedin.com/in/legacy", "A safe legacy LinkedIn alias was not canonicalized independently.");
} catch (error) {
  failures.push(`Professional profile-link validation failed: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const revision = "2026-09-04T12:34:56.123456+00:00";
  const profileActionForm = (overrides = {}) => {
    const values = {
      username: "profile_member",
      display_name: "Profile Member",
      bio: "Builds reliable systems.",
      current_company: "Foundry",
      current_role: "Engineer",
      years_experience: "7",
      linkedin_url: "https://linkedin.com/in/profile-member",
      github_url: "https://www.github.com/profile-member",
      is_public: "public",
      [PROFILE_EXPECTED_REVISION_FIELD]: revision,
      ...overrides,
    };
    const form = new FormData();
    for (const [name, value] of Object.entries(values)) form.append(name, value);
    return form;
  };
  const validEnvelope = parseProfileActionEnvelope(profileActionForm());
  assert.equal(validEnvelope.ok, true);
  assert.deepEqual(validEnvelope.ok && resolveProfileActionInput(validEnvelope.value, {
    githubUrl: null,
    linkedinUrl: null,
  }), {
    ok: true,
    value: {
      expectedUpdatedAt: revision,
      username: "profile_member",
      displayName: "Profile Member",
      bio: "Builds reliable systems.",
      currentCompany: "Foundry",
      currentRole: "Engineer",
      yearsExperience: 7,
      linkedinUrl: "https://www.linkedin.com/in/profile-member",
      githubUrl: "https://github.com/profile-member",
      isPublic: true,
    },
  });
  assert.deepEqual(parseProfileActionEnvelope(null), { ok: false, reason: "invalid-input" });
  for (const name of [
    "username", "display_name", "bio", "current_company", "current_role",
    "years_experience", "linkedin_url", "github_url", "is_public",
    PROFILE_EXPECTED_REVISION_FIELD,
  ]) {
    const missing = profileActionForm();
    missing.delete(name);
    assert.deepEqual(parseProfileActionEnvelope(missing), { ok: false, reason: "invalid-input" }, `profile action accepted missing ${name}`);
    const duplicate = profileActionForm();
    duplicate.append(name, "duplicate");
    assert.deepEqual(parseProfileActionEnvelope(duplicate), { ok: false, reason: "invalid-input" }, `profile action accepted duplicate ${name}`);
    const file = profileActionForm();
    file.delete(name);
    file.append(name, new Blob(["not text"], { type: "text/plain" }));
    assert.deepEqual(parseProfileActionEnvelope(file), { ok: false, reason: "invalid-input" }, `profile action accepted file-valued ${name}`);
  }
  const unknown = profileActionForm();
  unknown.append("unexpected", "value");
  assert.deepEqual(parseProfileActionEnvelope(unknown), { ok: false, reason: "invalid-input" });
  const frameworkMetadata = profileActionForm();
  frameworkMetadata.append("$ACTION_ID_test", "metadata");
  assert.equal(parseProfileActionEnvelope(frameworkMetadata).ok, true);
  for (const overrides of [
    { username: "admin" },
    { display_name: "" },
    { display_name: "x".repeat(81) },
    { display_name: "Profile\nMember" },
    { bio: "x".repeat(281) },
    { current_company: "x".repeat(101) },
    { current_role: "x".repeat(101) },
    { years_experience: "01" },
    { years_experience: "81" },
    { is_public: "on" },
    { bio: "unsafe\u0000bio" },
    { [PROFILE_EXPECTED_REVISION_FIELD]: "2026-02-30T12:00:00Z" },
  ]) {
    assert.deepEqual(parseProfileActionEnvelope(profileActionForm(overrides)), { ok: false, reason: "invalid-input" });
  }
  const invalidGithubEnvelope = parseProfileActionEnvelope(profileActionForm({ github_url: "https://github.com.evil.test/member" }));
  assert.equal(invalidGithubEnvelope.ok, true);
  if (invalidGithubEnvelope.ok) {
    assert.deepEqual(resolveProfileActionInput(invalidGithubEnvelope.value, { githubUrl: null, linkedinUrl: null }), { ok: false, reason: "invalid-github" });
    assert.equal(resolveProfileActionInput(invalidGithubEnvelope.value, { githubUrl: "https://github.com.evil.test/member", linkedinUrl: null }).ok, true, "an unchanged legacy-invalid GitHub link was not preserved without rewrite");
  }
  const invalidLinkedinEnvelope = parseProfileActionEnvelope(profileActionForm({ linkedin_url: String.raw`https://linkedin.com\evil.test/in/member` }));
  assert.equal(invalidLinkedinEnvelope.ok, true);
  if (invalidLinkedinEnvelope.ok) {
    assert.deepEqual(resolveProfileActionInput(invalidLinkedinEnvelope.value, { githubUrl: null, linkedinUrl: null }), { ok: false, reason: "invalid-linkedin" });
  }
  const profileId = "123e4567-e89b-42d3-a456-426614174000";
  assert.deepEqual(parseProfileMutationResult([], profileId), { status: "conflict" });
  assert.deepEqual(parseProfileMutationResult([{ profile_id: profileId, updated_at: revision }], profileId), { status: "saved", updatedAt: revision });
  for (const malformed of [
    null,
    {},
    [{ profile_id: profileId, updated_at: revision, extra: true }],
    [{ profile_id: "223e4567-e89b-42d3-a456-426614174000", updated_at: revision }],
    [{ profile_id: profileId, updated_at: "not-a-revision" }],
    [{ profile_id: profileId, updated_at: revision }, { profile_id: profileId, updated_at: revision }],
  ]) assert.deepEqual(parseProfileMutationResult(malformed, profileId), { status: "invalid" });
  assert.deepEqual(resolveProfileDisplayState({ status: "idle", message: "" }, true, false), { status: "pending", message: "Saving profile…" });
  assert.deepEqual(resolveProfileDisplayState({ status: "success", message: PROFILE_SAVED_MESSAGE }, false, true), { status: "success", message: PROFILE_EARLIER_SNAPSHOT_SAVED_MESSAGE });
  assert.deepEqual(resolveProfileDisplayState({ status: "error", message: PROFILE_CONFLICT_ERROR }, false, true), { status: "error", message: PROFILE_CONFLICT_ERROR });
  assert.equal(PROFILE_INVALID_INPUT_ERROR, "Review the profile fields and try again.");
  assert.equal(PROFILE_PERSISTENCE_ERROR, "We couldn't save your profile. Check the fields and try again.");
} catch (error) {
  failures.push(`Profile action input, mutation result, or display-state validation failed: ${error instanceof Error ? error.message : String(error)}`);
}

const authForm = read("features/auth/auth-form.tsx");
for (const marker of ["signInWithPassword", "signUp", 'name="full_name"', "full_name: fullName", 'name="confirm_password"', "validateSignUpCredentials", "PasswordInput"]) requireText(authForm, marker, `Authentication form lacks ${marker}.`);
for (const marker of ['autoComplete="name"', 'autoComplete="email"', 'role="alert"', "aria-describedby", "aria-invalid", "disabled={Boolean(pending)}", "fieldErrors", "PASSWORD_REQUIREMENT", "noValidate"]) requireText(authForm, marker, `Authentication form accessibility/loading/validation state lacks ${marker}.`);
for (const route of ["app/signin/page.tsx", "app/signup/page.tsx"]) requireText(read(route), "AuthPage", `${route} does not render the shared authentication page.`);

const passwordForms = read("features/auth/password-forms.tsx");
for (const marker of ["resetPasswordForEmail", "PasswordInput", "If an account exists", 'role="alert"', "aria-describedby", "aria-invalid", "PASSWORD_REQUIREMENT", "maxLength={128}"]) requireText(passwordForms, marker, `Password recovery lacks ${marker}.`);
const passwordActions = read("features/auth/password-actions.ts");
const authCallback = read("app/auth/callback/route.ts");
const resetPasswordPage = read("app/reset-password/page.tsx");
for (const source of [authCallback, resetPasswordPage, passwordActions]) prohibit(source, /ef-password-recovery/, "Password recovery still trusts the obsolete literal recovery cookie.");
prohibit(authCallback, /searchParams\.get\(["']flow["']\)/, "The auth callback still trusts a caller-supplied recovery-flow label.");
for (const marker of ["exchangeCodeForSession(code)", "data.session.access_token", "getClaims(", "resolveRecentPasswordRecoverySubject", "recoverySubject !== data.user.id.toLowerCase()", 'new URL("/auth/error?reason=callback"', "new URL(next, redirectOrigin)"]) requireText(authCallback, marker, `Auth callback recovery proof lacks ${marker}.`);
const callbackExchangeIndex = authCallback.indexOf("exchangeCodeForSession(code)");
const callbackClaimsIndex = authCallback.indexOf("getClaims(", callbackExchangeIndex);
const callbackResolutionIndex = authCallback.indexOf("resolveRecentPasswordRecoverySubject", callbackClaimsIndex);
const callbackCorrelationIndex = authCallback.indexOf("recoverySubject !== data.user.id.toLowerCase()", callbackResolutionIndex);
const callbackRecoveryRedirectIndex = authCallback.indexOf("new URL(next, redirectOrigin)", callbackCorrelationIndex);
if (callbackExchangeIndex < 0 || callbackClaimsIndex <= callbackExchangeIndex || callbackResolutionIndex <= callbackClaimsIndex || callbackCorrelationIndex <= callbackResolutionIndex || callbackRecoveryRedirectIndex <= callbackCorrelationIndex) failures.push("Auth callback does not verify the exchanged token's recent recovery method and correlated subject before redirecting to password reset.");
for (const marker of ["createSupabaseServerClient", "getClaims()", "resolveRecentPasswordRecoverySubject", 'redirect("/forgot-password")', "ResetPasswordForm"]) requireText(resetPasswordPage, marker, `Reset-password page recovery gate lacks ${marker}.`);
for (const marker of ["parsePasswordRecoveryActionInput(formData)", "createSupabaseServerClient", "getClaims()", "resolveRecentPasswordRecoverySubject", "getUser()", "recoverySubject !== userData.user.id.toLowerCase()", "updateUser({ password: parsed.value.password })"]) requireText(passwordActions, marker, `Password update action lacks ${marker}.`);
const updatePasswordBody = passwordActions.slice(passwordActions.indexOf("export async function updatePasswordAction"));
const parseRecoveryIndex = updatePasswordBody.indexOf("parsePasswordRecoveryActionInput(formData)");
const rejectRecoveryIndex = updatePasswordBody.indexOf("if (!parsed.ok)", parseRecoveryIndex);
const recoveryClientIndex = updatePasswordBody.indexOf("createSupabaseServerClient()", rejectRecoveryIndex);
const recoveryClaimsIndex = updatePasswordBody.indexOf("getClaims()", recoveryClientIndex);
const recoveryUserIndex = updatePasswordBody.indexOf("getUser()", recoveryClaimsIndex);
const recoveryUpdateIndex = updatePasswordBody.indexOf("updateUser({ password: parsed.value.password })", recoveryUserIndex);
if (parseRecoveryIndex < 0 || rejectRecoveryIndex <= parseRecoveryIndex || recoveryClientIndex <= rejectRecoveryIndex || recoveryClaimsIndex <= recoveryClientIndex || recoveryUserIndex <= recoveryClaimsIndex || recoveryUpdateIndex <= recoveryUserIndex) failures.push("Password recovery must reject malformed input before Auth work, then verify recent claims and the correlated user before updating the password.");

const guards = read("lib/auth/guards.ts");
for (const marker of ["requireAuthenticatedUser", "requireMemberProfile", "/signin?next=", "/onboarding?next=", "return { user, profile }"]) requireText(guards, marker, `Reusable route guards lack ${marker}.`);
requireText(read("app/dashboard/page.tsx"), 'requireMemberProfile("/dashboard")', "Dashboard does not use the reusable member guard.");

const actor = read("lib/auth/actor.ts");
const actorState = read("lib/auth/actor-state.ts");
for (const marker of ["getAuthenticatedActor", "getAuthenticatedActorState", "auth.getUser", "createSupabaseServerClient", "resolveAuthenticatedActorUserResult", "isAuthSessionMissingError", 'state: "unavailable"', "result.data.user"]) requireText(actor, marker, `Canonical authenticated actor lacks ${marker}.`);
for (const marker of ["AuthenticatedActorUnavailableError", "resolveAuthenticatedActorUserResult", 'state: "anonymous"', 'state: "authenticated"', "isSessionMissingError"]) requireText(actorState, marker, `Shared actor result boundary lacks ${marker}.`);
assert.ok(actor.indexOf("resolveAuthenticatedActorUserResult") < actor.indexOf('state: "authenticated"'), "The shared actor returns an authenticated owner before resolving the getUser result.");
assert.ok(actor.indexOf('result.state === "anonymous"') < actor.indexOf("return null"), "The shared actor returns null without proving an explicit missing session.");
assert.ok(actor.indexOf('result.state === "anonymous"') < actor.indexOf("throw new AuthenticatedActorUnavailableError"), "The shared actor does not keep unavailable distinct from anonymous.");
prohibit(actor, /(?:userId|user_id)\s*:/, "Canonical actor accepts a client-supplied user identifier.");

const dashboard = read("app/dashboard/page.tsx");
for (const marker of ["Your interview pipeline", "Upcoming interviews", "Applications needing attention", "getDashboardPipeline", "Add application"]) requireText(dashboard, marker, `Dashboard foundation lacks ${marker}.`);
prohibit(dashboard, /PageHero|Mock interviews|Referral requests/, "Dashboard retained the marketing/legacy placeholder shell.");

const accountControl = read("components/account-control.tsx");
const accountNavigation = read("lib/auth/account-navigation.ts");
for (const marker of ["AccountNavigationUnavailableError", "resolveAccountNavigationUserResult", "resolveAccountNavigationProfileResult", "parseAccountNavigationResponse", "resolveAccountNavigationSettlement", "Account status is temporarily unavailable."]) requireText(accountNavigation, marker, `Account navigation result boundary lacks ${marker}.`);
for (const marker of ['navigation.state === "loading"', "account-control-loading", 'fetch("/api/auth/account"', 'cache: "no-store"', "parseAccountNavigationResponse", "requestId !== requestEpoch.current", "resolveAccountNavigationSettlement", "onAuthStateChange", 'event === "SIGNED_OUT"', 'event === "INITIAL_SESSION"', 'event === "TOKEN_REFRESHED"', "retryPending.current", 'aria-live="polite"', 'aria-atomic="true"', "focusAfterRetry", "signOutAction", 'scope: "local"', "resetAnalyticsUser", 'href="/signin"', 'href="/signup"', 'href="/dashboard"', 'href="/settings"', "signOutError"]) requireText(accountControl, marker, `Account navigation lacks ${marker}.`);
prohibit(accountControl, /as\s*\{\s*account:/, "Account navigation still trusts a cast response instead of parsing runtime JSON.");
prohibit(accountControl, /if\s*\(!session\?\.user\)\s*set/, "A sessionless non-sign-out event can still force anonymous navigation.");
const accountFetch = accountControl.indexOf('fetch("/api/auth/account"');
const accountParse = accountControl.indexOf("parseAccountNavigationResponse", accountFetch);
const accountEpochGuard = accountControl.indexOf("requestId !== requestEpoch.current", accountParse);
const accountSettle = accountControl.indexOf("resolveAccountNavigationSettlement", accountEpochGuard);
assert.ok(accountFetch >= 0 && accountParse > accountFetch && accountEpochGuard > accountParse && accountSettle > accountEpochGuard, "Account navigation does not parse and stale-guard each response before settlement.");
const signedOutBranch = accountControl.slice(accountControl.indexOf('if (event === "SIGNED_OUT")'), accountControl.indexOf('} else if (', accountControl.indexOf('if (event === "SIGNED_OUT")')));
assert.ok(signedOutBranch.indexOf("requestEpoch.current += 1") < signedOutBranch.indexOf('commitNavigation({ state: "anonymous" })'), "SIGNED_OUT does not invalidate an in-flight account response before rendering anonymous navigation.");
const authenticatedRefreshStart = accountControl.indexOf("} else if (", accountControl.indexOf('if (event === "SIGNED_OUT")'));
const authenticatedRefreshEnd = accountControl.indexOf("\n        }\n      },", authenticatedRefreshStart);
const authenticatedRefreshBranch = accountControl.slice(authenticatedRefreshStart, authenticatedRefreshEnd);
for (const marker of ['session?.user', 'event === "SIGNED_IN"', 'event === "TOKEN_REFRESHED"', 'navigationRef.current.state !== "ready"', 'commitNavigation({ state: "loading" })', "window.setTimeout", "void load(true)"]) requireText(authenticatedRefreshBranch, marker, `Authenticated navigation refresh lacks ${marker}.`);
assert.ok(authenticatedRefreshBranch.indexOf('commitNavigation({ state: "loading" })') < authenticatedRefreshBranch.indexOf("window.setTimeout") && authenticatedRefreshBranch.indexOf("window.setTimeout") < authenticatedRefreshBranch.indexOf("void load(true)"), "A signed-in event can remain falsely anonymous while its authoritative account refresh fails.");
const unavailableBranchStart = accountControl.indexOf('if (navigation.state === "unavailable")');
const unavailableBranch = accountControl.slice(unavailableBranchStart, accountControl.indexOf('if (navigation.state === "anonymous")', unavailableBranchStart));
for (const marker of ["ACCOUNT_NAVIGATION_UNAVAILABLE_MESSAGE", "retryTrigger", "aria-disabled={retrying}", "onClick={() => void retry()}"]) requireText(unavailableBranch, marker, `Unavailable account navigation lacks ${marker}.`);
const accountRoute = read("app/api/auth/account/route.ts");
for (const marker of ["createSupabaseServerClient", "auth.getUser()", "isAuthSessionMissingError", "resolveAccountNavigationUserResult", 'identity.state === "anonymous"', 'select("username,display_name")', ".eq(\"id\", identity.user.id)", "resolveAccountNavigationProfileResult", 'status: 503', '"Cache-Control"', "no-store", '"X-Robots-Tag": "noindex, nofollow"']) requireText(accountRoute, marker, `Server-backed navigation account state lacks ${marker}.`);
prohibit(accountRoute, /getAuthenticatedActor|avatar_url|is_public/, "The navigation route still inherits ambiguous actor resolution or returns unused profile fields.");
const accountRouteBody = accountRoute.slice(accountRoute.indexOf("export async function GET"));
const routeClient = accountRouteBody.indexOf("createSupabaseServerClient()");
const routeUser = accountRouteBody.indexOf("auth.getUser()", routeClient);
const routeIdentity = accountRouteBody.indexOf("resolveAccountNavigationUserResult", routeUser);
const routeProfile = accountRouteBody.indexOf('.from("profiles")', routeIdentity);
const routeReady = accountRouteBody.indexOf("resolveAccountNavigationProfileResult", routeProfile);
assert.ok(routeClient >= 0 && routeUser > routeClient && routeIdentity > routeUser && routeProfile > routeIdentity && routeReady > routeProfile, "Account navigation does not distinguish verified absence before its profile read and ready response.");
const authSecurity = read("docs/auth-security.md");
for (const marker of ["Global account-navigation truth", "only Supabase's explicit `AuthSessionMissingError`", "private, no-store, noindex `503` unavailable response", "Network, non-OK, JSON, and malformed-body failures", "Shared authenticated-actor truth", "never becomes a signed-out identity", "Public account-optional surfaces", "Rendered browser timing, focus, and assistive-technology behavior remain manual validation"]) requireText(authSecurity, marker, `Authentication documentation omits account-navigation or shared-actor boundary: ${marker}.`);
const globalRequirement = JSON.parse(read("docs/product-blueprint/registry/requirements.json")).requirements.find((requirement) => requirement.id === "EF-GLOBAL");
if (!globalRequirement) failures.push("EF-GLOBAL governance requirement is missing.");
else {
  for (const path of ["app/api/auth/account/route.ts", "components/account-control.tsx", "lib/auth/account-navigation.ts", "lib/auth/actor.ts", "lib/auth/actor-state.ts", "scripts/test-auth-foundation.mjs"]) {
    if (!globalRequirement.code_paths.includes(path)) failures.push(`EF-GLOBAL lacks account-navigation path ${path}.`);
  }
  if (!globalRequirement.content_paths.includes("docs/auth-security.md")) failures.push("EF-GLOBAL lacks account-navigation documentation attribution.");
  if (!globalRequirement.test_commands.includes("npm run test:auth-foundation")) failures.push("EF-GLOBAL lacks its account-navigation regression command.");
  if (!globalRequirement.acceptance_criteria.some((criterion) => criterion.includes("only Supabase's explicit missing-session error becomes anonymous") && criterion.includes("shared actor boundary"))) failures.push("EF-GLOBAL overclaims or omits the account-navigation and shared-actor truth boundary.");
  for (const path of ["app/settings/profile/page.tsx", "features/profile/actions.ts", "features/profile/profile-form.tsx", "lib/auth/profile-action-input.ts", "supabase/migrations/202609040006_save_profile_if_revision.sql", "supabase/tests/database/auth_profile_hardening.test.sql"]) {
    if (!globalRequirement.code_paths.includes(path)) failures.push(`EF-GLOBAL lacks profile revision path ${path}.`);
  }
  if (!globalRequirement.acceptance_criteria.some((criterion) => criterion.includes("Profile settings strictly parse one complete singleton browser snapshot") && criterion.includes("rendered draft retention, focus, and assistive-technology behavior remain browser/manual validation"))) failures.push("EF-GLOBAL overclaims or omits the revision-checked profile editing boundary.");
}
const signOutActionSource = read("features/auth/sign-out-action.ts");
for (const marker of ["createSupabaseServerClient", "supabase.auth.signOut()", 'scope: "local"']) requireText(signOutActionSource, marker, `Server-authoritative sign-out lacks ${marker}.`);

const proxy = read("lib/supabase/proxy.ts");
for (const marker of ["getClaims", "request.cookies.set", "response.cookies.set"]) requireText(proxy, marker, `SSR session refresh lacks ${marker}.`);
prohibit([proxy, actor, read("lib/auth/queries.ts"), guards].join("\n"), /\.auth\.getSession\(/, "Server authorization trusts getSession().");
requireText(read("lib/supabase/client.ts"), "browserClient ??= createBrowserClient", "Browser auth does not reuse a singleton Supabase client.");

const professionalLinkMigration = read("supabase/migrations/202608240001_harden_profile_professional_links.sql");
const profileRevisionMigration = read("supabase/migrations/202609040006_save_profile_if_revision.sql");
const profileDatabaseTest = read("supabase/tests/database/auth_profile_hardening.test.sql");
const migration = read("supabase/migrations/202608130001_create_profiles.sql") + read("supabase/migrations/202608130002_auth_profile_hardening.sql") + professionalLinkMigration + profileRevisionMigration;
for (const marker of ["enable row level security", 'to authenticated', "(select auth.uid()) = id", "handle_new_user", "on_auth_user_created", "revoke select on table public.profiles from anon"]) requireText(migration, marker, `Profile schema/security lacks ${marker}.`);
for (const operation of ["insert", "delete"]) requireText(migration, `revoke insert, delete on public.profiles`, `Profiles do not deny client ${operation}.`);
for (const marker of ["get_public_profile(profile_username text)", "returns table (", "username text", "display_name text", "bio text", "current_company text", '"current_role" text', "years_experience integer", "linkedin_url text", "github_url text", "avatar_url text", "security definer", "profiles.is_public = true", "profiles.onboarding_complete = true", "grant execute on function public.get_public_profile(text) to anon, authenticated"]) requireText(migration, marker, `Public-profile RPC projection or visibility boundary lacks ${marker}.`);

const authQueries = read("lib/auth/queries.ts");
const publicProfilePage = read("app/u/[username]/page.tsx");
const profileActionInput = read("lib/auth/profile-action-input.ts");
const profileFormSource = read("features/profile/profile-form.tsx");
const profileActions = read("features/profile/actions.ts");
const accountActions = read("features/account/actions.ts");
const globalStyles = read("app/globals.css");
for (const marker of [".account-control-unavailable {", ".mobile-account-unavailable {", '.account-control-unavailable button[aria-disabled="true"]', ".mobile-account-unavailable button { min-width: 64px; min-height: 44px; }"]) requireText(globalStyles, marker, `Account-navigation unavailable state lacks ${marker}.`);
const accountUnavailableCopyRule = globalStyles.match(/\.account-control-unavailable\s*>\s*span,\s*\.mobile-account-unavailable\s*>\s*span\s*\{([^}]*)\}/)?.[1];
const accountUnavailableFontSize = accountUnavailableCopyRule?.match(/font-size:\s*([\d.]+)px/)?.[1];
if (!accountUnavailableFontSize || Number(accountUnavailableFontSize) < 13) failures.push("Account-navigation unavailable copy must remain readable at 13px or larger.");
const accountUnavailableButtonRule = globalStyles.match(/\.account-control-unavailable\s+button,\s*\.mobile-account-unavailable\s+button\s*\{([^}]*)\}/)?.[1];
const accountUnavailableButtonFontSize = accountUnavailableButtonRule?.match(/font-size:\s*([\d.]+)px/)?.[1];
if (!accountUnavailableButtonFontSize || Number(accountUnavailableButtonFontSize) < 13) failures.push("Account-navigation retry labels must remain readable at 13px or larger.");
for (const marker of ['rpc("get_public_profile"', "profile_username: username", ".maybeSingle()", "const result = await", "resolvePublicProfileQuery(result)"]) requireText(authQueries, marker, `Public-profile query must retain data and error for the resolver: ${marker}.`);
prohibit(authQueries, /const\s*\{\s*data\s*\}\s*=\s*await\s+supabase\.rpc\("get_public_profile"/, "Public-profile query discards its RPC error before resolution.");
if ((authQueries.match(/\.toLowerCase\(\)/g) ?? []).length !== 1 || publicProfilePage.includes(".toLowerCase()")) failures.push("Public-profile usernames must be normalized exactly once at the shared query boundary for metadata and page rendering.");
for (const marker of ["const profile = await getPublicProfile(username)", "getPublicProfile((await params).username)", "if (!profile) notFound()", 'title: "Profiles Unavailable"', "robots: { index: false, follow: false }"]) requireText(publicProfilePage, marker, `Public-profile route lacks ${marker}.`);
prohibit(publicProfilePage, /try\s*\{|catch\s*\(/, "Public-profile route must not catch an unavailable query and convert it to not-found.");
const pageProfileLookup = publicProfilePage.indexOf("const profile = await getPublicProfile((await params).username)");
const pageNotFound = publicProfilePage.indexOf("if (!profile) notFound()", pageProfileLookup);
if (pageProfileLookup < 0 || pageNotFound <= pageProfileLookup) failures.push("Public-profile page must call notFound only after the resolved query returns a genuine null.");
for (const marker of ["profile.display_name", "profile.username", "profile.bio", "alternates: { canonical:", "openGraph:", "<PublicProfileView", "profile.current_role", "profile.current_company", "profile.years_experience", "profile.github_url", "profile.linkedin_url"]) requireText(publicProfilePage, marker, `Successful public-profile rendering lost ${marker}.`);
const resolvedProfileIndex = authQueries.indexOf("const profile = resolvePublicProfileQuery(result);");
const sanitizedProfileIndex = authQueries.indexOf("profile ? sanitizePublicProfileLinks(profile) : null");
if (resolvedProfileIndex < 0 || sanitizedProfileIndex <= resolvedProfileIndex) failures.push("Public-profile links are not sanitized after resolver error/null semantics complete.");
const storedLinkReadIndex = profileActions.indexOf('.select("github_url,linkedin_url")');
const ownerScopeIndex = profileActions.indexOf('.eq("id", current.user.id)', storedLinkReadIndex);
const envelopeIndex = profileActions.indexOf("parseProfileActionEnvelope(formData)");
const actorIndex = profileActions.indexOf("getAuthenticatedActor()", envelopeIndex);
const resolveProfileIndex = profileActions.indexOf("resolveProfileActionInput(envelope.value", storedLinkReadIndex);
const saveProfileIndex = profileActions.indexOf('rpc("save_profile_if_revision"', resolveProfileIndex);
const parseResultIndex = profileActions.indexOf("parseProfileMutationResult(data, current.user.id)", saveProfileIndex);
if (envelopeIndex < 0 || actorIndex <= envelopeIndex || storedLinkReadIndex <= actorIndex || ownerScopeIndex <= storedLinkReadIndex || resolveProfileIndex <= ownerScopeIndex || saveProfileIndex <= resolveProfileIndex || parseResultIndex <= saveProfileIndex) failures.push("Profile save must strictly parse before actor work, resolve legacy links after the owner read, then use and validate only the revision RPC.");
prohibit(profileActions, /\.from\("profiles"\)\.update|parseProfileForm\(/, "Profile save still performs a direct or coercive legacy profile update.");
for (const marker of [
  "if (storedProfileError)",
  "if (!storedProfile)",
  "githubUrl: storedProfile.github_url",
  "linkedinUrl: storedProfile.linkedin_url",
  "target_update_linkedin_url: input.linkedinUrl !== undefined",
  "target_update_github_url: input.githubUrl !== undefined",
  'outcome.status === "conflict"',
  "PROFILE_CONFLICT_ERROR",
]) requireText(profileActions, marker, `Profile save can rewrite or lose an unchanged legacy link: ${marker}.`);
for (const marker of [
  "parseProfileActionEnvelope",
  "hasOnlyKnownFields",
  "singleString",
  "containsDisallowedTextControl",
  "isCanonicalProfileRevision",
  "resolveProfileActionInput",
  "candidate.raw === storedValue",
  "parseProfileMutationResult",
  "resolveProfileDisplayState",
]) requireText(profileActionInput, marker, `Strict profile action boundary lacks ${marker}.`);
for (const marker of [
  "PROFILE_EXPECTED_REVISION_FIELD",
  "profile.updated_at",
  "action={action}",
  "onSubmit={submit}",
  "event.preventDefault()",
  "submissionPending.current",
  "new FormData(event.currentTarget)",
  "startTransition(() => action(formData))",
  "setChangedSinceSubmit(true)",
  "resolveProfileDisplayState",
  'aria-busy={pending}',
  'aria-disabled={pending}',
  'aria-atomic="true"',
  'target="_blank"',
  'rel="noopener noreferrer"',
]) requireText(profileFormSource, marker, `Profile form lacks revision-safe draft behavior: ${marker}.`);
prohibit(profileFormSource, /\sdisabled=\{pending\}|key=\{state\.revision/, "Profile form can lose focus or remount its draft while saving.");
for (const marker of ['rpc("set_profile_display_name"', "parseProfileMutationResult(data, actor.user.id)"]) requireText(accountActions, marker, `Account display-name action bypasses the serialized profile writer: ${marker}.`);
prohibit(accountActions, /\.from\("profiles"\)[\s\S]{0,120}\.update\(\{ display_name/, "Account display-name action still writes the profile row directly.");
for (const marker of ['name="linkedin_url" type="url" inputMode="url" maxLength={500} aria-describedby="linkedin-url-help"', 'id="linkedin-url-help">Use a full HTTPS URL on linkedin.com.', 'name="github_url" type="url" inputMode="url" maxLength={500} aria-describedby="github-url-help"', 'id="github-url-help">Use a full HTTPS URL on github.com.']) requireText(profileFormSource, marker, `Profile professional-link input lacks its bound/help contract: ${marker}.`);
const profileHelpRule = globalStyles.match(/\.profile-form\s+\.form-group\s*>\s*small\s*\{([^}]*)\}/)?.[1];
const profileHelpFontSize = profileHelpRule?.match(/font-size:\s*([\d.]+)px/)?.[1];
if (!profileHelpFontSize || Number(profileHelpFontSize) < 13) failures.push("Profile field help text must remain readable at 13px or larger.");
requireText(publicProfilePage, "No supported professional links are available.", "Public profile does not describe a sanitized zero-link state honestly.");

for (const marker of [
  "create or replace function public.set_profile_updated_at()",
  "old.updated_at + interval '1 microsecond'",
  "create or replace function public.save_profile_if_revision(",
  "target_expected_updated_at timestamptz",
  "pg_catalog.hashtextextended('profile-owner:' || current_user_id::text, 0)",
  "profile.updated_at = target_expected_updated_at",
  "target_update_linkedin_url",
  "target_update_github_url",
  "create or replace function public.set_profile_display_name(",
  "revoke update on public.profiles from authenticated",
  "revoke update (",
  "grant execute on function public.save_profile_if_revision(",
  "grant execute on function public.set_profile_display_name(text)",
]) requireText(profileRevisionMigration, marker, `Revision-checked profile migration lacks ${marker}.`);

for (const marker of [
  "create or replace function public.enforce_profile_professional_urls()",
  "new.github_url is distinct from old.github_url",
  "new.linkedin_url is distinct from old.linkedin_url",
  "before insert or update of linkedin_url, github_url on public.profiles",
  "errcode = '23514', constraint = 'profiles_github_url_canonical'",
  "errcode = '23514', constraint = 'profiles_linkedin_url_canonical'",
  "revoke execute on function public.enforce_profile_professional_urls() from public, anon, authenticated",
  "create or replace function public.get_public_profile(profile_username text)",
  "security definer",
  "set search_path = ''",
  "revoke execute on function public.get_public_profile(text) from public, anon, authenticated",
  "grant execute on function public.get_public_profile(text) to anon, authenticated",
]) requireText(professionalLinkMigration, marker, `Professional-link migration is missing ${marker}.`);
prohibit(professionalLinkMigration, /\b(?:update|delete\s+from)\s+public\.profiles\b/i, "Professional-link migration destructively rewrites or deletes existing profile data.");
const publicRpcBlock = professionalLinkMigration.slice(professionalLinkMigration.indexOf("create or replace function public.get_public_profile"));
for (const marker of ["case", "profiles.github_url", "profiles.linkedin_url", "else null"]) requireText(publicRpcBlock, marker, `Public profile RPC does not independently mask unsafe legacy professional links: ${marker}.`);
for (const marker of [
  "anon cannot execute the professional URL trigger function",
  "authenticated cannot execute the professional URL trigger function",
  "profiles use the professional URL enforcement trigger",
  "a current full profile revision saves one coherent snapshot",
  "the profile RPC rejects a deceptive GitHub hostname",
  "the profile RPC rejects a cross-platform LinkedIn URL",
  "the profile RPC can preserve an unchanged legacy-invalid link during an unrelated edit",
  "a stale full save cannot erase the newer display name or rich profile fields",
  "authenticated cannot bypass profile RPCs with direct updates",
  "authenticated has no residual profile column-update grant",
  "a completed owner can intentionally remove the optional display name",
  "the public RPC masks a legacy-invalid GitHub URL",
  "the public RPC masks a legacy-invalid LinkedIn URL",
  "the public RPC preserves the safe legacy www GitHub alias",
  "the public RPC preserves the safe legacy bare LinkedIn alias",
]) requireText(profileDatabaseTest, marker, `Profile pgTAP coverage is missing ${marker}.`);

const env = read(".env.example");
for (const marker of ["NEXT_PUBLIC_SUPABASE_URL=", "NEXT_PUBLIC_SUPABASE_ANON_KEY=", "NEXT_PUBLIC_ACCOUNTS_ENABLED=false", "NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false", "NEXT_PUBLIC_GITHUB_AUTH_ENABLED=false"]) requireText(env, marker, `.env.example lacks ${marker}.`);
prohibit(env, /NEXT_PUBLIC_(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY)/i, ".env.example exposes a privileged Supabase secret to browser code.");

if (failures.length) {
  console.error(`Authentication foundation regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("Authentication foundation regression passed: email auth, recovery, reusable protection, stable auth navigation, live member dashboard data, profile RLS, and environment gating hold.");
