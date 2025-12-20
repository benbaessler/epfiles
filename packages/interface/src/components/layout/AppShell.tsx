"use client";

import { type ReactNode } from "react";
import { AuthButtons } from "@/components/auth/AuthButtons";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-16 pointer-events-none">
        <div className="h-full flex items-center justify-end px-4 lg:px-6 pointer-events-auto">
          <AuthButtons />
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 bg-background flex flex-col min-w-0 overflow-hidden relative h-full">
        {children}
      </main>
    </div>
  );
}
