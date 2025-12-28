type DOJEntry = {
  url: string;
  dataSet: number;
};

type DOJMapping = Record<string, DOJEntry>;

// Dynamic import with fallback for CI/build environments where the JSON may not exist
let mapping: DOJMapping = {};

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mapping = require("@/data/doj-links.json") as DOJMapping;
} catch {
  // JSON file doesn't exist (e.g., in CI), use empty mapping
}

/**
 * Get the DOJ URL for a document ID (EFTA format)
 */
export function getDOJUrl(docId: string): string | null {
  const entry = mapping[docId];
  return entry?.url ?? null;
}

/**
 * Check if a document has a DOJ link
 */
export function hasDOJLink(docId: string): boolean {
  return docId in mapping;
}

/**
 * Get the data set number for a document
 */
export function getDataSetNumber(docId: string): number | null {
  const entry = mapping[docId];
  return entry?.dataSet ?? null;
}


