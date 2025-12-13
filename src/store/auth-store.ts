/**
 * Zustand store for authentication state
 * Uses Supabase Auth
 */

import { create } from "zustand";
import { User } from "@/types";
import { supabase } from "@/lib/supabase";
import { Session, AuthError } from "@supabase/supabase-js";
import * as Linking from "expo-linking";

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
      // We'll use Supabase's callback URL, which will handle the redirect
      // The app will detect the session via deep linking
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://wqvevludffkemgicrfos.supabase.co";
      const redirectUrl = `${supabaseUrl}/auth/v1/callback`;
      
      console.log("[Auth] Attempting sign up for:", email);
      console.log("[Auth] Redirect URL (Supabase callback):", redirectUrl);
      
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
      // Use app scheme for redirect (focus://)
      const redirectUrl = Linking.createURL('/(auth)/signin');
      console.log("[Auth] 🔵 Initiating Google sign in");
      console.log("[Auth] Redirect URL:", redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
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

      // OAuth will redirect to browser, then back to app
      // Session will be set via onAuthStateChange listener
      console.log("[Auth] ✅ Google sign in initiated");
      console.log("[Auth] OAuth URL:", data.url);
      console.log("[Auth] Waiting for redirect...");
      
      // The browser will open for Google sign-in
      // After sign-in, it will redirect back to the app
    } catch (error) {
      console.error("[Auth] ❌ Google sign in error:", error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
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

