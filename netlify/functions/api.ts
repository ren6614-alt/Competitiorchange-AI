import serverless from "serverless-http";
import { app } from "../../src/server/app.ts";

const serverlessHandler = serverless(app);

const NETLIFY_FUNCTION_PREFIX = "/.netlify/functions/api";

export interface ResolvedRouteInfo {
  normalizedPath: string;
  originalEventPath?: string;
  rawPath?: string;
  rawUrl?: string;
  url?: string;
}

/**
 * Extracts and normalizes the target API route from all possible Netlify/AWS Lambda
 * event properties (event.path, event.rawPath, event.rawUrl, event.url).
 *
 * Rules:
 * 1. Inspects rawUrl first, as it retains the client's original URL (e.g. /api/health)
 *    before internal Netlify proxy rewriting.
 * 2. Correctly handles Netlify's rewrite: /api/* -> /.netlify/functions/api/:splat
 * 3. Correctly strips ONLY the Netlify function prefix: /.netlify/functions/api,
 *    preserving the path following it (e.g. /health -> /api/health).
 * 4. Ensures the Express app receives /api/* (e.g. /api/health, /api/auth/me, /api/projects).
 * 5. NEVER collapses or strips the path to "/".
 */
export function resolveApiRoute(event: any): ResolvedRouteInfo {
  const originalEventPath = typeof event?.path === "string" ? event.path : undefined;
  const rawPath = typeof event?.rawPath === "string" ? event.rawPath : undefined;
  const rawUrl = typeof event?.rawUrl === "string" ? event.rawUrl : undefined;
  const url = typeof event?.url === "string" ? event.url : undefined;

  const candidates: string[] = [];

  // 1. Inspect event.rawUrl (often the purest original client request URL)
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.pathname) {
        candidates.push(parsed.pathname);
      }
    } catch {
      // ignore URL parse errors
    }
  }

  // 2. Inspect event.url
  if (url) {
    try {
      if (url.startsWith("http://") || url.startsWith("https://")) {
        const parsed = new URL(url);
        if (parsed.pathname) candidates.push(parsed.pathname);
      } else {
        candidates.push(url.split("?")[0]);
      }
    } catch {
      // ignore
    }
  }

  // 3. Inspect event.rawPath (HTTP API v2 format)
  if (rawPath) {
    candidates.push(rawPath.split("?")[0]);
  }

  // 4. Inspect event.path (standard Lambda v1 format)
  if (originalEventPath) {
    candidates.push(originalEventPath.split("?")[0]);
  }

  // Pick the most specific candidate:
  // Prefer candidates that contain actual route information beyond just the function prefix
  let selected = "";
  for (const c of candidates) {
    if (c.startsWith(NETLIFY_FUNCTION_PREFIX)) {
      const sub = c.slice(NETLIFY_FUNCTION_PREFIX.length);
      if (sub && sub !== "/") {
        selected = c;
        break;
      }
    } else if (c.startsWith("/api/") && c.length > 5) {
      selected = c;
      break;
    } else if (c !== "/" && c !== "") {
      if (!selected) selected = c;
    }
  }

  // Fallback to first available candidate or default to "/api/health"
  if (!selected && candidates.length > 0) {
    selected = candidates[0];
  }
  if (!selected) {
    selected = "/api/health";
  }

  // Strip ONLY the Netlify function prefix: /.netlify/functions/api
  let subPath = selected;
  if (subPath.startsWith(NETLIFY_FUNCTION_PREFIX)) {
    subPath = subPath.slice(NETLIFY_FUNCTION_PREFIX.length);
    if (!subPath) subPath = "/";
  }

  // Ensure path starts with /api for Express routing
  let normalizedPath: string;
  if (subPath.startsWith("/api")) {
    normalizedPath = subPath;
  } else {
    normalizedPath = "/api" + (subPath.startsWith("/") ? subPath : "/" + subPath);
  }

  // Clean trailing slash if path is longer than /api/
  if (normalizedPath.length > 5 && normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  return {
    normalizedPath,
    originalEventPath,
    rawPath,
    rawUrl,
    url,
  };
}

/**
 * Netlify Function Route Config (Functions v2)
 * Binds directly to /api/* and /api in Netlify's routing layer.
 */
export const config = {
  path: ["/api/*", "/api"],
  preferStatic: false,
};

/**
 * Netlify Serverless Function Handler
 * Proxies all incoming API traffic to the Express application.
 * Preserves the original requested path across all event variants.
 */
export const handler: any = async (event: any, context: any) => {
  // Prevent serverless functions from hanging on active event loop handles
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  if (event) {
    const routeInfo = resolveApiRoute(event);

    // Synchronize query parameters across queryStringParameters, rawQuery, and rawQueryString
    const qParams: Record<string, string> = { ...(event.queryStringParameters || {}) };
    let rawQuery = typeof event.rawQuery === "string" ? event.rawQuery : "";

    if (routeInfo.rawUrl && (!event.queryStringParameters || Object.keys(event.queryStringParameters).length === 0)) {
      try {
        const parsed = new URL(routeInfo.rawUrl);
        parsed.searchParams.forEach((val, key) => {
          qParams[key] = val;
        });
        if (!rawQuery && parsed.search) {
          rawQuery = parsed.search.startsWith("?") ? parsed.search.slice(1) : parsed.search;
        }
      } catch {
        // ignore
      }
    }

    event.queryStringParameters = qParams;
    event.rawQuery = rawQuery;
    event.rawQueryString = rawQuery;

    // Apply normalized route to all properties checked by serverless-http
    event.path = routeInfo.normalizedPath;
    event.rawPath = routeInfo.normalizedPath;
    event.requestPath = routeInfo.normalizedPath;
    event.url = routeInfo.normalizedPath;

    // Attach non-sensitive diagnostics headers for safe environment inspection
    event.headers = event.headers || {};
    event.headers["x-debug-original-path"] = routeInfo.originalEventPath || "";
    event.headers["x-debug-raw-path"] = routeInfo.rawPath || "";
    event.headers["x-debug-raw-url"] = routeInfo.rawUrl || "";
    event.headers["x-debug-normalized-path"] = routeInfo.normalizedPath;
  }

  return serverlessHandler(event, context);
};

export default handler;
