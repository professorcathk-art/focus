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
      
      // Check if this is an auth callback (contains access_token or code)
      if (url.includes('access_token') || url.includes('code=') || url.includes('#access_token')) {
        console.log("[Deep Link] Auth callback detected");
        
        // Get session from Supabase (it will parse the URL automatically)
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[Deep Link] Error getting session:", error);
        }
        
        if (data?.session) {
          console.log("[Deep Link] ✅ Session found, refreshing auth state");
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

