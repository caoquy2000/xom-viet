import { spawnSync } from "node:child_process";

// The published Site always talks to Rails through its same-origin gateway.
// Local `npm run dev` still supports the explicitly labelled offline demo.
for (const [command, args] of [
  ["npm", ["run", "build", "--workspace", "@xom/web"]],
  [process.execPath, ["scripts/export-web.mjs"]],
  [process.execPath, ["scripts/build-site-gateway.mjs"]],
]) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, NEXT_PUBLIC_API_URL: "" },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
