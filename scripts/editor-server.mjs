import { createReadStream, existsSync, promises as fs } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EDITABLE_DIR = path.join(ROOT_DIR, "configs", "editable");
const PORT = Number(process.env.PORT || process.argv[2] || 8000);
const HOST = process.env.HOST || "127.0.0.1";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
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

async function readJsonRequest(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function saveConfig(request, response) {
  let payload;
  try {
    payload = await readJsonRequest(request);
  } catch {
    send(response, 400, "Invalid JSON");
    return;
  }

  const filename = path.basename(String(payload.path || ""));
  if (!/^[a-z0-9-]+__[a-z0-9-]+__layout-[abc]\.json$/i.test(filename)) {
    send(response, 400, "Invalid config filename");
    return;
  }

  const targetPath = path.join(EDITABLE_DIR, filename);
  const resolvedTarget = path.resolve(targetPath);
  if (!resolvedTarget.startsWith(`${EDITABLE_DIR}${path.sep}`)) {
    send(response, 400, "Invalid config path");
    return;
  }

  try {
    await fs.mkdir(EDITABLE_DIR, { recursive: true });
    await fs.writeFile(resolvedTarget, `${JSON.stringify(payload.config, null, 2)}\n`);
  } catch (error) {
    send(response, 500, error.message);
    return;
  }

  send(response, 200, JSON.stringify({ ok: true, path: `configs/editable/${filename}` }), {
    "Content-Type": "application/json; charset=utf-8",
  });
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
  if (request.method === "POST" && request.url === "/__save-config") {
    saveConfig(request, response);
    return;
  }

  if (request.method === "GET" || request.method === "HEAD") {
    serveStatic(request, response);
    return;
  }

  send(response, 405, "Method not allowed");
});

server.listen(PORT, HOST, () => {
  console.log(`Editor server running at http://${HOST}:${PORT}/`);
  console.log("Config saves are written to configs/editable/.");
});
