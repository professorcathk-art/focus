/**
 * Root layout with navigation setup
 */

import { useEffect, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import "../global.css";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { checkAuth, isLoading } = useAuthStore();
  const processedUrlsRef = useRef<Set<string>>(new Set()); // Track processed URLs

  useEffect(() => {
    checkAuth();

    // Handle deep links for OAuth and email confirmation
    let processingDeepLink = false; // Prevent multiple simultaneous deep link processing
    const handleDeepLink = async (url: string) => {
      // Prevent processing the same URL multiple times
      if (processedUrlsRef.current.has(url)) {
        console.log("[Deep Link] ⚠️ URL already processed, skipping...", url.substring(0, 50));
        return;
      }
      
      // Prevent multiple simultaneous processing
      if (processingDeepLink) {
        console.log("[Deep Link] ⚠️ Already processing deep link, skipping...");
        return;
      }
      
      console.log("[Deep Link] Received URL:", url);
      
      // Check if this is an auth callback
      // Supabase OAuth callbacks contain access_token, code, or error in URL fragments/params
      const isAuthCallback = 
        url.includes('access_token') || 
        url.includes('code=') || 
        url.includes('#access_token') ||
        url.includes('error=') ||
        url.includes('error_description=') ||
        url.includes('/auth/v1/callback') ||
        url.startsWith('focus://auth-callback') || // Deep link from OAuth redirect
        url.startsWith('focus://'); // Any focus:// deep link
      
      if (isAuthCallback) {
        processingDeepLink = true;
        console.log("[Deep Link] 🔐 Auth callback detected");
        
        // If it's a focus://auth-callback URL, navigate to the route handler
        if (url.startsWith('focus://auth-callback')) {
          console.log("[Deep Link] Navigating to auth-callback route...");
          // Mark URL as processed
          processedUrlsRef.current.add(url);
          // Extract query params and navigate to route
          try {
            const urlObj = new URL(url.replace('focus://', 'https://'));
            const params = new URLSearchParams(urlObj.search);
            const queryString = params.toString();
            router.push(`/auth-callback${queryString ? `?${queryString}` : ''}`);
          } catch (err) {
            console.error("[Deep Link] Error parsing URL:", err);
            processingDeepLink = false;
            processedUrlsRef.current.delete(url); // Remove on error so it can be retried
          }
          return;
        }
        
        try {
          // Parse the URL to extract tokens/errors
          let urlObj: URL;
          try {
            urlObj = new URL(url);
          } catch {
            // If URL parsing fails, try to construct a proper URL
            // Deep links like focus://auth/callback?code=... need special handling
            if (url.startsWith('focus://')) {
              // Convert focus:// to https:// temporarily for parsing
              const httpsUrl = url.replace('focus://', 'https://');
              urlObj = new URL(httpsUrl);
            } else {
              throw new Error('Invalid URL format');
            }
          }
          
          const hashParams = new URLSearchParams(urlObj.hash.substring(1));
          const queryParams = new URLSearchParams(urlObj.search);
          
          // Check for error first
          const error = hashParams.get('error') || queryParams.get('error');
          if (error) {
            console.error("[Deep Link] ❌ OAuth error:", error);
            const errorDesc = hashParams.get('error_description') || queryParams.get('error_description');
            console.error("[Deep Link] Error description:", errorDesc);
            router.push('/(auth)/signin');
            return;
          }
          
          // Extract code from URL
          const code = hashParams.get('code') || queryParams.get('code');
          const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
          
          if (code) {
            console.log("[Deep Link] Found OAuth code, navigating to callback handler...");
            // Mark URL as processed
            processedUrlsRef.current.add(url);
            // Navigate to auth-callback route which will handle the code exchange
            router.push(`/auth-callback?code=${code}`);
          } else if (accessToken) {
            // Mark URL as processed
            processedUrlsRef.current.add(url);
            // If we have access_token directly, session should be available
            console.log("[Deep Link] Found access token, checking session...");
            await checkAuth();
          } else {
            console.log("[Deep Link] No code or token found, checking auth state...");
            await checkAuth();
          }
        } catch (err) {
          console.error("[Deep Link] Error processing auth callback:", err);
          // Still try to check auth state - Supabase might have processed it
          await checkAuth();
          // Remove from processed set on error so it can be retried
          processedUrlsRef.current.delete(url);
        } finally {
          processingDeepLink = false;
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

    // Clear processed URLs after 30 seconds to allow retries if needed
    const clearProcessedInterval = setInterval(() => {
      if (processedUrlsRef.current.size > 10) {
        // Keep only the 5 most recent URLs
        const urls = Array.from(processedUrlsRef.current);
        processedUrlsRef.current.clear();
        urls.slice(-5).forEach(url => processedUrlsRef.current.add(url));
      }
    }, 30000);

    return () => {
      subscription.remove();
      clearInterval(clearProcessedInterval);
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
        <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}

