import dojMapping from "@/data/doj-links.json";

type DOJEntry = {
  url: string;
  dataSet: number;
};

type DOJMapping = Record<string, DOJEntry>;

const mapping = dojMapping as unknown as DOJMapping;

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


