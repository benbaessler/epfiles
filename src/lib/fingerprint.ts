"use client";

import { useState, useEffect } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cachedFingerprint: string | null = null;
let fingerprintPromise: Promise<string> | null = null;

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
      // Return a fallback that includes some randomness
      cachedFingerprint = `fallback-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

