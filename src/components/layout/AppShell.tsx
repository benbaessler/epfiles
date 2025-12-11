"use client";

import { type ReactNode } from "react";
import { AuthButtons } from "@/components/auth/AuthButtons";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* Auth Buttons - Fixed top right */}
      <div className="fixed top-4 right-4 z-30 lg:top-6 lg:right-6">
        <AuthButtons />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 bg-background flex flex-col min-w-0 overflow-hidden relative h-full">
        {children}
      </main>
    </div>
  );
}
