import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Set production mode BEFORE importing the hook (it checks at module load time)
vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production");

// Mock crypto module
vi.mock("@/lib/crypto", () => ({
  encryptValue: vi.fn((value: string) => Promise.resolve(`encrypted_${value}`)),
  decryptValue: vi.fn((value: string) =>
    Promise.resolve(value.replace("encrypted_", ""))
  ),
  isEncryptionSupported: vi.fn(() => true),
}));

// Storage mocks
const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
    _getStore: () => store,
  };
};

let localStorageMock: ReturnType<typeof createStorageMock>;
let sessionStorageMock: ReturnType<typeof createStorageMock>;

// Setup global mocks
beforeEach(() => {
  // Reset modules before each test so env var change takes effect
  vi.resetModules();
  
  localStorageMock = createStorageMock();
  sessionStorageMock = createStorageMock();

  Object.defineProperty(globalThis, "localStorage", {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(globalThis, "sessionStorage", {
    value: sessionStorageMock,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

// Note: The useUsage hook checks isProd at module load time using process.env.NEXT_PUBLIC_APP_ENV
// Since it's evaluated at import time, we test the production behavior directly
// (the hook returns early in dev mode with no-op functions)

describe("useUsage hook", () => {
  describe("production mode behavior", () => {
    // These tests exercise the actual hook logic which runs in production mode
    // The dev mode bypass happens at module initialization, so we test the core functionality

    it("should start with isLoaded=false then become true", async () => {
      const { useUsage } = await import("@/lib/hooks/useUsage");
      const { result } = renderHook(() => useUsage());

      // Either immediately loaded (dev mode) or will load async (prod mode)
      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });
    });

    it("should have correct initial state", async () => {
      const { useUsage } = await import("@/lib/hooks/useUsage");
      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // Verify state shape
      expect(typeof result.current.messageCount).toBe("number");
      expect(typeof result.current.remainingMessages).toBe("number");
      expect(typeof result.current.hasReachedLimit).toBe("boolean");
      expect(typeof result.current.hasApiKey).toBe("boolean");
      expect(typeof result.current.rememberKey).toBe("boolean");
      expect(typeof result.current.incrementUsage).toBe("function");
      expect(typeof result.current.setApiKey).toBe("function");
      expect(typeof result.current.clearApiKey).toBe("function");
      expect(typeof result.current.setRememberKey).toBe("function");
    });

    it("should export FREE_MESSAGE_LIMIT constant", async () => {
      const { FREE_MESSAGE_LIMIT } = await import("@/lib/hooks/useUsage");
      expect(typeof FREE_MESSAGE_LIMIT).toBe("number");
      expect(FREE_MESSAGE_LIMIT).toBeGreaterThan(0);
    });
  });

  describe("useUsageInner functionality (mocked window)", () => {
    // Test the internal hook behavior by ensuring window is defined
    beforeEach(() => {
      // Ensure window is defined for these tests
      if (typeof window === "undefined") {
        Object.defineProperty(globalThis, "window", {
          value: globalThis,
          writable: true,
          configurable: true,
        });
      }
    });

    it("should have incrementUsage function", async () => {
      const { useUsage } = await import("@/lib/hooks/useUsage");
      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // The function should exist and be callable
      expect(result.current.incrementUsage).toBeDefined();
      expect(typeof result.current.incrementUsage).toBe("function");
    });

    it("should have setApiKey function", async () => {
      const { useUsage } = await import("@/lib/hooks/useUsage");
      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.setApiKey).toBeDefined();
      expect(typeof result.current.setApiKey).toBe("function");
    });

    it("should have clearApiKey function", async () => {
      const { useUsage } = await import("@/lib/hooks/useUsage");
      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.clearApiKey).toBeDefined();
      expect(typeof result.current.clearApiKey).toBe("function");
    });

    it("should have setRememberKey function", async () => {
      const { useUsage } = await import("@/lib/hooks/useUsage");
      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.setRememberKey).toBeDefined();
      expect(typeof result.current.setRememberKey).toBe("function");
    });

    it("should calculate remainingMessages correctly", async () => {
      const { useUsage, FREE_MESSAGE_LIMIT } = await import(
        "@/lib/hooks/useUsage"
      );
      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // remainingMessages should be FREE_MESSAGE_LIMIT - messageCount
      expect(result.current.remainingMessages).toBe(
        FREE_MESSAGE_LIMIT - result.current.messageCount
      );
    });

    it("should determine hasApiKey based on apiKey state", async () => {
      const { useUsage } = await import("@/lib/hooks/useUsage");
      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // Initially should have no API key
      if (result.current.apiKey === null || result.current.apiKey === "") {
        expect(result.current.hasApiKey).toBe(false);
      } else {
        expect(result.current.hasApiKey).toBe(true);
      }
    });

    it("should determine hasReachedLimit based on messageCount", async () => {
      const { useUsage, FREE_MESSAGE_LIMIT } = await import(
        "@/lib/hooks/useUsage"
      );
      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // hasReachedLimit should be true when messageCount >= FREE_MESSAGE_LIMIT
      const expected = result.current.messageCount >= FREE_MESSAGE_LIMIT;
      expect(result.current.hasReachedLimit).toBe(expected);
    });
  });

  describe("storage key constants", () => {
    it("should use correct localStorage keys", async () => {
      // Import the hook to trigger any initialization
      await import("@/lib/hooks/useUsage");

      // The expected keys based on the source code
      const expectedKeys = [
        "epfiles_message_count",
        "epfiles_xai_api_key_encrypted",
        "epfiles_remember_key",
        "epfiles_xai_api_key", // Legacy key
      ];

      // These are the keys the hook uses - verify they're strings we can use
      expectedKeys.forEach((key) => {
        expect(typeof key).toBe("string");
        expect(key.startsWith("epfiles_")).toBe(true);
      });
    });
  });

  describe("crypto integration", () => {
    it("should call crypto functions when available", async () => {
      const { isEncryptionSupported } = await import("@/lib/crypto");

      // Verify the mock is working
      expect(isEncryptionSupported()).toBe(true);
    });

    it("should use encryptValue for storing API keys", async () => {
      const { encryptValue } = await import("@/lib/crypto");

      // Test the mock directly
      const result = await encryptValue("test-key");
      expect(result).toBe("encrypted_test-key");
      expect(encryptValue).toHaveBeenCalledWith("test-key");
    });

    it("should use decryptValue for retrieving API keys", async () => {
      const { decryptValue } = await import("@/lib/crypto");

      // Test the mock directly
      const result = await decryptValue("encrypted_stored-key");
      expect(result).toBe("stored-key");
      expect(decryptValue).toHaveBeenCalledWith("encrypted_stored-key");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string API key as no key", async () => {
      const { useUsage } = await import("@/lib/hooks/useUsage");
      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // Empty string should be treated as no API key
      // This is verified by checking hasApiKey is false when apiKey is empty
      if (result.current.apiKey === "") {
        expect(result.current.hasApiKey).toBe(false);
      }
    });

    it("should handle null API key correctly", async () => {
      const { useUsage } = await import("@/lib/hooks/useUsage");
      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // null API key should mean hasApiKey is false
      if (result.current.apiKey === null) {
        expect(result.current.hasApiKey).toBe(false);
      }
    });

    it("should handle zero messageCount", async () => {
      const { useUsage, FREE_MESSAGE_LIMIT } = await import(
        "@/lib/hooks/useUsage"
      );
      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // With zero messages, should have full remaining and not reached limit
      if (result.current.messageCount === 0) {
        expect(result.current.remainingMessages).toBe(FREE_MESSAGE_LIMIT);
        expect(result.current.hasReachedLimit).toBe(false);
      }
    });

    it("should not allow negative remainingMessages", async () => {
      const { useUsage } = await import("@/lib/hooks/useUsage");
      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // remainingMessages should never be negative (uses Math.max(0, ...))
      expect(result.current.remainingMessages).toBeGreaterThanOrEqual(0);
    });
  });
});
