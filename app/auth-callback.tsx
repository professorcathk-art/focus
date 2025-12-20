/**
 * Auth callback handler for OAuth deep links
 * Handles: focus://auth-callback?code=...
 */

import { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/config/api";
import * as SecureStore from "expo-secure-store";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { checkAuth, isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<string>("Processing...");
  const hasRedirectedRef = useRef(false); // Prevent multiple redirects

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple redirects
      if (hasRedirectedRef.current) {
        console.log("[Auth Callback] ⚠️ Already processed, skipping...");
        return;
      }

      // If already authenticated, redirect immediately
      if (isAuthenticated) {
        console.log("[Auth Callback] ✅ Already authenticated, redirecting...");
        hasRedirectedRef.current = true;
        router.replace("/(tabs)/record");
        return;
      }

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
          setStatus("Authentication failed");
          if (!hasRedirectedRef.current) {
            hasRedirectedRef.current = true;
            setTimeout(() => {
              router.replace("/(auth)/signin");
            }, 2000);
          }
          return;
        }

        if (code) {
          console.log("[Auth Callback] Found OAuth code:", code.substring(0, 20) + "...");
          setStatus("Exchanging code for session...");
          
          // For PKCE flow, Supabase stores the code verifier in SecureStore
          // We need to manually exchange the code by calling Supabase's token endpoint
          // The code verifier key format is: sb-{project-ref}-auth-code-verifier
          
          try {
            // For PKCE flow, Supabase stores the code verifier when signInWithOAuth is called
            // We need to manually exchange the code by calling Supabase's token endpoint
            
            // Get the code verifier from SecureStore
            // Supabase stores it with key: sb-{project-ref}-auth-code-verifier
            const projectRef = SUPABASE_URL.split('//')[1]?.split('.')[0] || 'wqvevludffkemgicrfos';
            const codeVerifierKey = `sb-${projectRef}-auth-code-verifier`;
            const codeVerifier = await SecureStore.getItemAsync(codeVerifierKey);
            
            console.log("[Auth Callback] Code verifier found:", !!codeVerifier);
            
            // Set up a listener for auth state changes FIRST
            let sessionReceived = false;
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
              console.log("[Auth Callback] 🔄 Auth state changed:", event, "Has session:", !!session);
              if (session && session.user) {
                sessionReceived = true;
                console.log("[Auth Callback] ✅ Session received via auth state change!");
                console.log("[Auth Callback] User ID:", session.user.id);
                await checkAuth();
              }
            });
            
            // Wait a moment for listener to be set up
            await new Promise(resolve => setTimeout(resolve, 300));
            
            if (codeVerifier) {
              // Manually exchange the code by calling Supabase's token endpoint
              setStatus("Exchanging code...");
              
              try {
                // Call Supabase's token endpoint to exchange code for session
                const exchangeUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=authorization_code`;
                
                console.log("[Auth Callback] Calling token exchange endpoint...");
                const response = await fetch(exchangeUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'apikey': SUPABASE_ANON_KEY,
                  },
                  body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    code_verifier: codeVerifier,
                    redirect_uri: 'focus://auth-callback',
                  }).toString(),
                });
                
                const exchangeData = await response.json();
                
                if (exchangeData.access_token) {
                  console.log("[Auth Callback] ✅ Token exchange successful!");
                  // Set the session manually
                  const { data: sessionData, error: setError } = await supabase.auth.setSession({
                    access_token: exchangeData.access_token,
                    refresh_token: exchangeData.refresh_token,
                  });
                  
                  if (setError) {
                    console.error("[Auth Callback] Error setting session:", setError);
                  } else if (sessionData.session) {
                    console.log("[Auth Callback] ✅ Session set successfully!");
                    console.log("[Auth Callback] User ID:", sessionData.session.user.id);
                    sessionReceived = true;
                    await checkAuth();
                  }
                } else {
                  console.error("[Auth Callback] Token exchange failed:", exchangeData);
                  // Fall back to getSession()
                  setStatus("Retrying...");
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  const { data } = await supabase.auth.getSession();
                  if (data?.session) {
                    sessionReceived = true;
                    await checkAuth();
                  }
                }
              } catch (exchangeError) {
                console.error("[Auth Callback] Error in manual exchange:", exchangeError);
                // Fall back to getSession()
                setStatus("Retrying...");
                const { data } = await supabase.auth.getSession();
                if (data?.session) {
                  sessionReceived = true;
                  await checkAuth();
                }
              }
            } else {
              // No code verifier found - try getSession() anyway
              console.log("[Auth Callback] No code verifier found, trying getSession()...");
              setStatus("Checking session...");
              const { data, error: sessionError } = await supabase.auth.getSession();
              
              if (sessionError) {
                console.error("[Auth Callback] Error getting session:", sessionError);
              } else if (data?.session) {
                console.log("[Auth Callback] ✅ Session found!");
                sessionReceived = true;
                await checkAuth();
              }
            }
            
            // Wait a bit more for auth state change
            if (!sessionReceived) {
              setStatus("Waiting for authentication...");
              for (let i = 0; i < 8; i++) {
                await new Promise(resolve => setTimeout(resolve, 500));
                const { data: checkData } = await supabase.auth.getSession();
                if (checkData?.session) {
                  console.log("[Auth Callback] ✅ Session found during wait!");
                  sessionReceived = true;
                  await checkAuth();
                  break;
                }
              }
            }
            
            // Clean up subscription
            setTimeout(() => {
              subscription.unsubscribe();
            }, 3000);
            
          } catch (err) {
            console.error("[Auth Callback] Error in code exchange:", err);
            // Still try to check auth
            await checkAuth();
          }
        } else {
          console.log("[Auth Callback] No code found, checking auth state...");
          setStatus("Checking authentication...");
          await checkAuth();
        }

        // Wait a moment then check if authenticated
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Final check - verify session exists (check multiple times to be sure)
        let finalSession = null;
        for (let i = 0; i < 3; i++) {
          const { data: checkData } = await supabase.auth.getSession();
          if (checkData?.session) {
            finalSession = checkData.session;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (finalSession) {
          console.log("[Auth Callback] ✅ Final check: Session confirmed!");
          console.log("[Auth Callback] User ID:", finalSession.user.id);
          console.log("[Auth Callback] User email:", finalSession.user.email);
          setStatus("Sign in successful!");
          
          // Ensure auth store is updated
          await checkAuth();
          
          // Wait a moment for auth store to update
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Final verification before redirecting
          const { data: verifySession } = await supabase.auth.getSession();
          if (verifySession?.session && !hasRedirectedRef.current) {
            hasRedirectedRef.current = true;
            console.log("[Auth Callback] ✅ Redirecting to app...");
            // Use replace to prevent back navigation to callback
            router.replace("/(tabs)/record");
            return; // Exit early to prevent further processing
          }
        } else {
          console.log("[Auth Callback] ⚠️ Final check: No session after retries");
          setStatus("Authentication failed - no session");
          
          // Try one more checkAuth call
          await checkAuth();
          
          // Wait and do final check
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: retrySession } = await supabase.auth.getSession();
          if (!retrySession?.session && !hasRedirectedRef.current) {
            hasRedirectedRef.current = true;
            console.log("[Auth Callback] ❌ No session found, redirecting to signin");
            router.replace("/(auth)/signin");
          } else if (retrySession?.session && !hasRedirectedRef.current) {
            hasRedirectedRef.current = true;
            console.log("[Auth Callback] ✅ Session found on retry, redirecting...");
            router.replace("/(tabs)/record");
          }
        }
      } catch (err) {
        console.error("[Auth Callback] Error processing callback:", err);
        setStatus("Error occurred");
        await checkAuth();
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          setTimeout(() => {
            router.replace("/(auth)/signin");
          }, 2000);
        }
      }
    };

    handleCallback();
  }, [params, isAuthenticated, router, checkAuth]);

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
      <ActivityIndicator size="large" color="#34C759" />
      <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>
        {status}
      </Text>
    </SafeAreaView>
  );
}

