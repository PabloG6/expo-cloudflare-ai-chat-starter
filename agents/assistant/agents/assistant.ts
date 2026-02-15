import { AIChatAgent } from "@cloudflare/ai-chat";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText, tool } from "ai";
import { z } from "zod";

type AgentEnv = {
  OPENROUTER_API_KEY?: string;
  OPEN_ROUTER_MODEL?: string;
};

export type AssistantState = {
  userId: string | null;
  validatedAt: string | null;
};

export class AIAssistant extends AIChatAgent<AgentEnv, AssistantState> {
  initialState: AssistantState = {
    userId: null,
    validatedAt: null,
  };

  async onChatMessage(): Promise<Response> {
    const apiKey = this.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return new Response(
        "Assistant starter is running. Set OPENROUTER_API_KEY to enable model responses.",
        { status: 200 },
      );
    }

    const modelName = this.env.OPEN_ROUTER_MODEL || "z-ai/glm-4.7-flash";
    const openRouter = createOpenRouter({ apiKey });
    const messages = await convertToModelMessages(this.messages);

    const result = streamText({
      model: openRouter(modelName),
      system:
        "You are the starter assistant. Be concise. Use tools when useful: getCurrentTime for current time and generateId for creating IDs.",
      messages,
      tools: {
        getCurrentTime: tool({
          description: "Get current UTC time in ISO format",
          inputSchema: z.object({}),
          execute: async () => {
            const now = new Date();
            return {
              nowIso: now.toISOString(),
              unixMs: now.getTime(),
            };
          },
        }),
        generateId: tool({
          description: "Generate a random UUID",
          inputSchema: z.object({}),
          execute: async () => {
            return { id: crypto.randomUUID() };
          },
        }),
      },
    });

    return result.toTextStreamResponse();
  }
}
