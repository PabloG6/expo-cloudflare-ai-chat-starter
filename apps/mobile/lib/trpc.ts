import { createTRPCClient, httpBatchLink } from "@trpc/client";
import SuperJSON from "superjson";
import type { AppRouter } from "@starter/api/src/router";

const API_URL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ?? "http://localhost:8787";

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      transformer: SuperJSON,
    }),
  ],
});
