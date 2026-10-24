import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || process.argv[2] || 8000);
const HOST = process.env.HOST || "127.0.0.1";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".mjs": "application/javascript; charset=utf-8",
};

function send(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    ...headers,
  });
  response.end(body);
}

function getStaticPath(url) {
  const pathname = decodeURIComponent(url.pathname);
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const resolvedPath = path.resolve(ROOT_DIR, relativePath);
  if (!resolvedPath.startsWith(`${ROOT_DIR}${path.sep}`) && resolvedPath !== ROOT_DIR) {
    return null;
  }
  return resolvedPath;
}

function serveStatic(request, response) {
  const url = new URL(request.url, `http://${HOST}:${PORT}`);
  const staticPath = getStaticPath(url);
  if (!staticPath || !existsSync(staticPath)) {
    send(response, 404, "Not found");
    return;
  }

  const extension = path.extname(staticPath);
  response.writeHead(200, {
    "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  createReadStream(staticPath).pipe(response);
}

const server = createServer((request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) {
    send(response, 405, "Read-only static server", { Allow: "GET, HEAD" });
    return;
  }
  serveStatic(request, response);
});
server.listen(PORT, HOST, () => console.log(`Vision40K: http://${HOST}:${PORT}`));
