"use client";

import * as React from "react";

interface LayoutContextType {
  isEvidenceOpen: boolean;
  setIsEvidenceOpen: (open: boolean) => void;
  toggleEvidence: () => void;
}

const LayoutContext = React.createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isEvidenceOpen, setIsEvidenceOpen] = React.useState(false);

  const toggleEvidence = () => setIsEvidenceOpen(prev => !prev);

  return (
    <LayoutContext.Provider value={{ isEvidenceOpen, setIsEvidenceOpen, toggleEvidence }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = React.useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}



