"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";

export function AuthButtons() {
  return (
    <div className="flex items-center gap-4">
      <SignInButton mode="modal">
        <button className="h-10 px-8 rounded font-medium text-white bg-[#1c1c24] border border-[#3a3a4a] hover:bg-[#252530] hover:border-[#4a4a5a] transition-all duration-200 cursor-pointer">
          Log in
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="h-10 px-8 rounded font-medium text-white bg-gradient-to-r from-[#5b6cf0] to-[#7c5af0] hover:from-[#6b7cf0] hover:to-[#8c6af0] transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-500/20">
          Sign up
        </button>
      </SignUpButton>
    </div>
  );
}
