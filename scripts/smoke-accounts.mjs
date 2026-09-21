import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

// Explicit manual check: creates two isolated smoke accounts with reserved
// .invalid addresses and revokes every issued session. Never prints secrets.
const api = new URL(process.env.SMOKE_API_ORIGIN);
const web = new URL(process.env.SMOKE_WEB_ORIGIN);
assert.equal(api.protocol, "https:");
assert.equal(web.protocol, "https:");
const suffix = randomBytes(8).toString("hex");
const password = randomBytes(24).toString("base64url");
const accounts = ["web", "native"].map((kind) => ({
  name: `Smoke ${kind}`,
  email: `smoke-${kind}-${suffix}@example.invalid`,
  password,
  password_confirmation: password,
}));
const sessions = [];
let checks = 0;

async function request(path, { method = "GET", body, headers = {} } = {}) {
  return fetch(new URL(path, api), {
    method,
    headers: {
      accept: "application/json",
      ...headers,
      ...(body && { "content-type": "application/json" }),
    },
    body: body && JSON.stringify(body),
    redirect: "error",
    signal: AbortSignal.timeout(20000),
  });
}
function status(response, expected, label) {
  assert.equal(response.status, expected, `${label}: HTTP ${response.status}`);
  checks += 1;
}
const webHeaders = { origin: web.origin };
const nativeHeaders = { "x-xom-client": "native" };

try {
  status(await request("/up"), 200, "health");
  const topics = await request("/api/v1/topics");
  status(topics, 200, "topics and database");
  status(await request("/api/v1/me"), 401, "anonymous session");
  status(
    await request("/api/v1/users", {
      method: "POST",
      body: accounts[0],
      headers: { origin: "https://example.invalid" },
    }),
    403,
    "cross-origin registration",
  );

  const signup = await request("/api/v1/users", {
    method: "POST",
    body: accounts[0],
    headers: webHeaders,
  });
  status(signup, 201, "web registration");
  const { user: userA, token: leakedToken } = await signup.json();
  assert.equal(leakedToken, undefined);
  const setCookie = signup.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith("xom_session="));
  assert.ok(
    setCookie &&
      /httponly/i.test(setCookie) &&
      /secure/i.test(setCookie) &&
      /samesite=lax/i.test(setCookie),
  );
  assert.equal(signup.headers.get("cache-control"), "no-store");
  const cookieA = setCookie.split(";")[0];
  sessions.push({ ...webHeaders, cookie: cookieA });
  const restored = await request("/api/v1/me", {
    headers: { cookie: cookieA },
  });
  status(restored, 200, "web session restore");
  assert.equal((await restored.json()).id, userA.id);

  const nativeSignup = await request("/api/v1/users", {
    method: "POST",
    body: accounts[1],
    headers: nativeHeaders,
  });
  status(nativeSignup, 201, "native registration");
  const { user: userB, token } = await nativeSignup.json();
  assert.ok(token && userA.id !== userB.id);
  assert.equal(nativeSignup.headers.getSetCookie().length, 0);
  const nativeSession = { ...nativeHeaders, authorization: `Bearer ${token}` };
  sessions.push(nativeSession);

  status(
    await request("/api/v1/sessions", {
      method: "POST",
      body: { email: accounts[0].email, password: `${password}-wrong` },
      headers: webHeaders,
    }),
    401,
    "wrong password",
  );
  const login = await request("/api/v1/sessions", {
    method: "POST",
    body: accounts[0],
    headers: { ...webHeaders, cookie: cookieA },
  });
  status(login, 200, "web sign in");
  assert.equal((await login.json()).user.id, userA.id);
  const cookieB = login.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith("xom_session="))
    .split(";")[0];
  const webSession = { ...webHeaders, cookie: cookieB };
  sessions.push(webSession);
  status(
    await request("/api/v1/me", { headers: { cookie: cookieA } }),
    401,
    "old session revoked after rotation",
  );
  status(
    await request("/api/v1/session", { method: "DELETE", headers: webSession }),
    204,
    "web logout",
  );
  status(
    await request("/api/v1/me", { headers: { cookie: cookieB } }),
    401,
    "logged-out cookie revoked",
  );
  const isolated = await request("/api/v1/me", { headers: nativeSession });
  status(isolated, 200, "second user remains signed in");
  assert.equal((await isolated.json()).id, userB.id);
  status(
    await request("/api/v1/session", {
      method: "DELETE",
      headers: nativeSession,
    }),
    204,
    "native logout",
  );
  status(
    await request("/api/v1/me", { headers: nativeSession }),
    401,
    "native token revoked",
  );
  console.log(
    `PASS: ${checks} live HTTP checks; secure cookies, session rotation and user isolation verified.`,
  );
} finally {
  await Promise.allSettled(
    sessions.map((headers) =>
      request("/api/v1/session", { method: "DELETE", headers }),
    ),
  );
}
