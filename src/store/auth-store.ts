/**
 * Zustand store for authentication state
 * Uses Supabase Auth
 */

import { create } from "zustand";
import { User } from "@/types";
import { supabase } from "@/lib/supabase";
import { Session, AuthError } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";

interface SignUpResult {
  success: boolean;
  requiresEmailConfirmation?: boolean;
  user?: User;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<SignUpResult>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  session: null,

  signIn: async (email: string, password: string) => {
    try {
      console.log("[Auth] Attempting sign in for:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[Auth] Sign in error from Supabase:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        throw new Error(error.message || "Sign in failed");
      }

      if (!data.session || !data.user) {
        console.error("[Auth] No session received after sign in:", {
          hasSession: !!data.session,
          hasUser: !!data.user,
        });
        throw new Error("No session received");
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
        createdAt: data.user.created_at,
        updatedAt: data.user.updated_at || data.user.created_at,
      };

      console.log("[Auth] ✅ Sign in successful:", {
        userId: user.id,
        email: user.email,
        hasSession: !!data.session,
      });
      set({ user, session: data.session, isAuthenticated: true });
    } catch (error) {
      console.error("[Auth] ❌ Sign in error:", error);
      throw error;
    }
  },

  signUp: async (email: string, password: string, name?: string): Promise<SignUpResult> => {
    try {
      // CRITICAL: Check if user already exists BEFORE attempting signup
      // Try to sign in first - if it succeeds, user exists
      console.log("[Auth] Checking if user already exists for:", email);
      try {
        const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        // If sign in succeeds, user already exists!
        if (existingUser?.user && !checkError) {
          console.log("[Auth] ⚠️ User already exists - sign in succeeded");
          // Sign out immediately to prevent auto-login
          await supabase.auth.signOut();
          throw new Error("EMAIL_EXISTS");
        }
        
        // If sign in fails with "Invalid login credentials", user doesn't exist (or wrong password)
        // This is expected - we'll proceed with signup
        if (checkError && checkError.message?.includes("Invalid login credentials")) {
          console.log("[Auth] User doesn't exist (or wrong password), proceeding with signup");
        } else if (checkError && !checkError.message?.includes("Invalid login credentials")) {
          // Other errors might indicate user exists but password is wrong
          // Or account is disabled, etc. - still treat as existing user
          console.log("[Auth] ⚠️ Sign in check returned error (might be existing user):", checkError.message);
          // Don't throw here - let Supabase signUp handle it, but we'll check response carefully
        }
      } catch (checkErr) {
        // If check throws EMAIL_EXISTS, re-throw it
        if (checkErr instanceof Error && checkErr.message === "EMAIL_EXISTS") {
          throw checkErr;
        }
        // Otherwise, continue with signup attempt
        console.log("[Auth] Check error (continuing with signup):", checkErr);
      }
      
      // For email confirmation, use deep link so app can intercept
      // Use simple format that Supabase accepts: focus://auth-callback
      const redirectUrl = 'focus://auth-callback'; // Simple deep link format
      
      console.log("[Auth] Attempting sign up for:", email);
      console.log("[Auth] Email redirect URL:", redirectUrl);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split("@")[0],
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error("[Auth] Sign up error from Supabase:", {
          message: error.message,
          status: error.status,
          name: error.name,
          code: (error as any).code,
        });
        
        // Check if email already exists - Supabase returns various error messages and codes
        const errorMsg = error.message?.toLowerCase() || '';
        const errorCode = (error as any).code?.toLowerCase() || '';
        
        // Common Supabase error codes/messages for existing email:
        // - "User already registered"
        // - "Email already registered"  
        // - Error code: "user_already_registered"
        // - Status 422 (validation error)
        if (errorMsg.includes('already registered') || 
            errorMsg.includes('user already registered') ||
            errorMsg.includes('email already exists') ||
            errorMsg.includes('already been registered') ||
            errorCode.includes('user_already_registered') ||
            error.status === 422) {
          throw new Error("EMAIL_EXISTS");
        }
        
        throw new Error(error.message || "Sign up failed");
      }

      // CRITICAL: Check if user already exists BEFORE checking for email confirmation
      // Supabase might return data.user for existing users even without an error
      if (data.user) {
        // Check if email is already confirmed - if so, user definitely exists
        if (data.user.email_confirmed_at) {
          console.log("[Auth] ⚠️ User exists - email already confirmed, redirecting to sign in");
          throw new Error("EMAIL_EXISTS");
        }
        
        // Additional check: If user has last_sign_in_at, they've logged in before
        if (data.user.last_sign_in_at) {
          console.log("[Auth] ⚠️ User exists - has previous sign-in history, redirecting to sign in");
          throw new Error("EMAIL_EXISTS");
        }
        
        const userCreatedAt = new Date(data.user.created_at);
        const now = new Date();
        const timeDiff = now.getTime() - userCreatedAt.getTime();
        const secondsDiff = timeDiff / 1000;
        
        // If user was created more than 5 seconds ago, they likely already exist
        // (new signups should have created_at within milliseconds)
        // Using 5 seconds instead of 1 to be more reliable
        if (secondsDiff > 5) {
          console.log("[Auth] ⚠️ User exists (created " + Math.round(secondsDiff) + " seconds ago), redirecting to sign in");
          throw new Error("EMAIL_EXISTS");
        }
      }

      // If email confirmation is required, no session will be returned
      if (!data.session && data.user) {
        // Double-check: If user email is already confirmed, they exist
        if (data.user.email_confirmed_at) {
          console.log("[Auth] ⚠️ User exists - email already confirmed (no session but confirmed), redirecting to sign in");
          throw new Error("EMAIL_EXISTS");
        }
        
        // User created but needs to confirm email (new signup)
        console.log("[Auth] ✅ Sign up successful - email confirmation required");
        console.log("[Auth] User ID:", data.user?.id);
        return {
          success: true,
          requiresEmailConfirmation: true,
        };
      }
      
      // If no user returned and no session, treat as error
      if (!data.user && !data.session) {
        throw new Error("Sign up failed - no user data returned");
      }

      if (!data.user) {
        console.error("[Auth] ❌ User created but user data not available");
        throw new Error("Account created but user data not available. Please check your email.");
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name || name || data.user.email?.split("@")[0],
        createdAt: data.user.created_at,
        updatedAt: data.user.updated_at || data.user.created_at,
      };

      console.log("[Auth] ✅ Sign up successful - user signed in:", {
        userId: user.id,
        email: user.email,
        hasSession: !!data.session,
      });
      set({ user, session: data.session, isAuthenticated: true });
      
      return {
        success: true,
        requiresEmailConfirmation: false,
        user,
      };
    } catch (error) {
      console.error("[Auth] ❌ Sign up error:", error);
      throw error;
    }
  },

  signInWithGoogle: async () => {
    try {
      // For React Native OAuth flow:
      // 1. Google redirects to Supabase callback (/auth/v1/callback)
      // 2. Supabase processes OAuth and creates session
      // 3. Supabase redirects to redirectTo URL (deep link)
      // 4. App intercepts deep link and exchanges code for session
      // Use simple format that Supabase accepts: focus://auth-callback
      const redirectUrl = 'focus://auth-callback'; // Simple deep link format
      
      console.log("[Auth] 🔵 Initiating Google sign in");
      console.log("[Auth] Redirect URL (Deep Link):", redirectUrl);
      console.log("[Auth] Note: Using deep link so app can intercept OAuth callback");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl, // Deep link - app will intercept this
          skipBrowserRedirect: false,
          queryParams: {
            // Force Google to ask for re-authentication (password/2FA)
            // This ensures users verify their identity even if already logged into Google
            prompt: 'select_account', // Shows account picker and asks for password/2FA
            access_type: 'offline', // Request refresh token
          },
        },
      });

      if (error) {
        console.error("[Auth] ❌ Google sign in error from Supabase:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        throw new Error(error.message || "Google sign in failed");
      }

      if (!data.url) {
        throw new Error("No OAuth URL returned from Supabase");
      }

      console.log("[Auth] ✅ Google sign in initiated");
      console.log("[Auth] OAuth URL:", data.url);
      console.log("[Auth] Opening in-app browser for Google sign-in...");
      
      // Use expo-web-browser for in-app browser experience
      // This uses Chrome Custom Tabs on Android and SFSafariViewController on iOS
      // Provides better UX than external browser while maintaining security
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl, // Deep link that app will intercept
        {
          // Show browser controls for better security indicators
          showInRecents: false, // Don't show in recent apps
          enableBarCollapsing: false, // Keep browser bar visible
        }
      );
      
      if (result.type === 'cancel') {
        console.log("[Auth] ⚠️ User cancelled Google sign in");
        throw new Error("Google sign in was cancelled");
      }
      
      if (result.type === 'dismiss') {
        console.log("[Auth] ⚠️ Google sign in browser was dismissed");
        throw new Error("Google sign in was dismissed");
      }
      
      console.log("[Auth] ✅ In-app browser closed");
      console.log("[Auth] Browser result type:", result.type);
      console.log("[Auth] Browser result URL:", result.url);
      
      // Check if we got a redirect URL with auth code
      if (result.type === 'success' && result.url) {
        console.log("[Auth] ✅ Got redirect URL from browser:", result.url);
        
        // Parse the URL to extract code or access_token
        // Handle both regular URLs and deep links (focus://)
        let code: string | null = null;
        let hasAccessToken = false;
        
        try {
          // Try parsing as regular URL first
          const url = new URL(result.url);
          code = url.searchParams.get('code') || url.hash.match(/code=([^&]+)/)?.[1] || null;
          hasAccessToken = !!url.searchParams.get('access_token') || url.hash.includes('access_token');
        } catch (urlError) {
          // If URL parsing fails (e.g., deep link), parse manually
          console.log("[Auth] URL parsing failed, parsing manually:", urlError);
          const codeMatch = result.url.match(/[?&#]code=([^&]+)/);
          code = codeMatch ? codeMatch[1] : null;
          hasAccessToken = result.url.includes('access_token');
        }
        
        if (code) {
          console.log("[Auth] ✅ Found OAuth code, exchanging for session...");
          // Exchange code for session
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error("[Auth] ❌ Code exchange error:", exchangeError);
            // Fallback: check if session was created automatically
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session) {
              console.log("[Auth] ✅ Session found after code exchange error");
              await checkAuth();
              return;
            }
            throw new Error(exchangeError.message || "Failed to exchange code for session");
          }
          
          if (exchangeData?.session) {
            console.log("[Auth] ✅ Code exchanged successfully, session created");
            await checkAuth();
            return;
          }
        }
        
        // If no code but URL contains access_token or session info, check session
        if (hasAccessToken) {
          console.log("[Auth] ✅ Found access_token in URL, checking session...");
          await new Promise(resolve => setTimeout(resolve, 500));
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            console.log("[Auth] ✅ Session found from access_token");
            await checkAuth();
            return;
          }
        }
      }
      
      // Fallback: Wait and check session (Supabase might have created it automatically)
      console.log("[Auth] ⏳ Waiting for session to be created...");
      await new Promise(resolve => setTimeout(resolve, 1500));
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        console.log("[Auth] ✅ Session found after wait");
        await checkAuth();
        return;
      }
      
      // If still no session, the deep link handler should have processed it
      // But log a warning
      console.log("[Auth] ⚠️ No session found yet, deep link handler should process it");
    } catch (error) {
      console.error("[Auth] ❌ Google sign in error:", error);
      throw error;
    }
  },

  signInWithApple: async () => {
    try {
      // Apple Sign-In only works on iOS
      if (Platform.OS !== 'ios') {
        throw new Error("Apple Sign-In is only available on iOS");
      }

      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error("Apple Sign-In is not available on this device");
      }

      console.log("[Auth] 🍎 Initiating Apple sign in");

      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log("[Auth] ✅ Apple authentication successful:", {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
      });

      // Exchange Apple credential for Supabase session
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
        nonce: credential.nonce || undefined,
      });

      if (error) {
        console.error("[Auth] ❌ Apple sign in error from Supabase:", {
          message: error.message,
          status: error.status,
          name: error.name,
          fullError: JSON.stringify(error, null, 2),
        });
        
        // Check if error is due to bundle identifier mismatch
        if (error.message?.includes('host.exp.Exponent') || 
            error.message?.includes('Unacceptable audience') ||
            error.message?.includes('audience') ||
            error.message?.includes('bundle identifier')) {
          const errorMsg = `Apple Sign-In configuration error: ${error.message}\n\n` +
            `This usually means:\n` +
            `1. Supabase Apple Sign-In Client ID doesn't match the token audience\n` +
            `2. Your bundle identifier is: com.focuscircle\n` +
            `3. For native iOS apps, Supabase Client ID must be the App ID: com.focuscircle\n` +
            `4. Go to Supabase → Authentication → Providers → Apple → Client ID and set it to: com.focuscircle`;
          throw new Error(errorMsg);
        }
        
        throw new Error(error.message || "Apple sign in failed");
      }

      if (!data.session || !data.user) {
        console.error("[Auth] ❌ No session received after Apple sign in");
        throw new Error("No session received after Apple sign in");
      }

      // Extract user name from Apple credential or user metadata
      // Apple only provides fullName on FIRST sign-in, so check metadata first
      let userName = data.user.user_metadata?.full_name 
        || data.user.user_metadata?.name
        || (credential.fullName 
          ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
          : null)
        || data.user.email?.split("@")[0]
        || "User";

      // Update user metadata with name if we got it from Apple and it's not already stored
      if (credential.fullName && !data.user.user_metadata?.name && !data.user.user_metadata?.full_name) {
        const appleName = `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim();
        if (appleName) {
          userName = appleName;
          try {
            await supabase.auth.updateUser({
              data: {
                name: userName,
                full_name: userName,
              },
            });
            console.log("[Auth] ✅ Updated user metadata with Apple name:", userName);
          } catch (updateError) {
            console.error("[Auth] ⚠️ Failed to update user metadata:", updateError);
            // Continue anyway - name is still set locally
          }
        }
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email || credential.email || "",
        name: userName,
        createdAt: data.user.created_at,
        updatedAt: data.user.updated_at || data.user.created_at,
      };

      console.log("[Auth] ✅ Apple sign in successful:", {
        userId: user.id,
        email: user.email,
        name: user.name,
        hasSession: !!data.session,
      });

      set({ user, session: data.session, isAuthenticated: true });
    } catch (error: any) {
      console.error("[Auth] ❌ Apple sign in error:", error);
      
      // Handle user cancellation gracefully
      if (error.code === 'ERR_REQUEST_CANCELED') {
        throw new Error("Apple sign in was cancelled");
      }
      
      throw error;
    }
  },

  signOut: async () => {
    try {
      const currentUserId = useAuthStore.getState().user?.id;
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
      }
      
      // Clear todos cache for this user to prevent cross-account data leakage
      if (currentUserId) {
        const { clearAllCacheForUser } = await import("@/lib/todos-cache");
        await clearAllCacheForUser(currentUserId);
      }
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      set({ user: null, session: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    try {
      // Use try-catch to prevent crashes
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.log("[Auth] Error getting session:", error);
        // Use functional update to prevent race conditions
        set((state) => ({ ...state, user: null, session: null, isAuthenticated: false, isLoading: false }));
        return;
      }

      if (!session || !session.user) {
        // Use functional update to prevent race conditions
        set((state) => ({ ...state, user: null, session: null, isAuthenticated: false, isLoading: false }));
        return;
      }

      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name || session.user.email?.split("@")[0],
        createdAt: session.user.created_at,
        updatedAt: session.user.updated_at || session.user.created_at,
      };

      // Atomic state update using functional form to prevent crashes
      set((state) => ({
        ...state,
        user,
        session,
        isAuthenticated: true,
        isLoading: false,
      }));
      
      // Note: onAuthStateChange listener is handled in app/_layout.tsx and app/auth-callback.tsx
      // Don't add another listener here to prevent conflicts and crashes
    } catch (error) {
      console.error("[Auth] Error in checkAuth:", error);
      // Use functional update to prevent race conditions
      set((state) => ({ ...state, user: null, session: null, isAuthenticated: false, isLoading: false }));
    }
  },
}));

