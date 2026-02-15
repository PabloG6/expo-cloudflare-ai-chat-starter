import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createContext } from "./context";
import { appRouter } from "./router";
import { CLOUD_FLARE_CONTEXT_SYMBOL } from "@starter/shared";

export type ApiBindings = {
  BETTER_AUTH_SECRET: string;
  AUTH_ORIGIN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  DATABASE_URL?: string;
  HYPERDRIVE?: { connectionString?: string };
};

const worker: ExportedHandler<ApiBindings> = {
  async fetch(request, env, ctx) {
    const prev = (globalThis as Record<string | symbol, unknown>)[CLOUD_FLARE_CONTEXT_SYMBOL];
    (globalThis as Record<string | symbol, unknown>)[CLOUD_FLARE_CONTEXT_SYMBOL] = {
      env,
      cf: request.cf,
      ctx,
    };

    try {
      return await fetchRequestHandler({
        endpoint: "/api/trpc",
        req: request,
        router: appRouter,
        createContext: (opts) => createContext({ ...opts, env }),
      });
    } finally {
      (globalThis as Record<string | symbol, unknown>)[CLOUD_FLARE_CONTEXT_SYMBOL] = prev;
    }
  },
};

export default worker;
