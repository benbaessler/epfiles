"use client";

import { useState, useEffect, useCallback } from "react";
import {
  encryptValue,
  decryptValue,
  isEncryptionSupported,
} from "@/lib/crypto";

const STORAGE_KEYS = {
  messageCount: "epfiles_message_count",
  apiKeyEncrypted: "epfiles_xai_api_key_encrypted",
  rememberKey: "epfiles_remember_key",
  // Legacy key for migration
  apiKeyLegacy: "epfiles_xai_api_key",
} as const;

const FREE_MESSAGE_LIMIT = parseInt(
  process.env.NEXT_PUBLIC_FREE_MESSAGE_COUNT ?? "10",
  10
);
const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";
// Explicit opt-in for local development (backend uses env XAI_API_KEY)
// Must be explicitly set - never enabled by default in any deployment
const isLocalDev = process.env.NEXT_PUBLIC_LOCAL_DEV === "true";

export type StorageMode = "persistent" | "session";

interface UsageState {
  messageCount: number;
  remainingMessages: number;
  apiKey: string | null;
  hasApiKey: boolean;
  hasReachedLimit: boolean;
  isLoaded: boolean;
  rememberKey: boolean;
  incrementUsage: () => void;
  setApiKey: (key: string, remember?: boolean) => void;
  clearApiKey: () => void;
  setRememberKey: (remember: boolean) => void;
}

// No-op functions for development mode
const noop = () => {};
const noopSetKey = (_key: string, _remember?: boolean) => {};
const noopSetRemember = (_remember: boolean) => {};

export function useUsage(): UsageState {
  // In local development with explicit opt-in, bypass usage limits
  // Backend uses XAI_API_KEY from env, so we treat it as if user has API key
  // Only enabled when NEXT_PUBLIC_LOCAL_DEV=true (fail-closed design)
  if (!isProd && isLocalDev) {
    return {
      messageCount: 0,
      remainingMessages: FREE_MESSAGE_LIMIT,
      apiKey: null,
      hasApiKey: true, // Backend uses env key, hide usage indicator
      hasReachedLimit: false,
      isLoaded: true,
      rememberKey: true,
      incrementUsage: noop,
      setApiKey: noopSetKey,
      clearApiKey: noop,
      setRememberKey: noopSetRemember,
    };
  }

  return useUsageInner();
}

function useUsageInner(): UsageState {
  const [messageCount, setMessageCount] = useState(0);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [rememberKey, setRememberKeyState] = useState(true);

  // Load from storage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadData = async () => {
      // Load message count from localStorage
      const storedCount = localStorage.getItem(STORAGE_KEYS.messageCount);
      if (storedCount) {
        const parsed = parseInt(storedCount, 10);
        if (!isNaN(parsed)) {
          setMessageCount(parsed);
        }
      }

      // Load remember preference (defaults to true)
      const storedRemember = localStorage.getItem(STORAGE_KEYS.rememberKey);
      const shouldRemember = storedRemember !== "false";
      setRememberKeyState(shouldRemember);

      // Determine which storage to check based on remember preference
      const storage = shouldRemember ? localStorage : sessionStorage;

      // Try to load encrypted key
      const encryptedKey = storage.getItem(STORAGE_KEYS.apiKeyEncrypted);
      if (encryptedKey && isEncryptionSupported()) {
        try {
          const decryptedKey = await decryptValue(encryptedKey);
          setApiKeyState(decryptedKey);
        } catch {
          // Decryption failed, clear invalid data
          storage.removeItem(STORAGE_KEYS.apiKeyEncrypted);
        }
      } else {
        // Migration: check for legacy unencrypted key
        const legacyKey = localStorage.getItem(STORAGE_KEYS.apiKeyLegacy);
        if (legacyKey) {
          // Migrate to encrypted storage
          setApiKeyState(legacyKey);
          if (isEncryptionSupported()) {
            try {
              const encrypted = await encryptValue(legacyKey);
              storage.setItem(STORAGE_KEYS.apiKeyEncrypted, encrypted);
              // Remove legacy key after successful migration
              localStorage.removeItem(STORAGE_KEYS.apiKeyLegacy);
            } catch {
              // Keep legacy key if encryption fails
            }
          }
        }
      }

      setIsLoaded(true);
    };

    loadData();
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

  const setApiKey = useCallback(
    async (key: string, remember?: boolean) => {
      if (typeof window === "undefined") return;

      // Use provided remember value or current state
      const shouldRemember = remember ?? rememberKey;
      const storage = shouldRemember ? localStorage : sessionStorage;

      // Clear from both storages first
      localStorage.removeItem(STORAGE_KEYS.apiKeyEncrypted);
      sessionStorage.removeItem(STORAGE_KEYS.apiKeyEncrypted);
      localStorage.removeItem(STORAGE_KEYS.apiKeyLegacy);

      // Store encrypted key
      if (isEncryptionSupported()) {
        try {
          const encrypted = await encryptValue(key);
          storage.setItem(STORAGE_KEYS.apiKeyEncrypted, encrypted);
        } catch {
          // Fallback: store unencrypted if encryption fails
          storage.setItem(STORAGE_KEYS.apiKeyLegacy, key);
        }
      } else {
        // No encryption support, store as-is
        storage.setItem(STORAGE_KEYS.apiKeyLegacy, key);
      }

      // Update remember preference
      localStorage.setItem(
        STORAGE_KEYS.rememberKey,
        shouldRemember.toString()
      );
      setRememberKeyState(shouldRemember);

      setApiKeyState(key);
    },
    [rememberKey]
  );

  const clearApiKey = useCallback(() => {
    if (typeof window !== "undefined") {
      // Clear from both storages
      localStorage.removeItem(STORAGE_KEYS.apiKeyEncrypted);
      sessionStorage.removeItem(STORAGE_KEYS.apiKeyEncrypted);
      localStorage.removeItem(STORAGE_KEYS.apiKeyLegacy);
    }
    setApiKeyState(null);
  }, []);

  const setRememberKey = useCallback(
    async (remember: boolean) => {
      if (typeof window === "undefined") return;

      // Store preference
      localStorage.setItem(STORAGE_KEYS.rememberKey, remember.toString());
      setRememberKeyState(remember);

      // If we have a key, move it to the appropriate storage
      if (apiKey) {
        const fromStorage = remember ? sessionStorage : localStorage;
        const toStorage = remember ? localStorage : sessionStorage;

        // Clear from old storage
        fromStorage.removeItem(STORAGE_KEYS.apiKeyEncrypted);
        fromStorage.removeItem(STORAGE_KEYS.apiKeyLegacy);

        // Save to new storage
        if (isEncryptionSupported()) {
          try {
            const encrypted = await encryptValue(apiKey);
            toStorage.setItem(STORAGE_KEYS.apiKeyEncrypted, encrypted);
          } catch {
            toStorage.setItem(STORAGE_KEYS.apiKeyLegacy, apiKey);
          }
        } else {
          toStorage.setItem(STORAGE_KEYS.apiKeyLegacy, apiKey);
        }
      }
    },
    [apiKey]
  );

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
    rememberKey,
    incrementUsage,
    setApiKey,
    clearApiKey,
    setRememberKey,
  };
}

export { FREE_MESSAGE_LIMIT };
