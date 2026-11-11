import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("starter-code");
const output = resolve("dist");
await mkdir(output, { recursive: true });
for (const file of ["index.html", "styles.css", "data.json", "js", "assets"]) {
  await cp(resolve(source, file), resolve(output, file), { recursive: true, force: true });
}
console.log("Production files are ready in dist/ (no runtime dependencies).");
