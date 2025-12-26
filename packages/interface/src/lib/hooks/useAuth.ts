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

// Development hook - returns mock unauthenticated state
function useAuthDev(): AuthState {
  return {
    isSignedIn: false,
    isLoaded: true,
    userId: null,
  };
}

// Export the appropriate hook based on environment
// Decision is made at module load time to avoid conditional hook calls
export const useAuth = isProd ? useAuthProd : useAuthDev;



