"use client";

import { useUser } from "@clerk/nextjs";

const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";

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

// Development hook - returns mock authenticated state for dev testing
// Allows sidebar and chat history to work without Clerk
function useAuthDev(): AuthState {
  return {
    isSignedIn: true,
    isLoaded: true,
    userId: "dev-user",
  };
}

// Export the appropriate hook based on environment
// Decision is made at module load time to avoid conditional hook calls
export const useAuth = isProd ? useAuthProd : useAuthDev;



