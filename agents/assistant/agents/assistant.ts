import { AIChatAgent } from "@cloudflare/ai-chat";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText } from "ai";

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
      system: "You are the starter assistant. Be concise and practical.",
      messages,
    });

    return result.toTextStreamResponse();
  }
}
