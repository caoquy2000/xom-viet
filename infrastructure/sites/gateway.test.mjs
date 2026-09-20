import { test } from "node:test";
import assert from "node:assert/strict";
import { createGateway } from "./gateway.mjs";

const origin = "https://xom.example";
test("gateway forwards only application cookies and preserves secure session cookies", async () => {
  const handle = createGateway({
    apiOrigin: "https://api.example",
    assets: () => new Response("asset"),
    fetchUpstream: async (url, init) => {
      assert.equal(url.href, "https://api.example/api/v1/users");
      assert.equal(init.headers.get("cookie"), "xom_session=old");
      assert.equal(init.headers.get("oai-authenticated-user-email"), null);
      assert.equal(init.headers.get("authorization"), null);
      assert.equal(init.headers.get("x-xom-client"), null);
      return Response.json(
        { user: { id: "one" } },
        {
          status: 201,
          headers: {
            "Set-Cookie":
              "xom_session=new; Path=/; HttpOnly; Secure; SameSite=Lax",
          },
        },
      );
    },
  });
  const response = await handle(
    new Request(origin + "/api/v1/users", {
      method: "POST",
      body: "{}",
      headers: {
        origin,
        cookie: "sites_secret=private; xom_session=old",
        "oai-authenticated-user-email": "private@example.test",
        authorization: "Bearer private",
        "X-Xom-Client": "native",
      },
    }),
  );
  assert.equal(response.status, 201);
  assert.match(
    response.headers.get("set-cookie"),
    /HttpOnly; Secure; SameSite=Lax/,
  );
  assert.equal(response.headers.get("cache-control"), "no-store");
});
test("gateway rejects missing or foreign origins, even when a native header is supplied", async () => {
  const handle = createGateway({
    apiOrigin: "https://api.example",
    assets: () => new Response("asset"),
    fetchUpstream: () => assert.fail("must not forward hostile writes"),
  });
  for (const headers of [
    {},
    { origin: "https://evil.example" },
    { origin, "sec-fetch-site": "cross-site" },
  ]) {
    const response = await handle(
      new Request(origin + "/api/v1/sessions", {
        method: "POST",
        headers: { ...headers, "X-Xom-Client": "native" },
      }),
    );
    assert.equal(response.status, 403);
  }
});
test("upstream failures are explicit and never fall back to demo accounts", async () => {
  const handle = createGateway({
    apiOrigin: "https://api.example",
    assets: () => new Response("asset"),
    fetchUpstream: () => {
      throw new Error("offline");
    },
  });
  assert.equal((await handle(new Request(origin + "/api/v1/me"))).status, 503);
  assert.equal(await (await handle(new Request(origin + "/"))).text(), "asset");
});
