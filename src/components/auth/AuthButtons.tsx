"use client";

// import { useState } from "react";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
// import { HatGlasses } from "lucide-react";

// function PrivateChatToggle({
//   enabled,
//   onToggle,
// }: {
//   enabled: boolean;
//   onToggle: () => void;
// }) {
//   return (
//     <div className="relative group/tooltip">
//       <button
//         onClick={onToggle}
//         className={`flex items-center justify-center transition-all cursor-pointer ${
//           enabled
//             ? "text-white"
//             : "text-gray-400 hover:text-white"
//         }`}
//         aria-label={enabled ? "Disable private chat" : "Enable private chat"}
//       >
//         <HatGlasses
//           className={`h-8 w-8 transition-all duration-200 ${
//             enabled ? "drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" : ""
//           }`}
//           fill={enabled ? "white" : "none"}
//           strokeWidth={1.5}
//         />
//       </button>
//       <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-3 py-1.5 bg-[#1c1c24] border border-[#3a3a4a] rounded-full text-sm text-zinc-300 whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50">
//         {enabled ? "Disable private chat" : "Enable private chat"}
//       </div>
//     </div>
//   );
// }

export function AuthButtons() {
  const { isLoaded, isSignedIn } = useUser();
  // const [privateChatEnabled, setPrivateChatEnabled] = useState(false);

  if (!isLoaded) {
    return null;
  }

  // Private mode toggle - commented out
  // if (isSignedIn) {
  //   return (
  //     <PrivateChatToggle
  //       enabled={privateChatEnabled}
  //       onToggle={() => setPrivateChatEnabled(!privateChatEnabled)}
  //     />
  //   );
  // }

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
        <button className="h-9 sm:h-10 px-4 sm:px-8 rounded text-sm font-medium text-white bg-gradient-to-r from-[#5b6cf0] to-[#7c5af0] hover:from-[#6b7cf0] hover:to-[#8c6af0] transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-500/20">
          Sign up
        </button>
      </SignUpButton>
    </div>
  );
}
