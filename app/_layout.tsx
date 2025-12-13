/**
 * Root layout with navigation setup
 */

import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import "../global.css";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();

    // Handle deep links for OAuth and email confirmation
    const handleDeepLink = async (url: string) => {
      console.log("[Deep Link] Received URL:", url);
      
      // Check if this is an auth callback
      // Supabase OAuth callbacks contain access_token, code, or error in URL fragments/params
      const isAuthCallback = 
        url.includes('access_token') || 
        url.includes('code=') || 
        url.includes('#access_token') ||
        url.includes('error=') ||
        url.includes('error_description=') ||
        url.includes('/auth/v1/callback');
      
      if (isAuthCallback) {
        console.log("[Deep Link] 🔐 Auth callback detected");
        
        try {
          // Parse the URL to extract tokens
          const urlObj = new URL(url);
          const hashParams = new URLSearchParams(urlObj.hash.substring(1));
          const queryParams = new URLSearchParams(urlObj.search);
          
          // Check for error first
          const error = hashParams.get('error') || queryParams.get('error');
          if (error) {
            console.error("[Deep Link] ❌ OAuth error:", error);
            const errorDesc = hashParams.get('error_description') || queryParams.get('error_description');
            console.error("[Deep Link] Error description:", errorDesc);
            return;
          }
          
          // Try to get session - Supabase should handle URL parsing automatically
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error("[Deep Link] Error getting session:", sessionError);
            // Try to exchange code for session if we have a code
            const code = hashParams.get('code') || queryParams.get('code');
            if (code) {
              console.log("[Deep Link] Attempting to exchange code for session...");
              // Supabase should handle this automatically via getSession()
            }
          }
          
          if (data?.session) {
            console.log("[Deep Link] ✅ Session found, refreshing auth state");
            await checkAuth();
          } else {
            console.log("[Deep Link] ⚠️ No session found, checking auth state...");
            // Wait a bit and check again (OAuth flow might need time)
            setTimeout(async () => {
              await checkAuth();
            }, 1000);
          }
        } catch (err) {
          console.error("[Deep Link] Error processing auth callback:", err);
          // Still try to check auth state
          await checkAuth();
        }
      } else {
        // Regular deep link navigation
        console.log("[Deep Link] Regular navigation");
        await checkAuth();
      }
    };

    // Get initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colorScheme === "dark" ? "#000000" : "#FFFFFF" }}>
          <ActivityIndicator size="large" color="#FF3B30" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === "dark" ? "#000000" : "#FFFFFF",
          },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="idea/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="cluster/[id]" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}

