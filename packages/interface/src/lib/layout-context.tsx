"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Source } from "./types";

interface LayoutContextType {
  selectedDocument: Source | null;
  setSelectedDocument: (doc: Source | null) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [selectedDocument, setSelectedDocument] = useState<Source | null>(null);

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
