"use client";

import { useUser } from "@clerk/nextjs";

interface AuthState {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null;
}

export function useAuth(): AuthState {
  const { isSignedIn, isLoaded, user } = useUser();

  return {
    isSignedIn: isSignedIn ?? false,
    isLoaded,
    userId: user?.id ?? null,
  };
}



