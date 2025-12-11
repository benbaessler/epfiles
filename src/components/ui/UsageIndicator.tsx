"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { fetchUsage, type UsageStats } from "@/lib/api";
import { cn } from "@/lib/utils";

interface UsageIndicatorProps {
  collapsed?: boolean;
}

export function UsageIndicator({ collapsed = false }: UsageIndicatorProps) {
  const { isSignedIn } = useUser();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    const loadUsage = async () => {
      try {
        const data = await fetchUsage();
        setUsage(data);
      } catch (err) {
        console.error("Failed to load usage:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsage();
  }, [isSignedIn]);

  if (!isSignedIn || isLoading || !usage) {
    return null;
  }

  const percentage = Math.min((usage.current / usage.limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div
      className={cn(
        "transition-opacity duration-300",
        collapsed ? "opacity-0" : "opacity-100"
      )}
    >
      <div className="px-2 py-2">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-zinc-400">Messages</span>
          <span
            className={cn(
              "text-xs",
              isAtLimit ? "text-red-400" : isNearLimit ? "text-amber-400" : "text-zinc-400"
            )}
          >
            {usage.current}/{usage.limit}
          </span>
        </div>
        <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isAtLimit
                ? "bg-red-500"
                : isNearLimit
                ? "bg-amber-500"
                : "bg-zinc-400"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}






