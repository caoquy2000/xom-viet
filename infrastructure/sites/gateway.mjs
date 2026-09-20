const API_PREFIX = "/api/v1/";

/** Transport adapter only: Rails owns all account and community business rules. */
export function createGateway({ apiOrigin, assets, fetchUpstream = fetch }) {
  const upstream = new URL(apiOrigin);
  if (upstream.protocol !== "https:" || upstream.username || upstream.password)
    throw new Error("The Rails upstream must be a public HTTPS origin.");

  return async function handle(request) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith(API_PREFIX)) return assets(request);
    const write = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    if (
      write &&
      (request.headers.get("origin") !== url.origin ||
        request.headers.get("sec-fetch-site") === "cross-site")
    ) {
      return Response.json(
        {
          error: {
            code: "invalid_origin",
            message: "Nguồn yêu cầu không hợp lệ.",
          },
        },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }
    // Explicit allowlist prevents Sites sign-in cookies/identity headers from
    // being disclosed to the external Rails host. Native clients use Rails directly.
    const headers = new Headers();
    for (const name of ["accept", "content-type", "origin"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const cookie = request.headers
      .get("cookie")
      ?.split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith("xom_session="));
    if (cookie) headers.set("cookie", cookie);
    try {
      const response = await fetchUpstream(
        new URL(url.pathname + url.search, upstream),
        {
          method: request.method,
          headers,
          body: write ? request.body : undefined,
          redirect: "manual",
          signal: AbortSignal.timeout(20000),
          // Node's local preview requires duplex for streamed request bodies.
          duplex: "half",
        },
      );
      const resultHeaders = new Headers();
      for (const name of ["content-type", "retry-after", "x-request-id"]) {
        const value = response.headers.get(name);
        if (value) resultHeaders.set(name, value);
      }
      for (const value of response.headers.getSetCookie()) {
        if (value.startsWith("xom_session="))
          resultHeaders.append("set-cookie", value);
      }
      resultHeaders.set("cache-control", "no-store");
      return new Response(response.body, {
        status: response.status,
        headers: resultHeaders,
      });
    } catch {
      return Response.json(
        {
          error: {
            code: "service_unavailable",
            message: "Chưa kết nối được với Xóm. Bạn thử lại sau nhé.",
          },
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
  };
}
