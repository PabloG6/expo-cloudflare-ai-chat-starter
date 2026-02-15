import React, { createContext, useContext, useMemo, useState } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";
import { authClient } from "../lib/authClient";
import { getAuthJwt } from "../lib/getAuthJwt";

const ASSISTANT_URL =
  (process.env.EXPO_PUBLIC_ASSISTANT_URL as string | undefined) ?? "http://localhost:8788";

function normalizeAgentHost(urlOrHost: string) {
  const raw = String(urlOrHost || "").trim();
  if (!raw) return "localhost:8788";
  try {
    const withScheme = raw.includes("://") ? raw : `http://${raw}`;
    const u = new URL(withScheme);
    return u.host;
  } catch {
    return raw.replace(/^wss?:\/\//, "").replace(/^https?:\/\//, "").split("/")[0] || "localhost:8788";
  }
}

type ChatContextValue = {
  chat: ReturnType<typeof useAgentChat>;
  connected: boolean;
  authReady: boolean;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext must be used within <ChatProvider>");
  }
  return ctx;
}

function getDayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { data: sessionData } = authClient.useSession();
  const userId = sessionData?.user?.id ? String(sessionData.user.id) : null;
  const [tokenVersion, setTokenVersion] = useState(0);

  const sessionName = useMemo(() => {
    if (!userId) return "anonymous";
    return `${userId}:${getDayKey()}`;
  }, [userId]);

  const agent = useAgent({
    agent: "chat",
    name: sessionName,
    host: normalizeAgentHost(ASSISTANT_URL),
    enabled: Boolean(userId),
    queryDeps: [tokenVersion],
    cacheTtl: 10 * 60 * 1000,
    query: async () => {
      const token = await getAuthJwt({
        force: tokenVersion > 0,
        ttlMs: 15 * 60 * 1000,
      });
      if (!token) {
        throw new Error("Failed to fetch auth token for assistant");
      }
      return { token };
    },
    onClose: (event) => {
      if ([1008, 4001, 4003].includes(event.code)) {
        setTokenVersion((v) => v + 1);
      }
    },
  });

  const chat = useAgentChat({ agent });

  const value = useMemo(
    () => ({
      chat,
      connected: Boolean(userId),
      authReady: true,
    }),
    [chat, userId],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
