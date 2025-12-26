"use client";

import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";

export function AuthButtons() {
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




