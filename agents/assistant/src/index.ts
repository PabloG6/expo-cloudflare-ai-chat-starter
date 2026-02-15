import { routeAgentRequest } from "agents";
import { AIAssistant } from "../agents/assistant";
import { getSessionFromRequest, parseAgentTarget, userIdFromSessionName } from "./utils";
import { CLOUD_FLARE_CONTEXT_SYMBOL } from "@starter/shared";

export { AIAssistant };

export type AssistantBindings = {
  BETTER_AUTH_SECRET: string;
  AUTH_ORIGIN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  OPENROUTER_API_KEY?: string;
  OPEN_ROUTER_MODEL?: string;
  DATABASE_URL?: string;
  HYPERDRIVE?: { connectionString?: string };
  chat: DurableObjectNamespace;
};

async function requireSession(request: Request, env: AssistantBindings, ctx: ExecutionContext) {
  (globalThis as Record<string | symbol, unknown>)[CLOUD_FLARE_CONTEXT_SYMBOL] = {
    env,
    cf: request.cf,
    ctx,
  };

  const session = await getSessionFromRequest(request, env);
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { namespace, name } = parseAgentTarget(new URL(request.url).pathname);
  if (namespace !== "chat" || !name) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const expectedUserId = userIdFromSessionName(name);
  if (!expectedUserId || expectedUserId !== session.subject) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  return undefined;
}

const worker: ExportedHandler<AssistantBindings> = {
  async fetch(request, env, ctx) {
    const response = await routeAgentRequest(request, env, {
      cors: true,
      onBeforeConnect: (req) => requireSession(req, env, ctx),
      onBeforeRequest: (req) => requireSession(req, env, ctx),
    });

    if (response) {
      return response;
    }

    return new Response("Assistant worker is running", { status: 200 });
  },
};

export default worker;
