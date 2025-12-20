import gdriveMapping from "@/data/gdrive-links.json";

type GDriveEntry = {
  fileId: string;
  fileName: string;
  mimeType: string;
  webViewLink: string;
};

type GDriveMapping = Record<string, GDriveEntry>;

const mapping = gdriveMapping as unknown as GDriveMapping;

export function getGDriveUrl(docId: string): string | null {
  const entry = mapping[docId];
  return entry?.webViewLink ?? null;
}

export function hasGDriveLink(docId: string): boolean {
  return docId in mapping && mapping[docId].fileId !== "PLACEHOLDER";
}
