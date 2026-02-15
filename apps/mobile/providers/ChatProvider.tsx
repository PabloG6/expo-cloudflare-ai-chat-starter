import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";
import { authClient } from "../lib/authClient";

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

  const [jwt, setJwt] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;

    const loadToken = async () => {
      if (!userId) {
        if (active) {
          setJwt(null);
          setAuthReady(true);
        }
        return;
      }

      setAuthReady(false);
      try {
        const { data, error } = await authClient.token();
        if (!active) return;
        if (error || !data?.token) {
          setJwt(null);
          setAuthReady(true);
          return;
        }

        setJwt(data.token);
        setAuthReady(true);
      } catch {
        if (!active) return;
        setJwt(null);
        setAuthReady(true);
      }
    };

    void loadToken();

    return () => {
      active = false;
    };
  }, [userId]);

  const sessionName = useMemo(() => {
    if (!userId) return "anonymous";
    return `${userId}:${getDayKey()}`;
  }, [userId]);

  const agent = useAgent({
    agent: "chat",
    name: sessionName,
    host: normalizeAgentHost(ASSISTANT_URL),
    enabled: Boolean(userId && jwt),
    query: async () => ({ token: jwt ?? "" }),
  });

  const chat = useAgentChat({ agent });

  const value = useMemo(
    () => ({
      chat,
      connected: Boolean(userId && jwt),
      authReady,
    }),
    [chat, userId, jwt, authReady],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
