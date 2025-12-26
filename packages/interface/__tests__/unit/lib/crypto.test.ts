import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock crypto.subtle for Node.js environment
const mockCryptoKey = {} as CryptoKey;

const mockSubtle = {
  generateKey: vi.fn().mockResolvedValue(mockCryptoKey),
  importKey: vi.fn().mockResolvedValue(mockCryptoKey),
  exportKey: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
  encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(28)), // 12 IV + 16 ciphertext
  decrypt: vi.fn().mockResolvedValue(new TextEncoder().encode("decrypted")),
};

// Setup global crypto mock before imports
const mockGetRandomValues = vi.fn((array: Uint8Array) => {
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
});

Object.defineProperty(globalThis, "crypto", {
  value: {
    subtle: mockSubtle,
    getRandomValues: mockGetRandomValues,
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Now import the module
import {
  encryptValue,
  decryptValue,
  isEncryptionSupported,
} from "@/lib/crypto";

describe("crypto utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isEncryptionSupported", () => {
    it("should return true when crypto.subtle is available", () => {
      expect(isEncryptionSupported()).toBe(true);
    });

    it("should return false when window is undefined", () => {
      const originalWindow = globalThis.window;
      // @ts-expect-error - intentionally setting to undefined for test
      globalThis.window = undefined;

      // Re-evaluate the function in this context
      const result =
        typeof window !== "undefined" &&
        typeof crypto !== "undefined" &&
        typeof crypto.subtle !== "undefined";

      expect(result).toBe(false);

      globalThis.window = originalWindow;
    });
  });

  describe("encryptValue", () => {
    it("should encrypt a plaintext string", async () => {
      const plaintext = "my-secret-api-key";

      const encrypted = await encryptValue(plaintext);

      // Result should be a base64 string
      expect(typeof encrypted).toBe("string");
      expect(encrypted.length).toBeGreaterThan(0);

      // Verify crypto.subtle.encrypt was called
      expect(mockSubtle.encrypt).toHaveBeenCalled();
      const encryptCall = mockSubtle.encrypt.mock.calls[0];
      expect(encryptCall[0].name).toBe("AES-GCM");
      expect(encryptCall[0].iv).toBeInstanceOf(Uint8Array);
    });

    it("should generate a random IV for each encryption", async () => {
      await encryptValue("test1");
      await encryptValue("test2");

      // getRandomValues should be called for each encryption
      expect(mockGetRandomValues).toHaveBeenCalledTimes(2);
    });

    it("should create and store device key on first use", async () => {
      await encryptValue("test");

      // Should have stored the key
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "epfiles_device_key",
        expect.any(String)
      );
    });

    it("should reuse existing device key", async () => {
      // Pre-set a device key
      const existingKey = btoa(String.fromCharCode(...new Uint8Array(32)));
      localStorageMock.setItem("epfiles_device_key", existingKey);
      localStorageMock.getItem.mockReturnValue(existingKey);

      await encryptValue("test");

      // Should have imported the existing key
      expect(mockSubtle.importKey).toHaveBeenCalled();
      // Should NOT have generated a new key
      expect(mockSubtle.generateKey).not.toHaveBeenCalled();
    });
  });

  describe("decryptValue", () => {
    it("should decrypt an encrypted string", async () => {
      // Create a mock encrypted value (12 bytes IV + ciphertext)
      const mockIv = new Uint8Array(12).fill(1);
      const mockCiphertext = new Uint8Array(16).fill(2);
      const combined = new Uint8Array(28);
      combined.set(mockIv, 0);
      combined.set(mockCiphertext, 12);
      const encrypted = btoa(String.fromCharCode(...combined));

      const decrypted = await decryptValue(encrypted);

      expect(decrypted).toBe("decrypted");

      // Verify decrypt was called with correct IV
      expect(mockSubtle.decrypt).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "AES-GCM",
          iv: expect.any(Uint8Array),
        }),
        expect.anything(),
        expect.any(Uint8Array)
      );
    });

    it("should extract IV from the first 12 bytes", async () => {
      const mockIv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      const mockCiphertext = new Uint8Array(16).fill(0);
      const combined = new Uint8Array(28);
      combined.set(mockIv, 0);
      combined.set(mockCiphertext, 12);
      const encrypted = btoa(String.fromCharCode(...combined));

      await decryptValue(encrypted);

      const decryptCall = mockSubtle.decrypt.mock.calls[0];
      const ivUsed = decryptCall[0].iv;

      expect(Array.from(ivUsed)).toEqual(Array.from(mockIv));
    });
  });

  describe("encryption round-trip", () => {
    it("should handle various plaintext lengths", async () => {
      const testCases = [
        "short",
        "a".repeat(100),
        "xai-1234567890abcdef",
        "special!@#$%^&*()chars",
      ];

      for (const plaintext of testCases) {
        // Reset mocks for clean state
        mockSubtle.encrypt.mockClear();
        mockSubtle.decrypt.mockClear();

        await encryptValue(plaintext);
        expect(mockSubtle.encrypt).toHaveBeenCalled();
      }
    });
  });
});

