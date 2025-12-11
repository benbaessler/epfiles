"use client";

import { type ReactNode } from "react";
import { PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { useLayout } from "@/lib/layout-context";

interface AppShellProps {
  children: ReactNode;
  evidence: ReactNode;
}

export function AppShell({ children, evidence }: AppShellProps) {
  const { isEvidenceOpen, setIsEvidenceOpen } = useLayout();

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* Auth Buttons - Fixed top right */}
      <div className="fixed top-4 right-4 z-30 lg:top-6 lg:right-6">
        <AuthButtons />
      </div>
      
      {/* Main Content - Single instance for both mobile and desktop */}
      <main className="flex-1 bg-background flex flex-col min-w-0 overflow-hidden relative h-full">
        {children}
      </main>

      {/* Evidence Sidebar - Mobile (Drawer) */}
      {isEvidenceOpen && (
        <div className="lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsEvidenceOpen(false)}
          />
          <aside
            className="fixed inset-y-0 right-0 z-50 w-[85%] max-w-[400px] border-l border-border bg-zinc-925 flex flex-col"
          >
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <span className="font-semibold">Evidence</span>
              <Button variant="ghost" size="icon" onClick={() => setIsEvidenceOpen(false)}>
                <PanelRightClose className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto h-full">
              {evidence}
            </div>
          </aside>
        </div>
      )}

      {/* Evidence Sidebar - Desktop */}
      {isEvidenceOpen && (
        <aside className="hidden lg:flex w-[40%] max-w-[600px] min-w-[400px] border-l border-zinc-800 bg-zinc-925 flex-col">
          <div className="flex-1 overflow-auto h-full">
            {evidence}
          </div>
        </aside>
      )}
    </div>
  );
}
