import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { createAuth } from "@starter/auth";

export type ApiEnv = {
  BETTER_AUTH_SECRET: string;
  AUTH_ORIGIN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  DATABASE_URL?: string;
  HYPERDRIVE?: { connectionString?: string };
};

async function getSession(req: Request, env: ApiEnv) {
  try {
    const auth = createAuth(env);
    return await auth.api.getSession({ headers: req.headers });
  } catch {
    return null;
  }
}

export async function createContext(opts: FetchCreateContextFnOptions & { env: ApiEnv }) {
  return {
    req: opts.req,
    env: opts.env,
    session: await getSession(opts.req, opts.env),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
