import { ProductionEngineeringLesson } from "./shared";

const oauthFlow = `sequenceDiagram
  participant U as User agent
  participant C as Client
  participant A as Authorization server
  participant R as Resource server
  C->>U: start authorization with state and PKCE challenge
  U->>A: authenticate and grant consent
  A-->>U: authorization code
  U-->>C: code and returned state
  C->>A: code and PKCE verifier
  A-->>C: access token and optional ID token
  C->>R: access token
  R-->>C: authorized resource response`;

export function AuthnAuthzLessonContent() { return <ProductionEngineeringLesson spec={{
  id: "authn-authz",
  mentalModel: "Authentication establishes which principal is making a request. Authorization decides whether that principal may perform this action on this resource in this context. Identity data is an input to policy, not proof that every resource is accessible.",
  mechanism: ["Authenticate at a defined trust boundary and obtain a validated principal and session context.", "Resolve the requested action and authoritative resource, including its tenant and ownership.", "Evaluate deny-by-default policy using current attributes and relationships.", "Enforce the decision at every server-side entry point and downstream data boundary, not only in navigation.", "Record a safe decision audit with policy version and reason while keeping credentials and sensitive attributes out of logs."],
  example: { title: "A signed-in user requests another tenant's invoice", body: "The session is valid, so authentication succeeds. Authorization loads the invoice's tenant from the authoritative record, compares membership and role, and denies access before returning any invoice fields.", consequence: "Keep tenant/resource lookup inside the authorization boundary and test object-level access independently of UI visibility." },
  tradeoffs: [{ option: "Role-based policy", chooseWhen: "Permissions align with a small stable set of job functions.", cost: "Roles become coarse or multiply when context matters." }, { option: "Attribute or relationship policy", chooseWhen: "Ownership, tenant, resource state, or delegation changes access.", cost: "Policy evaluation and explainability become more complex." }, { option: "Central policy decision", chooseWhen: "Many services need consistent policy logic.", cost: "Enforcement still belongs at each service and policy availability becomes critical." }],
  failure: { failure: "The API trusts a tenant ID supplied by the client after login.", impact: "An authenticated user can select another tenant and access its objects.", detection: "Negative authorization tests succeed when only the tenant or object identifier changes.", mitigation: "Derive tenant membership from trusted identity and load resource ownership server-side; deny by default.", tradeoff: "Authoritative checks add data access and caching decisions to the request path." },
  exercise: ["For read, update, export, and delete, name the principal, action, resource, tenant, and context.", "Write a negative test for cross-user, cross-tenant, stale-role, and direct-object access.", "Mark where policy is decided, enforced, cached, audited, and invalidated."],
  probes: ["What is authenticated, and what is separately authorized?", "Where does resource ownership come from?", "How are role changes and revoked access reflected in caches?", "How do background jobs carry a constrained service identity?"],
  levelCalibration: [{ level: "SDE I–II", evidence: "Separate identity validation from resource authorization and test denied paths." }, { level: "Senior", evidence: "Model tenant, ownership, delegated access, caching, revocation, and audit boundaries." }, { level: "Staff", evidence: "Define policy and enforcement contracts across services without creating one implicit superuser path." }],
  practice: ["api-gateway-system", "cloud-file-storage", "payment-system"],
  remember: "A valid identity does not grant a resource. Authorize the action against authoritative resource and tenant state at every server-side boundary.",
  note: "Threat model assets, actors, entry points, trust boundaries, abuse paths, and recovery before selecting controls. Include compromised sessions, confused service identities, support tooling, exports, and asynchronous workers—not only the public API.",
}} />; }

export function SessionsTokensLessonContent() { return <ProductionEngineeringLesson spec={{
  id: "sessions-tokens",
  mentalModel: "A session is a server-recognized continuity of authentication. A token is a credential or assertion carried between parties. Either can be stateful or partly self-contained; the design decision is where authority, revocation, rotation, and context live.",
  mechanism: ["Create a session only after authentication and rotate its identifier across privilege changes.", "Bind server-side state to the principal, authentication time, assurance, expiry, and revocation status.", "Send browser credentials with secure transport and cookie attributes appropriate to the interaction.", "Recheck authorization from current resource policy rather than embedding every permission indefinitely.", "Expire idle and absolute lifetimes, revoke on risk events, and protect recovery and logout paths."],
  example: { title: "Choose a server session for an admin console", body: "A random opaque cookie indexes server-side session state. Role changes and forced logout take effect through current session and authorization checks; the browser never receives the role database as trusted state.", consequence: "Accept a session lookup on sensitive requests in exchange for centralized revocation and concise browser credentials." },
  tradeoffs: [{ option: "Opaque session identifier", chooseWhen: "Fast revocation and server-controlled context matter.", cost: "Requests need a highly available session lookup or cache." }, { option: "Self-contained signed token", chooseWhen: "Many resource servers need locally verifiable, short-lived assertions.", cost: "Revocation and stale claims are harder; keys and validation rules must be coordinated." }, { option: "Long lifetime", chooseWhen: "Only when product risk and reauthentication cost justify it.", cost: "A stolen credential remains useful longer." }],
  failure: { failure: "A privileged session ID is not rotated after login or role elevation.", impact: "An attacker who fixed or stole the earlier identifier can inherit the elevated session.", detection: "Session tests observe the same identifier before and after the privilege boundary.", mitigation: "Rotate the identifier, invalidate the prior state, and retain only explicitly safe continuity data.", tradeoff: "Rotation complicates concurrent devices and in-flight requests." },
  exercise: ["Compare session lookup, expiry, revocation, and authorization freshness for two credential models.", "Define idle, absolute, and refresh lifetimes for a low-risk and privileged surface.", "Write logout, password-reset, role-change, and device-loss behavior."],
  probes: ["Where does revocation state live?", "What changes after privilege elevation?", "Which browser storage and cookie protections apply?", "How quickly does a permission change take effect?"],
  practice: ["api-gateway-system", "cloud-file-storage"],
  remember: "Choose session and token mechanics from revocation, freshness, trust, and client constraints. Keep authorization current even when authentication state is portable.",
}} />; }

export function JwtLessonContent() { return <ProductionEngineeringLesson spec={{
  id: "jwt",
  mentalModel: "A JWT is a compact claims representation that an application profile may sign or MAC as JWS, encrypt as JWE, or explicitly leave unsecured. A signed JWT is normally readable, not encrypted. Its safety depends on accepting only the intended protection profile and strictly validating issuer, audience, algorithm, key, time, and claims—not on decoding successfully.",
  mechanism: ["Accept a token only from the expected transport and credential location.", "Parse defensively and allowlist the intended cryptographic algorithm and token type.", "Resolve trusted keys for the expected issuer and verify the signature.", "Validate issuer, audience, expiry, not-before, and required subject or authorization context.", "Use short lifetimes and current resource authorization; rotate keys with overlap and rollback procedures."],
  example: { title: "A resource API validates an access token", body: "The API expects issuer A, audience orders-api, an access-token type, and a short expiry. A valid signature from issuer A for audience analytics-api is rejected, as is an ID token presented as an access token.", consequence: "Treat token purpose and audience as security boundaries, not optional informational claims." },
  tradeoffs: [{ option: "Local JWT validation", chooseWhen: "Resource servers need low-latency verification without a lookup per request.", cost: "Revocation and stale claims persist until expiry or an added deny mechanism." }, { option: "Opaque token introspection", chooseWhen: "Central current-state checks outweigh the extra dependency.", cost: "Latency and availability depend on the introspection service." }, { option: "Large embedded claims", chooseWhen: "Rarely; only stable necessary context belongs in the token.", cost: "Credentials grow, leak more information, and become stale." }],
  failure: { failure: "An API verifies the signature but ignores audience and token purpose.", impact: "A token issued for another service or as an identity assertion can be replayed as API authorization.", detection: "Negative tests show wrong-audience or wrong-type tokens are accepted.", mitigation: "Validate the complete token profile, including issuer, audience, algorithm, time, and purpose-specific claims.", tradeoff: "Strict profiles require coordinated configuration and migration across issuers and consumers." },
  exercise: ["List every check before one token can authorize one endpoint.", "Separate safe stable claims from resource permissions that need current lookup.", "Design key rotation with overlapping validation, monitoring, and rollback."],
  probes: ["Is the payload confidential?", "What distinguishes this token from an ID token?", "How does revocation work before expiry?", "What happens during key rotation or issuer outage?"],
  practice: ["api-gateway-system", "webhook-delivery"],
  remember: "A JWT is a format, not an authorization system. Verify a strict token profile and evaluate current resource policy separately.",
}} />; }

export function OAuthOidcLessonContent() { return <ProductionEngineeringLesson spec={{
  id: "oauth-oidc",
  mentalModel: "OAuth delegates access to a protected resource; OpenID Connect adds an identity layer for authentication. The authorization server, client, resource server, user agent, access token, and ID token have different roles and trust boundaries.",
  mechanism: ["Register exact client and redirect metadata and choose a flow for the client type.", "Send the user to the authorization server with state and an authorization-code PKCE challenge.", "Validate the returned state, then exchange the code using the verifier over TLS.", "Validate an ID token only for the client and use an access token only at its intended resource server.", "Constrain scope, audience, lifetime, refresh, revocation, and storage; apply current OAuth security guidance."],
  diagram: { chart: oauthFlow, title: "Authorization code flow with PKCE", description: "A client sends a user to an authorization server with state and a PKCE challenge. The client validates the returned state, exchanges the authorization code with the verifier, and sends the resulting access token only to the intended resource server." },
  example: { title: "Sign in and read a calendar are separate grants", body: "OpenID Connect lets the client establish the user's identity using the ID token. An audience- and scope-constrained access token authorizes the calendar API. The API does not accept the ID token as its access credential.", consequence: "Model identity and delegated API access separately, even when one authorization response carries artifacts for both." },
  tradeoffs: [{ option: "Authorization code with PKCE", chooseWhen: "A browser or native client delegates user access.", cost: "Redirect, state, verifier, token storage, and refresh handling must be correct." }, { option: "Short access tokens", chooseWhen: "Limit replay duration and stale authorization.", cost: "Refresh paths and authorization-server availability matter more." }, { option: "Broad scopes", chooseWhen: "Avoid; request only product-required access.", cost: "Overbroad grants increase breach impact and user distrust." }],
  failure: { failure: "A client accepts an authorization response without correlating state or redirect context.", impact: "Login CSRF, response injection, or authorization-code substitution can bind the wrong authorization result.", detection: "Flow tests accept missing, mismatched, replayed, or cross-client state.", mitigation: "Use exact redirect matching, one-time state, PKCE, issuer/client checks, and the current OAuth security profile.", tradeoff: "More correlation state and rejection paths complicate client implementation." },
  exercise: ["Label every actor and artifact in the diagram and state who may consume it.", "Write validation checks for state, code exchange, access token, and ID token.", "Reduce requested scope and token lifetime for a concrete product action."],
  probes: ["What is OAuth delegating?", "What does OpenID Connect add?", "Why can the resource server reject a correctly signed token?", "How are refresh-token theft and redirect attacks contained?"],
  practice: ["api-gateway-system", "cloud-file-storage"],
  remember: "OAuth delegates resource access; OpenID Connect communicates authentication. Keep actors, artifacts, audience, scope, and validation responsibilities explicit.",
}} />; }
