import React, { useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { authClient } from "./lib/authClient";
import { trpcClient } from "./lib/trpc";

function AppScreen() {
  const { data: sessionData } = authClient.useSession();
  const [serverDate, setServerDate] = useState<string>("Not fetched yet");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signedIn = Boolean(sessionData?.user?.id);

  const handleSignIn = async () => {
    setError(null);
    const { error: signInError } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "nexus://",
    });

    if (signInError) {
      setError(signInError.message || "Sign in failed");
    }
  };

  const handleFetchDate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await trpcClient.system.now.query();
      setServerDate(`${res.nowIso} (${res.unixMs})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch server date");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Nexus Starter Demo</Text>
        <Text style={styles.status}>Status: {signedIn ? "signed in" : "signed out"}</Text>

        <Pressable style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={handleFetchDate} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Fetching..." : "Fetch server date"}</Text>
        </Pressable>

        <Text style={styles.resultLabel}>Server date</Text>
        <Text style={styles.resultValue}>{serverDate}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <StatusBar style="auto" />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppScreen />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  status: {
    fontSize: 16,
    color: "#334155",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  resultLabel: {
    marginTop: 8,
    fontWeight: "600",
    fontSize: 16,
  },
  resultValue: {
    color: "#0f172a",
    fontFamily: "monospace",
  },
  error: {
    color: "#b91c1c",
    marginTop: 8,
  },
});
