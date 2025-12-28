"use client";

import { useUser } from "@clerk/nextjs";

const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";

// #region agent log
fetch('http://127.0.0.1:7246/ingest/7285874b-ebbb-41f9-9f7c-6ccf8f9effce',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:module-load',message:'useAuth module loaded',data:{isProd,envValue:process.env.NEXT_PUBLIC_APP_ENV},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H4'})}).catch(()=>{});
// #endregion

interface AuthState {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null;
}

// Production hook - uses Clerk's useUser
function useAuthProd(): AuthState {
  const { isSignedIn, isLoaded, user } = useUser();

  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/7285874b-ebbb-41f9-9f7c-6ccf8f9effce',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:useAuthProd',message:'useAuthProd called',data:{isSignedIn,isLoaded,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3,H5'})}).catch(()=>{});
  // #endregion

  return {
    isSignedIn: isSignedIn ?? false,
    isLoaded,
    userId: user?.id ?? null,
  };
}

// Development hook - always returns mock authenticated state
// Auth is always mocked in dev to avoid requiring Clerk configuration
function useAuthDev(): AuthState {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/7285874b-ebbb-41f9-9f7c-6ccf8f9effce',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:useAuthDev',message:'useAuthDev called (DEV MODE)',data:{isSignedIn:true,isLoaded:true,userId:'dev-user'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
  // #endregion

  return {
    isSignedIn: true,
    isLoaded: true,
    userId: "dev-user",
  };
}

// Export the appropriate hook based on environment
// Decision is made at module load time to avoid conditional hook calls
export const useAuth = isProd ? useAuthProd : useAuthDev;


