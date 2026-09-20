import { loadPrism } from "@ruby/prism";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
const parse = await loadPrism();
function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const p = join(directory, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = walk("apps/api").filter(
  (p) =>
    p.endsWith(".rb") ||
    /\/(Gemfile|Rakefile|config.ru|rails|outbox-relay)$/.test(p),
);
let errors = 0;
for (const file of files) {
  const result = parse(readFileSync(file, "utf8"));
  if (result.errors.length) {
    errors += result.errors.length;
    console.error(file, result.errors);
  }
}
console.log(
  `${files.length} Ruby files parsed; ${errors} syntax errors. This is syntax validation, not a Rails runtime test.`,
);
process.exitCode = errors ? 1 : 0;
