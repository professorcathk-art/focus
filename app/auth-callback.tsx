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
            // Set up auth state change listener FIRST (before any operations)
            let sessionReceived = false;
            let subscriptionCleanup: (() => void) | null = null;
            let processingComplete = false; // Prevent multiple processing
            
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
              // Prevent processing if already complete
              if (processingComplete || sessionReceived) {
                return;
              }
              
              console.log("[Auth Callback] 🔄 Auth state changed:", event, "Has session:", !!session);
              if (session && session.user) {
                sessionReceived = true;
                processingComplete = true;
                console.log("[Auth Callback] ✅ Session received via auth state change!");
                console.log("[Auth Callback] User ID:", session.user.id);
                
                // Clean up subscription immediately
                if (subscriptionCleanup) {
                  subscriptionCleanup();
                }
                
                // Update auth store
                await checkAuth();
                
                // Wait a moment for store to update
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Redirect immediately when session is received
                if (!hasRedirectedRef.current) {
                  hasRedirectedRef.current = true;
                  console.log("[Auth Callback] ✅ Redirecting immediately after auth state change...");
                  try {
                    router.replace("/(tabs)/record");
                    return; // Exit early
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
            });
            
            subscriptionCleanup = () => subscription.unsubscribe();
            
            // Wait a moment for listener to be set up
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Try to get session immediately (Supabase might have already set it)
            const { data: immediateSession } = await supabase.auth.getSession();
            
            if (immediateSession?.session && !sessionReceived && !processingComplete) {
              console.log("[Auth Callback] ✅ Session found immediately!");
              sessionReceived = true;
              processingComplete = true;
              
              // Clean up subscription
              if (subscriptionCleanup) {
                subscriptionCleanup();
              }
              
              await checkAuth();
              
              // Wait a moment for store to update
              await new Promise(resolve => setTimeout(resolve, 200));
              
              // Redirect immediately
              if (!hasRedirectedRef.current) {
                hasRedirectedRef.current = true;
                try {
                  router.replace("/(tabs)/record");
                  return; // Exit early - don't continue to manual exchange
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
              return;
            }
            
            // If no immediate session, try manual exchange (for PKCE flow)
            if (!sessionReceived && !processingComplete) {
              // Get the code verifier from SecureStore
              const projectRef = SUPABASE_URL.split('//')[1]?.split('.')[0] || 'wqvevludffkemgicrfos';
              const codeVerifierKey = `sb-${projectRef}-auth-code-verifier`;
              const codeVerifier = await SecureStore.getItemAsync(codeVerifierKey);
              
              console.log("[Auth Callback] Code verifier found:", !!codeVerifier);
              
              if (codeVerifier) {
                // Manual token exchange for PKCE flow
                const exchangeUrl = `${SUPABASE_URL}/auth/v1/token`;
                
                const requestBody = new URLSearchParams({
                  grant_type: 'authorization_code',
                  code: code,
                  redirect_uri: 'focus://auth-callback',
                  code_verifier: codeVerifier,
                });
                
                const response = await fetch(exchangeUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'apikey': SUPABASE_ANON_KEY,
                  },
                  body: requestBody.toString(),
                });
                
                const exchangeData = await response.json();
                
                if (exchangeData.access_token) {
                  console.log("[Auth Callback] ✅ Token exchange successful!");
                  const { data: sessionData, error: setError } = await supabase.auth.setSession({
                    access_token: exchangeData.access_token,
                    refresh_token: exchangeData.refresh_token,
                  });
                  
                  if (!setError && sessionData?.session && !sessionReceived && !processingComplete) {
                    console.log("[Auth Callback] ✅ Session set successfully!");
                    sessionReceived = true;
                    processingComplete = true;
                    
                    // Clean up subscription
                    if (subscriptionCleanup) {
                      subscriptionCleanup();
                    }
                    
                    await checkAuth();
                    
                    // Wait a moment for store to update
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    // Redirect immediately
                    if (!hasRedirectedRef.current) {
                      hasRedirectedRef.current = true;
                      try {
                        router.replace("/(tabs)/record");
                        return; // Exit early
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
                    return;
                  } else if (setError) {
                    console.error("[Auth Callback] Error setting session:", setError);
                  }
                } else {
                  console.error("[Auth Callback] Token exchange failed:", exchangeData);
                }
              }
            }
            
            // If we still don't have a session, wait for auth state change (with timeout)
            if (!sessionReceived && !processingComplete) {
              let attempts = 0;
              const maxAttempts = 8; // 4 seconds total (reduced from 10)
              
              while (!sessionReceived && !processingComplete && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 500));
                const { data: checkData } = await supabase.auth.getSession();
                if (checkData?.session) {
                  console.log("[Auth Callback] ✅ Session found during wait!");
                  sessionReceived = true;
                  processingComplete = true;
                  
                  // Clean up subscription
                  if (subscriptionCleanup) {
                    subscriptionCleanup();
                  }
                  
                  await checkAuth();
                  
                  // Wait a moment for store to update
                  await new Promise(resolve => setTimeout(resolve, 200));
                  
                  // Redirect immediately
                  if (!hasRedirectedRef.current) {
                    hasRedirectedRef.current = true;
                    try {
                      router.replace("/(tabs)/record");
                      return;
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
                  break;
                }
                attempts++;
              }
              
              // Clean up subscription after timeout
              if (subscriptionCleanup && !processingComplete) {
                setTimeout(() => {
                  subscriptionCleanup();
                }, 1000);
              }
            }
            
          } catch (err) {
            console.error("[Auth Callback] Error in code exchange:", err);
            // Still try to check auth and redirect
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

