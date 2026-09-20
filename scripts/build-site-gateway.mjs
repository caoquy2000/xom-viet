import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";

const { apiOrigin } = JSON.parse(
  await readFile("infrastructure/sites/deployment.json", "utf8"),
);
const gateway = await readFile("infrastructure/sites/gateway.mjs", "utf8");
await rm("dist", { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await cp("out", "dist/client", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
await writeFile(
  "dist/server/index.js",
  `${gateway}\nexport default { fetch(request, env) {\n  return createGateway({ apiOrigin: ${JSON.stringify(apiOrigin)}, assets: (request) => env.ASSETS.fetch(request) })(request);\n} };\n`,
);
