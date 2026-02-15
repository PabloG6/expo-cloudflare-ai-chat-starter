import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useChatContext } from "../providers/ChatProvider";

type SimpleMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

function toSimpleMessages(messages: any[]): SimpleMessage[] {
  return messages.map((m, idx) => {
    const parts = Array.isArray(m.parts) ? m.parts : [];
    const text = parts
      .filter((p: any) => p?.type === "text")
      .map((p: any) => String(p.text ?? ""))
      .join(" ")
      .trim();

    return {
      id: String(m.id ?? idx),
      role: m.role === "assistant" ? "assistant" : "user",
      text: text || (m.role === "assistant" ? "..." : ""),
    };
  });
}

export function ChatScreen() {
  const { chat, connected, authReady } = useChatContext();
  const [input, setInput] = useState("");

  const messages = useMemo(() => toSimpleMessages(chat.messages as any[]), [chat.messages]);
  const busy = chat.status !== "ready";

  const onSend = () => {
    const text = input.trim();
    if (!text || busy || !connected) return;
    chat.sendMessage({ text });
    setInput("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat</Text>
      <Text style={styles.subtitle}>
        {!authReady
          ? "Preparing auth token..."
          : connected
            ? "Connected to assistant"
            : "Sign in first to connect assistant"}
      </Text>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {messages.length === 0 ? (
          <Text style={styles.empty}>No messages yet</Text>
        ) : (
          messages.map((m) => (
            <View
              key={m.id}
              style={[styles.bubble, m.role === "user" ? styles.userBubble : styles.assistantBubble]}
            >
              <Text style={m.role === "user" ? styles.userText : styles.assistantText}>{m.text}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.composerRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message"
          style={styles.input}
          editable={connected}
          onSubmitEditing={onSend}
          returnKeyType="send"
        />
        <Pressable style={styles.sendButton} onPress={onSend}>
          <Text style={styles.sendButtonText}>{busy ? "..." : "Send"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    padding: 12,
    height: 380,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    color: "#475569",
    marginTop: 2,
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 8,
    paddingBottom: 8,
  },
  empty: {
    color: "#64748b",
    fontStyle: "italic",
  },
  bubble: {
    maxWidth: "92%",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#0f172a",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#e2e8f0",
  },
  userText: {
    color: "#ffffff",
  },
  assistantText: {
    color: "#0f172a",
  },
  composerRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: "#0f172a",
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  sendButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
