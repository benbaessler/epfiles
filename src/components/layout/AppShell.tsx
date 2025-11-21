"use client";

import * as React from "react";
import { Menu, PanelRightClose, PanelLeftClose, PanelLeft, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  evidence: React.ReactNode;
}

export function AppShell({ sidebar, children, evidence }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isEvidenceOpen, setIsEvidenceOpen] = React.useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  // Close mobile sidebar on resize if screen becomes large
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar (Context/Tools) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-zinc-925 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          !isSidebarOpen && "lg:hidden"
        )}
      >
        {/* Removed JeffGPT Header */}
        <div className="flex-1 overflow-auto pt-4">
            {sidebar}
        </div>
      </aside>

      {/* Main Content (The Interrogator) */}
      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Mobile Header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-zinc-925 px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold">Case File #001</span>
          <Button variant="ghost" size="icon" onClick={() => setIsEvidenceOpen(!isEvidenceOpen)}>
            <PanelRight className="h-5 w-5" />
          </Button>
        </header>

        {/* Desktop Toggles (Minimal - No Top Bar) */}
        <div className="absolute top-4 left-4 z-20 hidden lg:block">
            {!isSidebarOpen && (
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} title="Open Sidebar" className="bg-background/50 backdrop-blur-sm border border-border">
                    <PanelLeft className="h-4 w-4" />
                </Button>
            )}
             {isSidebarOpen && (
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} title="Close Sidebar" className="text-muted-foreground hover:text-foreground">
                    <PanelLeftClose className="h-4 w-4" />
                </Button>
            )}
        </div>

        <div className="absolute top-4 right-4 z-20 hidden lg:block">
             {isEvidenceOpen ? (
                <Button variant="ghost" size="icon" onClick={() => setIsEvidenceOpen(false)} title="Close Evidence" className="text-muted-foreground hover:text-foreground">
                    <PanelRightClose className="h-4 w-4" />
                </Button>
             ) : (
                <Button variant="ghost" size="icon" onClick={() => setIsEvidenceOpen(true)} title="Open Evidence" className="bg-background/50 backdrop-blur-sm border border-border">
                    <PanelRight className="h-4 w-4" />
                </Button>
             )}
        </div>


        <div className="flex-1 overflow-hidden relative bg-background">
            {children}
        </div>
      </main>

      {/* Right Sidebar (The Evidence) */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-80 xl:w-[450px] border-l border-border bg-zinc-925 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col",
          isEvidenceOpen ? "translate-x-0" : "translate-x-full lg:hidden",
          "lg:block" 
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4 lg:hidden">
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
  );
}
