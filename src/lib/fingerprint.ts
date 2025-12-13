"use client";

import { useState, useEffect } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

const FALLBACK_STORAGE_KEY = "epfiles_fp_fallback";

let cachedFingerprint: string | null = null;
let fingerprintPromise: Promise<string> | null = null;

function getPersistedFallback(): string | null {
  try {
    return localStorage.getItem(FALLBACK_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistFallback(fingerprint: string): void {
  try {
    localStorage.setItem(FALLBACK_STORAGE_KEY, fingerprint);
  } catch {
    // localStorage unavailable
  }
}

async function loadFingerprint(): Promise<string> {
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  if (fingerprintPromise) {
    return fingerprintPromise;
  }

  fingerprintPromise = (async () => {
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      cachedFingerprint = result.visitorId;
      return cachedFingerprint;
    } catch (error) {
      console.error("Failed to generate fingerprint:", error);
      // Use persisted fallback if available, otherwise generate and persist
      const existing = getPersistedFallback();
      if (existing) {
        cachedFingerprint = existing;
      } else {
        cachedFingerprint = `fallback-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        persistFallback(cachedFingerprint);
      }
      return cachedFingerprint;
    }
  })();

  return fingerprintPromise;
}

export function useFingerprint(): string | null {
  const [fingerprint, setFingerprint] = useState<string | null>(cachedFingerprint);

  useEffect(() => {
    loadFingerprint().then(setFingerprint);
  }, []);

  return fingerprint;
}

export { loadFingerprint };

