import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { CLOUD_FLARE_CONTEXT_SYMBOL } from "@starter/shared";

export function createDbWithUrl(connectionString: string) {
  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema, logger: false });
}

export function createDbFromContext() {
  const ctx = (globalThis as Record<string | symbol, unknown>)[CLOUD_FLARE_CONTEXT_SYMBOL] as
    | { env?: Record<string, unknown> }
    | undefined;

  const env = ctx?.env;
  const url =
    (env?.DATABASE_URL as string | undefined) ??
    (env?.HYPERDRIVE as { connectionString?: string } | undefined)?.connectionString ??
    process.env.DATABASE_URL;

  if (!url) {
    throw new Error("Missing database connection string. Set DATABASE_URL or HYPERDRIVE.connectionString.");
  }

  return createDbWithUrl(url);
}
