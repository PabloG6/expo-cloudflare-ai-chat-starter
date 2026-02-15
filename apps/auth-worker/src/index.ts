import { Hono } from "hono";
import { auth } from "./lib/auth";
import { CLOUD_FLARE_CONTEXT_SYMBOL } from "@starter/shared";

export type AuthBindings = {
  BETTER_AUTH_SECRET: string;
  AUTH_ORIGIN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  DATABASE_URL?: string;
  HYPERDRIVE?: { connectionString?: string };
};

const app = new Hono<{ Bindings: AuthBindings }>();

app.all("/api/auth/*", async (c) => {
  const original = c.req.raw;
  const mutableHeaders = new Headers(original.headers);

  if (!mutableHeaders.get("origin")) {
    const expoOrigin = mutableHeaders.get("expo-origin");
    if (expoOrigin) {
      mutableHeaders.set("origin", expoOrigin);
    }
  }

  const init: RequestInit = {
    method: original.method,
    headers: mutableHeaders,
    redirect: original.redirect,
  };

  if (original.method !== "GET" && original.method !== "HEAD") {
    init.body = original.body;
    (init as RequestInit & { duplex: "half" }).duplex = "half";
  }

  const rewritten = new Request(original.url, init);
  return auth(c.env).handler(rewritten);
});

app.get("/api/session", async (c) => {
  const session = await auth(c.env).api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ ok: false }, 401);
  }

  return c.json({
    ok: true,
    user: session.user,
    session: session.session,
  });
});

const worker: ExportedHandler<AuthBindings> = {
  async fetch(request, env, ctx) {
    const prev = (globalThis as Record<string | symbol, unknown>)[CLOUD_FLARE_CONTEXT_SYMBOL];
    (globalThis as Record<string | symbol, unknown>)[CLOUD_FLARE_CONTEXT_SYMBOL] = {
      env,
      cf: request.cf,
      ctx,
    };

    try {
      return await app.fetch(request, env, ctx);
    } finally {
      (globalThis as Record<string | symbol, unknown>)[CLOUD_FLARE_CONTEXT_SYMBOL] = prev;
    }
  },
};

export default worker;
