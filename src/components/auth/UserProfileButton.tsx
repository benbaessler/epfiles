"use client";

import { useUser, useClerk, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { LogOut, User, CircleFadingArrowUp } from "lucide-react";
import { Popover } from "@base-ui-components/react/popover";
import { cn } from "@/lib/utils";

// Define your subscription plan slugs here (must match Clerk dashboard)
const SUBSCRIPTION_PLANS = [
  { slug: "pro", name: "Pro" },
  { slug: "research", name: "Research" },
  { slug: "basic", name: "Basic" },
] as const;

interface UserProfileButtonProps {
  collapsed?: boolean;
}

export function UserProfileButton({ collapsed = false }: UserProfileButtonProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const { has } = useAuth();
  const router = useRouter();

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  // Check subscription plans in order of priority (highest tier first)
  const getSubscriptionPlan = () => {
    for (const plan of SUBSCRIPTION_PLANS) {
      if (has?.({ plan: plan.slug })) {
        return plan.name;
      }
    }
    return "Free";
  };

  const subscriptionPlan = getSubscriptionPlan();

  return (
    <Popover.Root>
      <Popover.Trigger className="group relative flex items-center gap-3 rounded-md cursor-pointer overflow-hidden h-12 w-full hover:bg-zinc-800/50">
        <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0">
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
        <div
          className={cn(
            "flex flex-col items-start overflow-hidden transition-opacity duration-300 whitespace-nowrap",
            collapsed ? "opacity-0" : "opacity-100"
          )}
        >
          <span className="text-sm text-zinc-200 font-medium truncate max-w-[180px]">
            {user.username || user.firstName + " " + user.lastName || "User"}
          </span>
          <span className="text-sm text-zinc-500 truncate max-w-[180px]">
            {subscriptionPlan} Plan
          </span>
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="top" sideOffset={12} align="start">
          <Popover.Popup className="bg-[#1c1c24] border border-[#3a3a4a] rounded-lg shadow-xl shadow-black/50 py-1.5 px-1 w-[var(--anchor-width)] z-50">
            <button
              onClick={() => router.push("/billing")}
              className="w-full flex items-center gap-3 px-3 py-2 text-zinc-300 hover:bg-zinc-700/50 rounded-md cursor-pointer"
            >
              <CircleFadingArrowUp className="h-5 w-5 text-zinc-400" />
              Upgrade plan
            </button>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2 text-zinc-300 hover:bg-zinc-700/50 rounded-md cursor-pointer"
            >
              <LogOut className="h-5 w-5 text-zinc-400" />
              Log out
            </button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
