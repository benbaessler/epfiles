"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { LogOut, User, FileText } from "lucide-react";
import { Popover } from "@base-ui-components/react/popover";
import { cn } from "@/lib/utils";

interface UserProfileButtonProps {
  collapsed?: boolean;
}

export function UserProfileButton({ collapsed = false }: UserProfileButtonProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          "group relative flex items-center rounded-lg cursor-pointer overflow-hidden hover:bg-zinc-700/50 transition-[width] duration-300 justify-start h-[52px]",
          collapsed ? "w-10" : "w-full"
        )}
      >
        <div className="w-10 h-10 shrink-0 flex items-center justify-center">
          <div className="relative h-7 w-7 rounded-full overflow-hidden">
            {user.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={user.imageUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[#1c1c24] flex items-center justify-center">
                <User className="h-5 w-5 text-zinc-400" />
              </div>
            )}
          </div>
        </div>
        <div
          className={cn(
            "flex flex-col items-start overflow-hidden transition-opacity duration-300 whitespace-nowrap",
            collapsed ? "opacity-0" : "opacity-100"
          )}
        >
          <span className="text-sm text-zinc-200 font-medium truncate max-w-[180px]">
            {user.username ||
              (user.firstName || user.lastName
                ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                : null) ||
              user.emailAddresses[0]?.emailAddress ||
              "User"}
          </span>
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="top" sideOffset={12} align="start">
          <Popover.Popup className="bg-[#1c1c24] border border-[#3a3a4a] rounded-lg shadow-xl shadow-black/50 py-1.5 px-1 min-w-[200px] z-50">
            <button
              onClick={() => router.push("/legal")}
              className="w-full flex items-center gap-3 px-3 py-2 text-base text-zinc-300 hover:bg-zinc-700/50 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <FileText className="h-5 w-5 text-zinc-400 shrink-0" />
              Terms & policies
            </button>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2 text-base text-zinc-300 hover:bg-zinc-700/50 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <LogOut className="h-5 w-5 text-zinc-400 shrink-0" />
              Log out
            </button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
