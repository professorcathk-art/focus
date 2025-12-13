/**
 * API client for making requests to backend
 * Handles authentication, error handling, and request formatting
 */

import { API_BASE_URL } from "@/config/api";
import { ApiError } from "@/types";
import { supabase } from "./supabase";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authentication token from Supabase session
   */
  async getToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        console.log("[API Client] Token retrieved from Supabase");
        return session.access_token;
      }
      console.log("[API Client] No token found in Supabase session");
      return null;
    } catch (error) {
      console.error("[API Client] Error getting token:", error);
      return null;
    }
  }

  /**
   * Save authentication token (not needed with Supabase - handled automatically)
   */
  async saveToken(token: string): Promise<void> {
    // Supabase handles token storage automatically
    console.log("[API Client] Token storage handled by Supabase");
  }

  /**
   * Remove authentication token (not needed with Supabase - handled automatically)
   */
  async removeToken(): Promise<void> {
    // Supabase handles token removal automatically
    console.log("[API Client] Token removal handled by Supabase");
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      // Log when token is missing for debugging
      console.log(`[API Client] No token found for request to ${endpoint}`);
    }

    try {
      // Check if backend URL is configured (not placeholder)
      if (this.baseUrl.includes("your-api.vercel.app")) {
        throw new Error("Backend not configured. Please set EXPO_PUBLIC_API_URL");
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        
        // If token is invalid, clear it and throw a specific error
        if (response.status === 401 && (errorData.message?.includes("token") || errorData.message?.includes("auth"))) {
          await this.removeToken().catch(() => {});
          throw new Error("Session expired. Please sign in again.");
        }
        
        throw new Error(errorData.message || "Request failed");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error occurred");
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  /**
   * Upload file (for audio)
   */
  async uploadFile<T>(
    endpoint: string,
    fileUri: string,
    fieldName: string = "file"
  ): Promise<T> {
    const token = await this.getToken();
    const url = `${this.baseUrl}${endpoint}`;

    const formData = new FormData();
    formData.append(fieldName, {
      uri: fileUri,
      type: "audio/m4a",
      name: "recording.m4a",
    } as any);

    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(errorData.message || "Upload failed");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Upload error occurred");
    }
  }
}

export const apiClient = new ApiClient();

