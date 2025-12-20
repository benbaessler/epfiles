"use client";

import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

export function AuthButtons() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <SignInButton mode="modal">
        <button className="h-9 sm:h-10 px-4 sm:px-8 rounded text-sm font-medium text-white bg-[#1c1c24] border border-[#3a3a4a] hover:bg-[#252530] hover:border-[#4a4a5a] transition-all duration-200 cursor-pointer">
          Log in
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="h-9 sm:h-10 px-4 sm:px-8 rounded text-sm font-medium text-black bg-white hover:bg-zinc-200 transition-all duration-200 cursor-pointer shadow-lg">
          Sign up
        </button>
      </SignUpButton>
    </div>
  );
}
