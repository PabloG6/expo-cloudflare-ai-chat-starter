import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { jwt } from "better-auth/plugins";
import { account, createDbWithUrl, jwks, session, user, verification } from "@starter/db";
import { CLOUD_FLARE_CONTEXT_SYMBOL } from "@starter/shared";

export type StarterAuthEnv = {
  DATABASE_URL?: string;
  HYPERDRIVE?: { connectionString?: string };
  BETTER_AUTH_SECRET: string;
  AUTH_ORIGIN?: string;
  AUTH_URL?: string;
  BETTER_AUTH_BASE_URL?: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};

function resolveDatabaseUrl(env: Partial<StarterAuthEnv>) {
  // Prefer explicit DATABASE_URL so local dev is not coupled to Hyperdrive config.
  const url = env.DATABASE_URL ?? env.HYPERDRIVE?.connectionString;
  if (!url) {
    throw new Error("Missing database connection (HYPERDRIVE.connectionString or DATABASE_URL).");
  }
  return url;
}

function resolveAuthOrigin(env: Partial<StarterAuthEnv>) {
  const origin = env.BETTER_AUTH_BASE_URL ?? env.AUTH_ORIGIN ?? env.AUTH_URL;
  if (!origin) {
    throw new Error("Missing auth origin. Set BETTER_AUTH_BASE_URL, AUTH_ORIGIN, or AUTH_URL.");
  }
  return origin.replace(/\/$/, "");
}

function normalizeAuthBaseUrl(origin: string) {
  return origin.endsWith("/api/auth") ? origin : `${origin}/api/auth`;
}

export function createAuth(env: StarterAuthEnv) {
  const authOrigin = resolveAuthOrigin(env);
  const databaseUrl = resolveDatabaseUrl(env);
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: normalizeAuthBaseUrl(authOrigin),
    trustedOrigins: [authOrigin, "nexus://", "exp://", "exps://"],
    plugins: [expo({ disableOriginOverride: true }), jwt()],
    database: drizzleAdapter(createDbWithUrl(databaseUrl), {
      provider: "pg",
      schema: { user, session, account, verification, jwks },
    }),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        accessType: "offline",
        scope: ["openid", "email", "profile"],
      },
    },
  });
}

export function createAuthFromContext() {
  const ctx = (globalThis as Record<string | symbol, unknown>)[CLOUD_FLARE_CONTEXT_SYMBOL] as
    | { env?: Record<string, unknown> }
    | undefined;

  if (!ctx?.env) {
    throw new Error("Cloudflare context is missing. Inject it in the worker fetch handler.");
  }

  return createAuth(ctx.env as unknown as StarterAuthEnv);
}
