import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoApi } from "../src/demo-client";
import { HttpCommunityApi, ApiError } from "../src/http-client";

test("repeated absolute votes are idempotent and reversal adjusts score by two", async () => {
  const api = createDemoApi();
  await api.signIn("", "");
  const original = (await api.feed()).data[0];
  assert.equal((await api.vote(original.id, 1)).score, original.score + 1);
  assert.equal((await api.vote(original.id, 1)).score, original.score + 1);
  assert.equal((await api.vote(original.id, -1)).score, original.score - 1);
  assert.equal((await api.vote(original.id, 0)).score, original.score);
});
test("unauthenticated creation and invalid votes cannot mutate state", async () => {
  const api = createDemoApi();
  const original = (await api.feed()).data[0];
  await assert.rejects(
    api.createPost({ title: "Một câu chuyện", topicSlug: "hai-huoc" }),
  );
  await assert.rejects(api.vote(original.id, 1));
  assert.equal((await api.post(original.id)).score, original.score);
  await api.signIn("", "");
  await assert.rejects(api.vote(original.id, 2 as 1));
});
test("publishing, commenting, topic search and bookmark filtering share one source of truth", async () => {
  const api = createDemoApi();
  await api.signIn("", "");
  const post = await api.createPost({
    title: "Ruby và một ngày bình yên",
    topicSlug: "cong-nghe",
  });
  await api.comment(post.id, "Bài đầu tiên của xóm!");
  await api.save(post.id, true);
  const saved = await api.feed({
    saved: true,
    topic: "cong-nghe",
    query: "Ruby",
  });
  assert.equal(saved.data.length, 1);
  assert.equal(saved.data[0].commentCount, 1);
  assert.equal((await api.comments(post.id)).length, 1);
  saved.data[0].title = "external mutation";
  assert.equal((await api.post(post.id)).title, post.title);
  await api.save(post.id, false);
  assert.equal((await api.feed({ saved: true })).data.length, 0);
});
test("HTTP adapter uses browser cookies and does not silently fall back to demo on API failure", async () => {
  const original = global.fetch;
  const requests: RequestInit[] = [];
  global.fetch = async (_url, options) => {
    requests.push(options!);
    return new Response(
      JSON.stringify({ error: { message: "Service unavailable" } }),
      { status: 503 },
    );
  };
  try {
    await assert.rejects(
      new HttpCommunityApi("https://api.example.test").feed(),
      (e: unknown) => e instanceof ApiError && e.status === 503,
    );
    assert.equal(requests[0].credentials, "include");
    assert.equal(
      (requests[0].headers as Record<string, string>).Authorization,
      undefined,
    );
  } finally {
    global.fetch = original;
  }
});
test("native adapter sends bearer authentication, identifies native requests and clears secure token on logout", async () => {
  const original = global.fetch;
  let stored: string | null = "opaque-test-token";
  let captured: RequestInit | undefined;
  global.fetch = async (_url, options) => {
    captured = options;
    return new Response(null, { status: 204 });
  };
  try {
    const api = new HttpCommunityApi("https://api.example.test", {
      get: async () => stored,
      set: async (v) => {
        stored = v;
      },
    });
    await api.signOut();
    assert.equal(captured?.credentials, "omit");
    assert.equal(
      (captured?.headers as Record<string, string>).Authorization,
      "Bearer opaque-test-token",
    );
    assert.equal(
      (captured?.headers as Record<string, string>)["X-Xom-Client"],
      "native",
    );
    assert.equal(stored, null);
  } finally {
    global.fetch = original;
  }
});
