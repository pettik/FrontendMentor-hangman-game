import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const args = process.argv.slice(2);
const root = resolve(args.includes("--dist") ? "dist" : "starter-code");
const portIndex = args.indexOf("--port");
const port = Number(portIndex >= 0 ? args[portIndex + 1] : process.env.PORT || 5173);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ttf": "font/ttf" };

const server = createServer(async (request, response) => {
  try {
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    const url = new URL(request.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    let file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + sep)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    const body = await readFile(file);
    response.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404).end("Not found");
  }
});
server.listen(port, "127.0.0.1", () => console.log(`Hangman ready at http://127.0.0.1:${port}`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
