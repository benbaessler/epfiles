"use client";

interface UsageIndicatorProps {
  remainingMessages: number;
  hasApiKey: boolean;
  isSignedIn: boolean;
  onAddApiKeyClick?: () => void;
}

export function UsageIndicator({
  remainingMessages,
  hasApiKey,
  isSignedIn,
  onAddApiKeyClick,
}: UsageIndicatorProps) {
  // When connected, hide entirely (status shown in TopBar)
  if (hasApiKey) {
    return null;
  }

  // Signed in but no API key: show remaining + add API key prompt
  if (isSignedIn) {
    return (
      <div className="flex items-center justify-center py-2 sm:py-3">
        <p className="text-xs sm:text-sm text-zinc-500 text-center">
          {remainingMessages} message{remainingMessages !== 1 ? "s" : ""}{" "}
          remaining.{" "}
          <button
            type="button"
            onClick={onAddApiKeyClick}
            className="underline hover:text-zinc-700 cursor-pointer"
          >
            Add your xAI API key
          </button>{" "}
          for unlimited usage.
        </p>
      </div>
    );
  }

  // Not signed in: remaining count + sign in prompt
  return (
    <div className="flex items-center justify-center py-2 sm:py-3">
      <p className="text-xs sm:text-sm text-zinc-500 text-center">
        {remainingMessages} free message{remainingMessages !== 1 ? "s" : ""}{" "}
        remaining. Sign in to connect your xAI API key and save chats.
      </p>
    </div>
  );
}

