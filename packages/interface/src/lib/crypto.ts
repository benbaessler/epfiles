/**
 * Encryption utilities for securely storing sensitive data in browser storage.
 * Uses Web Crypto API with AES-GCM encryption.
 */

const DEVICE_KEY_NAME = "epfiles_device_key";
const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;

/**
 * Get or create a stable device encryption key.
 * The key is stored in localStorage and persists across sessions.
 */
async function getDeviceKey(): Promise<CryptoKey> {
  if (typeof window === "undefined") {
    throw new Error("Crypto operations require browser environment");
  }

  const storedKey = localStorage.getItem(DEVICE_KEY_NAME);

  if (storedKey) {
    // Import existing key
    const keyData = Uint8Array.from(atob(storedKey), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey(
      "raw",
      keyData,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ["encrypt", "decrypt"]
    );
  }

  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"]
  );

  // Export and store
  const exportedKey = await crypto.subtle.exportKey("raw", key);
  const keyString = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
  localStorage.setItem(DEVICE_KEY_NAME, keyString);

  return key;
}

/**
 * Encrypt a string value using AES-GCM.
 * Returns a base64-encoded string containing the IV and ciphertext.
 */
export async function encryptValue(plaintext: string): Promise<string> {
  const key = await getDeviceKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate random IV for each encryption
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );

  // Combine IV + ciphertext for storage
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a base64-encoded encrypted value.
 * Returns the original plaintext string.
 */
export async function decryptValue(encrypted: string): Promise<string> {
  const key = await getDeviceKey();

  // Decode base64 and extract IV + ciphertext
  const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Check if encryption is supported in the current environment.
 */
export function isEncryptionSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined"
  );
}

