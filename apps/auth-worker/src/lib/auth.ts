import { createAuth, type StarterAuthEnv } from "@starter/auth";

export function auth(env: StarterAuthEnv) {
  return createAuth(env);
}
