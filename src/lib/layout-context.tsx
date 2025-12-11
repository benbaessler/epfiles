"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface SelectedDocument {
  chunk_id: string;
  score: number;
  doc_id: string;
  page_start: number;
  page_end: number;
  text: string;
  source_filename: string;
}

interface LayoutContextType {
  selectedDocument: SelectedDocument | null;
  setSelectedDocument: (doc: SelectedDocument | null) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [selectedDocument, setSelectedDocument] = useState<SelectedDocument | null>(null);

  return (
    <LayoutContext.Provider value={{ 
      selectedDocument,
      setSelectedDocument
    }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
