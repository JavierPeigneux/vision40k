const COUNTER_BINDING = "VISIT_COUNTER";
const VISIT_KEY = "site-total";
const VISIT_COOKIE = "vision40k_visited";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function createJsonResponse(payload, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");

  return new Response(JSON.stringify(payload), {
    ...init,
    headers,
  });
}

function getCounterStore(env) {
  return env?.[COUNTER_BINDING] ?? null;
}

async function readCount(store) {
  const rawValue = await store.get(VISIT_KEY);
  const count = Number.parseInt(rawValue ?? "0", 10);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function hasVisitCookie(request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .includes(`${VISIT_COOKIE}=1`);
}

function createVisitCookie(request) {
  const { protocol } = new URL(request.url);
  const secure = protocol === "https:" ? "; Secure" : "";
  return `${VISIT_COOKIE}=1; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

async function getCurrentCount(context) {
  const store = getCounterStore(context.env);

  if (!store) {
    return createJsonResponse({
      enabled: false,
      count: null,
      message: `${COUNTER_BINDING} binding is not configured.`,
    });
  }

  const count = await readCount(store);
  return createJsonResponse({ enabled: true, count });
}

export async function onRequestGet(context) {
  return getCurrentCount(context);
}

export async function onRequestPost(context) {
  const store = getCounterStore(context.env);

  if (!store) {
    return createJsonResponse({
      enabled: false,
      count: null,
      message: `${COUNTER_BINDING} binding is not configured.`,
    });
  }

  let count = await readCount(store);
  const headers = new Headers();

  if (!hasVisitCookie(context.request)) {
    count += 1;
    await store.put(VISIT_KEY, String(count));
    headers.set("set-cookie", createVisitCookie(context.request));
  }

  return createJsonResponse({ enabled: true, count }, { headers });
}
