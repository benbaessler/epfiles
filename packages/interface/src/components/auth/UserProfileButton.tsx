"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";

const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";

interface UserProfileButtonProps {
  collapsed?: boolean;
}

export function UserProfileButton({ collapsed = false }: UserProfileButtonProps) {
  if (!isProd) {
    return null;
  }

  return <UserProfileButtonInner collapsed={collapsed} />;
}

function UserProfileButtonInner({ collapsed = false }: UserProfileButtonProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <button
      onClick={() => signOut()}
      className={cn(
        "group relative flex items-center rounded-lg cursor-pointer overflow-hidden hover:bg-black/5 transition-[width] duration-300 justify-start h-[52px] gap-1",
        collapsed ? "w-10" : "w-full"
      )}
    >
      <div className="w-10 h-10 shrink-0 flex items-center justify-center">
        <div className="relative h-8 w-8 rounded-full overflow-hidden">
          {user.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.imageUrl}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[#e5e5e5] flex items-center justify-center">
              <User className="h-5 w-5 text-[#71717a]" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <LogOut className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
      <div
        className={cn(
          "flex flex-col items-start overflow-hidden transition-opacity duration-300 whitespace-nowrap",
          collapsed ? "opacity-0" : "opacity-100"
        )}
      >
        <span className="text-sm text-[#060823] font-medium truncate max-w-[180px]">
          {user.username ||
            (user.firstName || user.lastName
              ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
              : null) ||
            user.emailAddresses[0]?.emailAddress ||
            "User"}
        </span>
      </div>
    </button>
  );
}
