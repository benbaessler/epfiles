"use client";

import { useUser } from "@clerk/nextjs";

interface AuthState {
  isSignedIn: boolean;
  isLoaded: boolean;
}

export function useAuth(): AuthState {
  const { isSignedIn, isLoaded } = useUser();

  return {
    isSignedIn: isSignedIn ?? false,
    isLoaded,
  };
}



