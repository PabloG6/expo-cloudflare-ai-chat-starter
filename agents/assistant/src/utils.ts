import { createAuth, type StarterAuthEnv } from "@starter/auth";

export async function getSessionFromRequest(request: Request, env: StarterAuthEnv) {
  const url = new URL(request.url);
  const authHeader = request.headers.get("authorization");
  const tokenFromQuery = url.searchParams.get("token");

  let bearerToken: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    bearerToken = authHeader.slice(7);
  } else if (tokenFromQuery) {
    bearerToken = tokenFromQuery;
  }

  if (!bearerToken) {
    return null;
  }

  try {
    const auth = createAuth(env);
    const verified = await auth.api.verifyJWT({ body: { token: bearerToken } });
    const subject = verified?.payload?.sub ? String(verified.payload.sub) : null;

    if (!subject) {
      return null;
    }

    return {
      token: bearerToken,
      subject,
      payload: verified.payload,
    };
  } catch {
    return null;
  }
}

export function parseAgentTarget(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 3 || parts[0] !== "agents") {
    return { namespace: null, name: null };
  }
  return { namespace: parts[1] ?? null, name: parts[2] ?? null };
}

export function userIdFromSessionName(name: string) {
  const value = String(name || "").trim();
  const match = value.match(/^(.*):(\d{4}-\d{2}-\d{2})$/);
  if (!match) {
    return null;
  }
  const userId = (match[1] ?? "").trim();
  return userId || null;
}
