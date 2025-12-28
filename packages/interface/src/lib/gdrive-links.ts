import { getDOJUrl, hasDOJLink } from "./doj-links";

type GDriveEntry = {
  fileId: string;
  fileName: string;
  mimeType: string;
  webViewLink: string;
};

type GDriveMapping = Record<string, GDriveEntry>;

// Dynamic import with fallback for CI/build environments where the JSON may not exist
let mapping: GDriveMapping = {};

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mapping = require("@/data/gdrive-links.json") as GDriveMapping;
} catch {
  // JSON file doesn't exist (e.g., in CI), use empty mapping
}

/**
 * Get the URL for a document, checking GDrive first, then DOJ
 */
export function getGDriveUrl(docId: string): string | null {
  // First check GDrive mapping
  const entry = mapping[docId];
  if (entry?.webViewLink) {
    return entry.webViewLink;
  }
  
  // Fall back to DOJ links for EFTA documents
  return getDOJUrl(docId);
}

/**
 * Check if a document has any link (GDrive or DOJ)
 */
export function hasGDriveLink(docId: string): boolean {
  const hasGDrive = docId in mapping && mapping[docId].fileId !== "PLACEHOLDER";
  if (hasGDrive) return true;
  
  // Check DOJ links as fallback
  return hasDOJLink(docId);
}
