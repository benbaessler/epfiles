"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEYS = {
  messageCount: "epfiles_message_count",
  apiKey: "epfiles_xai_api_key",
} as const;

const FREE_MESSAGE_LIMIT = parseInt(
  process.env.NEXT_PUBLIC_FREE_MESSAGE_COUNT ?? "10",
  10
);
const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";

interface UsageState {
  messageCount: number;
  remainingMessages: number;
  apiKey: string | null;
  hasApiKey: boolean;
  hasReachedLimit: boolean;
  isLoaded: boolean;
  incrementUsage: () => void;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
}

// No-op functions for development mode
const noop = () => {};
const noopSetKey = (_key: string) => {};

export function useUsage(): UsageState {
  // In development, bypass usage limits entirely
  if (!isProd) {
    return {
      messageCount: 0,
      remainingMessages: FREE_MESSAGE_LIMIT,
      apiKey: null,
      hasApiKey: false,
      hasReachedLimit: false,
      isLoaded: true,
      incrementUsage: noop,
      setApiKey: noopSetKey,
      clearApiKey: noop,
    };
  }

  return useUsageInner();
}

function useUsageInner(): UsageState {
  const [messageCount, setMessageCount] = useState(0);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedCount = localStorage.getItem(STORAGE_KEYS.messageCount);
    const storedKey = localStorage.getItem(STORAGE_KEYS.apiKey);

    if (storedCount) {
      const parsed = parseInt(storedCount, 10);
      if (!isNaN(parsed)) {
        setMessageCount(parsed);
      }
    }

    if (storedKey) {
      setApiKeyState(storedKey);
    }

    setIsLoaded(true);
  }, []);

  const incrementUsage = useCallback(() => {
    setMessageCount((prev) => {
      const newCount = prev + 1;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.messageCount, newCount.toString());
      }
      return newCount;
    });
  }, []);

  const setApiKey = useCallback((key: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.apiKey, key);
    }
    setApiKeyState(key);
  }, []);

  const clearApiKey = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.apiKey);
    }
    setApiKeyState(null);
  }, []);

  const hasApiKey = apiKey !== null && apiKey.length > 0;
  const remainingMessages = Math.max(0, FREE_MESSAGE_LIMIT - messageCount);
  const hasReachedLimit = messageCount >= FREE_MESSAGE_LIMIT;

  return {
    messageCount,
    remainingMessages,
    apiKey,
    hasApiKey,
    hasReachedLimit,
    isLoaded,
    incrementUsage,
    setApiKey,
    clearApiKey,
  };
}

export { FREE_MESSAGE_LIMIT };

