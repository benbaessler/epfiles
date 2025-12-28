"use client";

import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";

// #region agent log
fetch('http://127.0.0.1:7246/ingest/7285874b-ebbb-41f9-9f7c-6ccf8f9effce',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthButtons.tsx:module-load',message:'AuthButtons module loaded',data:{isProd,envValue:process.env.NEXT_PUBLIC_APP_ENV},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
// #endregion

export function AuthButtons() {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/7285874b-ebbb-41f9-9f7c-6ccf8f9effce',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthButtons.tsx:AuthButtons',message:'AuthButtons render',data:{isProd,willRender:isProd},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  // Hide Clerk auth UI in dev mode (auth is always mocked in dev)
  if (!isProd) {
    return null;
  }

  return <AuthButtonsInner />;
}

function AuthButtonsInner() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
      <SignInButton mode="modal">
        <button className="h-8 sm:h-9 md:h-10 px-2 sm:px-4 md:px-8 rounded text-xs sm:text-sm font-medium text-[#060823] bg-transparent hover:text-[#161F81] transition-all duration-200 cursor-pointer">
          Log in
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="h-8 sm:h-9 md:h-10 px-2 sm:px-4 md:px-8 rounded text-xs sm:text-sm font-medium text-white bg-[#161F81] hover:bg-[#1a2599] transition-all duration-200 cursor-pointer shadow-sm">
          Sign up
        </button>
      </SignUpButton>
    </div>
  );
}




