import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { jwtClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

const AUTH_URL =
  (process.env.EXPO_PUBLIC_AUTH_URL as string | undefined) ?? "http://localhost:8393";

export const authClient = createAuthClient({
  baseURL: `${AUTH_URL}/api/auth`,
  plugins: [
    expoClient({
      scheme: "nexus",
      storagePrefix: "starter",
      storage: SecureStore,
    }),
    jwtClient(),
  ],
});

export const AUTH_HTTP_URL = AUTH_URL;
