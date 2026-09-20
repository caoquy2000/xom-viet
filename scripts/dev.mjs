import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createGateway } from "../infrastructure/sites/gateway.mjs";
const require = createRequire(import.meta.url);
const received = process.argv.slice(2);
const value = (flag, fallback) =>
  received.includes(flag) ? received[received.indexOf(flag) + 1] : fallback;
// The managed preview passes --strictPort. Serve the exact production export
// there; regular local development keeps Next.js and its hot reload workflow.
if (received.includes("--strictPort")) {
  const root = resolve("out");
  await readFile(resolve(root, "index.html"));
  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
  };
  const { apiOrigin } = JSON.parse(
    await readFile("infrastructure/sites/deployment.json", "utf8"),
  );
  const gateway = createGateway({
    apiOrigin,
    assets: () => new Response("Not found", { status: 404 }),
  });
  const server = createServer(async (request, response) => {
    if (request.url.startsWith("/api/v1/")) {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const result = await gateway(
        new Request(url, {
          method: request.method,
          headers: request.headers,
          body: ["GET", "HEAD"].includes(request.method) ? undefined : request,
          duplex: "half",
        }),
      );
      response.writeHead(result.status, Object.fromEntries(result.headers));
      response.end(Buffer.from(await result.arrayBuffer()));
      return;
    }
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405);
      response.end();
      return;
    }
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      const path = resolve(
        root,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
      if (!path.startsWith(root + sep)) {
        response.writeHead(403);
        response.end();
        return;
      }
      const file = await readFile(path);
      response.writeHead(200, {
        "Content-Type": types[extname(path)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      response.end(request.method === "HEAD" ? undefined : file);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  server.listen(Number(value("--port", "4173")), value("--host", "0.0.0.0"));
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => server.close(() => process.exit(0)));
} else {
  const child = spawn(
    process.execPath,
    [
      require.resolve("next/dist/bin/next"),
      "dev",
      "apps/web",
      "--webpack",
      "--hostname",
      value("--host", "0.0.0.0"),
      "--port",
      value("--port", "4173"),
    ],
    { stdio: "inherit" },
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => child.kill(signal));
  child.on("exit", (code) => process.exit(code ?? 1));
}
