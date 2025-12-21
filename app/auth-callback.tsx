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
        // Extract parameters - could be OAuth code, email verification token, or error
        const code = params.code as string;
        const token = params.token as string; // Email verification token
        const type = params.type as string; // 'signup' for email verification
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

        // Handle email verification token (from email confirmation link)
        if (token && type === 'signup') {
          console.log("[Auth Callback] 📧 Email verification token detected");
          setStatus("Verifying email...");
          
          try {
            // Verify the email token with Supabase
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'signup'
            });

            if (verifyError) {
              console.error("[Auth Callback] Email verification error:", verifyError);
              setStatus("Email verification failed");
              
              // Try alternative method - sometimes Supabase auto-verifies via redirect
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session) {
                console.log("[Auth Callback] ✅ Session found after email verification");
                await checkAuth();
                if (!hasRedirectedRef.current) {
                  hasRedirectedRef.current = true;
                  setTimeout(() => {
                    router.replace("/(tabs)/record");
                  }, 500);
                }
                return;
              }
              
              if (!hasRedirectedRef.current) {
                hasRedirectedRef.current = true;
                setTimeout(() => {
                  router.replace("/(auth)/signin");
                }, 2000);
              }
              return;
            }

            if (verifyData?.session) {
              console.log("[Auth Callback] ✅ Email verified successfully!");
              await checkAuth();
              if (!hasRedirectedRef.current) {
                hasRedirectedRef.current = true;
                setTimeout(() => {
                  router.replace("/(tabs)/record");
                }, 500);
              }
              return;
            }

            // If no session yet, wait a moment and check again
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: finalSession } = await supabase.auth.getSession();
            if (finalSession?.session) {
              console.log("[Auth Callback] ✅ Session found after email verification wait");
              await checkAuth();
              if (!hasRedirectedRef.current) {
                hasRedirectedRef.current = true;
                setTimeout(() => {
                  router.replace("/(tabs)/record");
                }, 500);
              }
              return;
            }

            // If still no session, redirect to sign in
            setStatus("Please sign in");
            if (!hasRedirectedRef.current) {
              hasRedirectedRef.current = true;
              setTimeout(() => {
                router.replace("/(auth)/signin");
              }, 2000);
            }
            return;
          } catch (verifyErr) {
            console.error("[Auth Callback] Error verifying email:", verifyErr);
            setStatus("Verification error");
            if (!hasRedirectedRef.current) {
              hasRedirectedRef.current = true;
              setTimeout(() => {
                router.replace("/(auth)/signin");
              }, 2000);
            }
            return;
          }
        }

        // Handle OAuth code (from Google/Apple OAuth)
        if (code) {
          console.log("[Auth Callback] Found OAuth code:", code.substring(0, 20) + "...");
          setStatus("Signing in...");
          
          try {
            // CRITICAL: Use Supabase's exchangeCodeForSession() method FIRST
            // This is the proper way to exchange OAuth code for session
            // It handles PKCE code verifier automatically
            console.log("[Auth Callback] Using Supabase's exchangeCodeForSession()...");
            
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error("[Auth Callback] ❌ exchangeCodeForSession error:", exchangeError);
              // Fall back to manual exchange
              console.log("[Auth Callback] Falling back to manual code exchange...");
            } else if (exchangeData?.session) {
              console.log("[Auth Callback] ✅ exchangeCodeForSession succeeded! User:", exchangeData.session.user.email);
              await checkAuth();
              if (!hasRedirectedRef.current) {
                hasRedirectedRef.current = true;
                setStatus("Sign in successful!");
                setTimeout(() => {
                  try {
                    router.replace("/(tabs)/record");
                  } catch (err) {
                    console.error("[Auth Callback] Redirect error:", err);
                  }
                }, 100);
              }
              return; // Success - exit early
            }
            
            // Fallback: Try to use Supabase's built-in session detection
            // Supabase might have automatically handled PKCE code exchange
            console.log("[Auth Callback] Checking for automatic session...");
            
            // Wait a moment for Supabase to process the callback
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check if Supabase automatically created a session
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionData?.session && sessionData.session.user) {
              console.log("[Auth Callback] ✅ Session found automatically! User:", sessionData.session.user.email);
              await checkAuth();
              if (!hasRedirectedRef.current) {
                hasRedirectedRef.current = true;
                setStatus("Sign in successful!");
                setTimeout(() => {
                  try {
                    router.replace("/(tabs)/record");
                  } catch (err) {
                    console.error("[Auth Callback] Redirect error:", err);
                  }
                }, 100);
              }
              return;
            }
            
            // If no session, try manual code exchange with Supabase's stored code verifier
            console.log("[Auth Callback] No automatic session, trying manual exchange...");
            
            // Try different possible key formats for code verifier
            const projectRef = SUPABASE_URL.split('//')[1]?.split('.')[0] || 'wqvevludffkemgicrfos';
            const possibleKeys = [
              `sb-${projectRef}-auth-code-verifier`,
              `${SUPABASE_URL}#auth-code-verifier`,
              `sb-auth-code-verifier`,
            ];
            
            let codeVerifier: string | null = null;
            for (const key of possibleKeys) {
              try {
                const verifier = await SecureStore.getItemAsync(key);
                if (verifier) {
                  codeVerifier = verifier;
                  console.log(`[Auth Callback] ✅ Found code verifier with key: ${key}`);
                  break;
                }
              } catch (e) {
                // Continue to next key
              }
            }
            
            if (!codeVerifier) {
              console.error("[Auth Callback] ❌ Code verifier not found in any expected location");
              console.log("[Auth Callback] Tried keys:", possibleKeys);
              
              // Try one more time to get session (might have been set by Supabase in the meantime)
              // Sometimes Supabase handles PKCE automatically even without explicit code verifier
              await new Promise(resolve => setTimeout(resolve, 1000));
              const { data: retrySession } = await supabase.auth.getSession();
              if (retrySession?.session) {
                console.log("[Auth Callback] ✅ Session found on retry!");
                await checkAuth();
                if (!hasRedirectedRef.current) {
                  hasRedirectedRef.current = true;
                  setStatus("Sign in successful!");
                  setTimeout(() => {
                    try {
                      router.replace("/(tabs)/record");
                    } catch (err) {
                      console.error("[Auth Callback] Redirect error:", err);
                    }
                  }, 100);
                }
                return;
              }
              
              setStatus("Authentication error - missing code verifier");
              if (!hasRedirectedRef.current) {
                hasRedirectedRef.current = true;
                setTimeout(() => router.replace("/(auth)/signin"), 2000);
              }
              return;
            }
            
            // Exchange code for tokens
            const exchangeUrl = `${SUPABASE_URL}/auth/v1/token`;
            const requestBody = new URLSearchParams({
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: 'focus://auth-callback',
              code_verifier: codeVerifier,
            });
            
            console.log("[Auth Callback] Exchanging code for tokens...");
            const response = await fetch(exchangeUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'apikey': SUPABASE_ANON_KEY,
              },
              body: requestBody.toString(),
            });
            
            const exchangeData = await response.json();
            
            if (exchangeData.error) {
              console.error("[Auth Callback] ❌ Token exchange error:", exchangeData);
              setStatus("Authentication failed");
              if (!hasRedirectedRef.current) {
                hasRedirectedRef.current = true;
                setTimeout(() => router.replace("/(auth)/signin"), 2000);
              }
              return;
            }
            
            if (exchangeData.access_token) {
              console.log("[Auth Callback] ✅ Token exchange successful!");
              
              // Set the session
              const { data: setSessionData, error: setError } = await supabase.auth.setSession({
                access_token: exchangeData.access_token,
                refresh_token: exchangeData.refresh_token,
              });
              
              if (setError) {
                console.error("[Auth Callback] ❌ Error setting session:", setError);
                setStatus("Authentication failed");
                if (!hasRedirectedRef.current) {
                  hasRedirectedRef.current = true;
                  setTimeout(() => router.replace("/(auth)/signin"), 2000);
                }
                return;
              }
              
              if (setSessionData?.session && setSessionData.session.user) {
                console.log("[Auth Callback] ✅ Session set successfully! User:", setSessionData.session.user.email);
                await checkAuth();
                if (!hasRedirectedRef.current) {
                  hasRedirectedRef.current = true;
                  setStatus("Sign in successful!");
                  setTimeout(() => {
                    try {
                      router.replace("/(tabs)/record");
                    } catch (err) {
                      console.error("[Auth Callback] Redirect error:", err);
                    }
                  }, 100);
                }
                return;
              }
            }
            
            // Final fallback - check session one more time
            await new Promise(resolve => setTimeout(resolve, 500));
            const { data: finalSession } = await supabase.auth.getSession();
            if (finalSession?.session && !hasRedirectedRef.current) {
              hasRedirectedRef.current = true;
              await checkAuth();
              setStatus("Sign in successful!");
              setTimeout(() => {
                try {
                  router.replace("/(tabs)/record");
                } catch (err) {
                  console.error("[Auth Callback] Redirect error:", err);
                }
              }, 100);
              return;
            }
            
            setStatus("Authentication failed");
            if (!hasRedirectedRef.current) {
              hasRedirectedRef.current = true;
              setTimeout(() => router.replace("/(auth)/signin"), 2000);
            }
            
          } catch (err) {
            console.error("[Auth Callback] ❌ Error in code exchange:", err);
            setStatus("Authentication error");
            await checkAuth();
            if (!hasRedirectedRef.current) {
              hasRedirectedRef.current = true;
              setTimeout(() => router.replace("/(auth)/signin"), 2000);
            }
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
            try {
              router.replace("/(tabs)/record");
            } catch (redirectError) {
              console.error("[Auth Callback] Redirect error:", redirectError);
              // Fallback: try navigating after a delay
              setTimeout(() => {
                try {
                  router.replace("/(tabs)/record");
                } catch (e) {
                  console.error("[Auth Callback] Fallback redirect failed:", e);
                }
              }, 500);
            }
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
            try {
              router.replace("/(tabs)/record");
            } catch (redirectError) {
              console.error("[Auth Callback] Redirect error:", redirectError);
              setTimeout(() => {
                try {
                  router.replace("/(tabs)/record");
                } catch (e) {
                  console.error("[Auth Callback] Fallback redirect failed:", e);
                }
              }, 500);
            }
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

