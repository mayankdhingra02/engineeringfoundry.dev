import { createServerClient } from "@supabase/ssr";

const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!apiUrl || !publishableKey) throw new Error("Local Supabase public environment is not configured.");
if (!/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(apiUrl)) {
  throw new Error("Refusing to run cache qualification against a non-local Supabase project.");
}

let cookies = [];
const supabase = createServerClient(apiUrl, publishableKey, {
  cookies: {
    getAll: () => cookies,
    setAll: (cookiesToSet) => {
      const names = new Set(cookiesToSet.map((cookie) => cookie.name));
      cookies = [...cookies.filter((cookie) => !names.has(cookie.name)), ...cookiesToSet];
    },
  },
});

const signIn = await supabase.auth.signInWithPassword({
  email: "qualification-b@example.test",
  password: "Qualification123!",
});

if (signIn.error || !signIn.data.session || cookies.length === 0) {
  throw new Error(`Local sign-in did not produce an SSR cookie session: ${signIn.error?.message ?? "no cookies"}`);
}

console.log("PASS  short-lived local SSR session created; waiting for token expiry");
await new Promise((resolve) => setTimeout(resolve, 65_000));

const response = await fetch("http://localhost:3000/dashboard", {
  headers: { Cookie: cookies.map(({ name, value }) => `${name}=${value}`).join("; ") },
  redirect: "manual",
});

const observed = {
  status: response.status,
  setCookiePresent: response.headers.has("set-cookie"),
  cacheControl: response.headers.get("cache-control"),
  pragma: response.headers.get("pragma"),
  expires: response.headers.get("expires"),
};

console.log(`OBSERVED ${JSON.stringify(observed)}`);

if (!observed.setCookiePresent) throw new Error("Proxy response did not refresh the expired session cookie.");
if (!observed.cacheControl || !/private/i.test(observed.cacheControl) || !/no-store/i.test(observed.cacheControl)) {
  throw new Error("Proxy response did not preserve a private, no-store Cache-Control policy.");
}
if (!observed.pragma || !/no-cache/i.test(observed.pragma)) {
  throw new Error("Proxy response did not preserve Supabase's Pragma header.");
}
if (observed.expires !== "0") throw new Error("Proxy response did not preserve Supabase's Expires header.");

console.log("PASS  expired local session refreshed with Supabase cache-safety headers");
