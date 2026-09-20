import { test } from "node:test";
import assert from "node:assert/strict";
import { SessionStore } from "../src/session-store";
import { registrationError } from "../src/auth-validation";
import { HttpCommunityApi, ApiError } from "../src/http-client";
import type { AuthApi, User } from "../src/types";
const first: User = { id: "1", name: "First", username: "first", avatar: "🐱" };
const second: User = { id: "2", name: "Second", username: "second", avatar: "🐶" };
function fake(overrides: Partial<AuthApi> = {}): AuthApi {
  return { currentUser: async () => null, signIn: async () => first, signUp: async () => first, signOut: async () => {}, ...overrides };
}
test("a slow session restore cannot overwrite a newer login", async () => {
  let resolve!: (user: User | null) => void;
  const store = new SessionStore(fake({ currentUser: () => new Promise(r => { resolve = r; }) }));
  const restoring = store.restore();
  await store.signIn("first@example.test", "test-password");
  resolve(null); await restoring;
  assert.equal(store.getSnapshot().user?.id, "1");
  assert.equal(store.getSnapshot().status, "authenticated");
});
test("login, logout and another user invalidate private feed state", async () => {
  let signedIn = first;
  const store = new SessionStore(fake({ signIn: async () => signedIn }));
  await store.restore(); await store.signIn("", "");
  const revision = store.getSnapshot().revision;
  await store.signOut();
  assert.equal(store.getSnapshot().user, null);
  assert.ok(store.getSnapshot().revision > revision);
  signedIn = second; await store.signIn("", "");
  assert.equal(store.getSnapshot().user?.id, "2");
});
test("a failed logout keeps the authenticated user visible and can be retried", async () => {
  const store = new SessionStore(fake({ signOut: async () => { throw new Error("Network unavailable"); } }));
  await store.signIn("", "");
  await assert.rejects(store.signOut());
  assert.equal(store.getSnapshot().user?.id, "1");
  assert.equal(store.getSnapshot().busy, false);
});
test("concurrent auth submissions cannot race session state", async () => {
  let release!: (user: User) => void;
  const store = new SessionStore(fake({ signIn: () => new Promise(r => { release = r; }) }));
  const pending = store.signIn("", "");
  await assert.rejects(store.signOut());
  release(first); await pending;
  assert.equal(store.getSnapshot().user?.id, "1");
});
test("password validation includes confirmation and BCrypt UTF-8 byte limit", () => {
  assert.equal(registrationError("Hàng Xóm", "me@example.test", "correct-horse-password", "correct-horse-password"), null);
  assert.match(registrationError("Hàng Xóm", "me@example.test", "correct-horse-password", "wrong")!, /khớp/);
  assert.match(registrationError("Hàng Xóm", "me@example.test", "🔐".repeat(24), "🔐".repeat(24))!, /72 byte/);
});
test("browser authentication sends confirmation without exposing a bearer token", async () => {
  const original = global.fetch;
  let captured: RequestInit | undefined;
  global.fetch = async (_url, options) => { captured = options; return Response.json({ user: first }); };
  try {
    await new HttpCommunityApi("https://api.example.test").signUp("First", "first@example.test", "password-long-enough", "confirmation");
    assert.equal(captured?.credentials, "include");
    assert.equal(JSON.parse(captured?.body as string).password_confirmation, "confirmation");
    assert.equal((captured?.headers as Record<string,string>).Authorization, undefined);
  } finally { global.fetch = original; }
});
test("expired native credentials are removed; server failure is not treated as logout", async () => {
  const original = global.fetch; let token: string | null = "expired";
  const api = new HttpCommunityApi("https://api.example.test", { get: async () => token, set: async value => { token = value; } });
  try {
    global.fetch = async () => Response.json({ error: { message: "Expired" } }, { status: 401 });
    assert.equal(await api.currentUser(), null); assert.equal(token, null);
    token = "valid";
    global.fetch = async () => Response.json({ error: { message: "Unavailable" } }, { status: 503 });
    await assert.rejects(api.signOut(), e => e instanceof ApiError && e.status === 503);
    assert.equal(token, "valid");
  } finally { global.fetch = original; }
});
