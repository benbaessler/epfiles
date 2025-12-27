"use client";

import { useUser } from "@clerk/nextjs";

const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";
// Explicit opt-in for local development features (sidebar, skip auth)
// Must be explicitly set - never enabled by default in any deployment
const isLocalDev = process.env.NEXT_PUBLIC_LOCAL_DEV === "true";

interface AuthState {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null;
}

// Production hook - uses Clerk's useUser
function useAuthProd(): AuthState {
  const { isSignedIn, isLoaded, user } = useUser();

  return {
    isSignedIn: isSignedIn ?? false,
    isLoaded,
    userId: user?.id ?? null,
  };
}

// Development hook - returns mock state based on LOCAL_DEV flag
// Only returns authenticated state if explicitly opted in via NEXT_PUBLIC_LOCAL_DEV=true
function useAuthDev(): AuthState {
  return {
    isSignedIn: isLocalDev,
    isLoaded: true,
    userId: isLocalDev ? "dev-user" : null,
  };
}

// Export the appropriate hook based on environment
// Decision is made at module load time to avoid conditional hook calls
export const useAuth = isProd ? useAuthProd : useAuthDev;


