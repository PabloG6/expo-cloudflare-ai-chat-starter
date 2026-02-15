import { authClient } from "./authClient";

type JwtCache = {
  token: string | null;
  expiresAt: number;
};

let cache: JwtCache | null = null;

export async function getAuthJwt(opts?: { force?: boolean; ttlMs?: number }): Promise<string | null> {
  const force = Boolean(opts?.force);
  const ttlMs = opts?.ttlMs ?? 15 * 60 * 1000;

  if (!force && cache && Date.now() < cache.expiresAt) {
    return cache.token;
  }

  const { data, error } = await authClient.token();
  if (error || !data?.token) {
    cache = null;
    return null;
  }

  cache = {
    token: data.token,
    expiresAt: Date.now() + ttlMs,
  };

  return data.token;
}
