/**
 * Zustand store for authentication state
 * Uses Supabase Auth
 */

import { create } from "zustand";
import { User } from "@/types";
import { supabase } from "@/lib/supabase";
import { Session, AuthError } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
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
      // For email confirmation, Supabase requires a web-accessible URL (HTTP/HTTPS)
      // Use Site URL (not callback URL) - Supabase will redirect here after processing confirmation
      // The app will detect the session via onAuthStateChange listener
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://wqvevludffkemgicrfos.supabase.co";
      
      // Use Site URL as redirectTo - this MUST be set as Site URL in Supabase settings
      // Go to: Supabase Dashboard → Authentication → URL Configuration → Site URL
      const redirectUrl = supabaseUrl; // Site URL, not callback URL
      
      console.log("[Auth] Attempting sign up for:", email);
      console.log("[Auth] Email redirect URL:", redirectUrl);
      console.log("[Auth] Note: This URL must be added to Supabase's allowed redirect URLs");
      
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
        });
        throw new Error(error.message || "Sign up failed");
      }

      // If email confirmation is required, no session will be returned
      if (!data.session) {
        // User created but needs to confirm email
        console.log("[Auth] ✅ Sign up successful - email confirmation required");
        console.log("[Auth] User ID:", data.user?.id);
        // Return success result indicating email confirmation is needed
        return {
          success: true,
          requiresEmailConfirmation: true,
        };
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
      // 3. Supabase redirects to redirectTo URL (should be Site URL, not callback URL)
      // 4. App detects session via onAuthStateChange listener
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://wqvevludffkemgicrfos.supabase.co";
      // Use Site URL as redirectTo, NOT callback URL
      // After Supabase processes callback, it redirects here (which is fine for web)
      // For mobile, the app will detect the session regardless
      const redirectUrl = supabaseUrl; // Site URL, not callback URL
      
      console.log("[Auth] 🔵 Initiating Google sign in");
      console.log("[Auth] Redirect URL (Site URL):", redirectUrl);
      console.log("[Auth] Note: Using Site URL, not callback URL, to avoid redirect loop");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl, // Site URL - Supabase will redirect here after processing callback
          skipBrowserRedirect: false,
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
      console.log("[Auth] Opening browser for Google sign-in...");
      
      // Manually open the OAuth URL in browser
      // In React Native, signInWithOAuth doesn't automatically open the browser
      const canOpen = await Linking.canOpenURL(data.url);
      if (canOpen) {
        await Linking.openURL(data.url);
        console.log("[Auth] ✅ Browser opened successfully");
      } else {
        console.error("[Auth] ❌ Cannot open URL:", data.url);
        throw new Error("Cannot open browser for Google sign-in");
      }
      
      // OAuth will redirect to browser, then back to app
      // Session will be set via onAuthStateChange listener
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
            `1. Supabase Apple Sign-In Client ID doesn't match your app's bundle identifier\n` +
            `2. Your bundle identifier is: com.focuscircle\n` +
            `3. Make sure Supabase → Authentication → Providers → Apple → Client ID is set to: com.focuscircle.signin\n` +
            `4. Verify your Apple Developer Portal Service ID matches: com.focuscircle.signin`;
          throw new Error(errorMsg);
        }
        
        throw new Error(error.message || "Apple sign in failed");
      }

      if (!data.session || !data.user) {
        console.error("[Auth] ❌ No session received after Apple sign in");
        throw new Error("No session received after Apple sign in");
      }

      // Extract user name from Apple credential or user metadata
      const userName = credential.fullName
        ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
        : data.user.user_metadata?.full_name
        || data.user.user_metadata?.name
        || data.user.email?.split("@")[0]
        || "User";

      // Update user metadata with name if available
      if (credential.fullName && !data.user.user_metadata?.name) {
        await supabase.auth.updateUser({
          data: {
            name: userName,
            full_name: userName,
          },
        });
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
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.log("[Auth] Error getting session:", error);
        set({ user: null, session: null, isAuthenticated: false, isLoading: false });
        return;
      }

      if (!session || !session.user) {
        set({ user: null, session: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name || session.user.email?.split("@")[0],
        createdAt: session.user.created_at,
        updatedAt: session.user.updated_at || session.user.created_at,
      };

      set({ user, session, isAuthenticated: true, isLoading: false });

      // Listen for auth changes (including OAuth redirects)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("[Auth] 🔄 Auth state changed:", {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
        });
        
        if (session && session.user) {
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || session.user.email?.split("@")[0],
            createdAt: session.user.created_at,
            updatedAt: session.user.updated_at || session.user.created_at,
          };
          console.log("[Auth] ✅ User authenticated:", user.email);
          set({ user, session, isAuthenticated: true, isLoading: false });
        } else {
          console.log("[Auth] ⚠️ User signed out or no session");
          set({ user: null, session: null, isAuthenticated: false, isLoading: false });
        }
      });
      
      // Note: Subscription cleanup happens when component unmounts
      // For Zustand store, we keep the listener active
    } catch (error) {
      console.error("[Auth] Check auth error:", error);
      set({ user: null, session: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

