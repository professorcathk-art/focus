/**
 * Auth callback handler for OAuth deep links
 * Handles: focus://auth-callback?code=...
 */

import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      console.log("[Auth Callback] Processing OAuth callback...");
      console.log("[Auth Callback] Params:", params);

      try {
        // Extract code from params
        const code = params.code as string;
        const error = params.error as string;
        const errorDescription = params.error_description as string;

        if (error) {
          console.error("[Auth Callback] ❌ OAuth error:", error);
          console.error("[Auth Callback] Error description:", errorDescription);
          // Redirect to sign in with error
          router.replace("/(auth)/signin");
          return;
        }

        if (code) {
          console.log("[Auth Callback] Found OAuth code, exchanging for session...");
          
          // Wait a moment for Supabase to process
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check for session - Supabase should have processed the code
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error("[Auth Callback] Error getting session:", sessionError);
            // Wait a bit more and retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            await checkAuth();
          } else if (data?.session) {
            console.log("[Auth Callback] ✅ Session found!");
            await checkAuth();
          } else {
            console.log("[Auth Callback] ⚠️ No session yet, checking auth...");
            await checkAuth();
          }
        } else {
          console.log("[Auth Callback] No code found, checking auth state...");
          await checkAuth();
        }

        // Redirect to appropriate screen after a short delay
        setTimeout(() => {
          router.replace("/(tabs)/record");
        }, 1000);
      } catch (err) {
        console.error("[Auth Callback] Error processing callback:", err);
        // Still try to check auth and redirect
        await checkAuth();
        setTimeout(() => {
          router.replace("/(auth)/signin");
        }, 1000);
      }
    };

    handleCallback();
  }, [params]);

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
      <ActivityIndicator size="large" color="#34C759" />
      <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>
        Completing sign in...
      </Text>
    </SafeAreaView>
  );
}

