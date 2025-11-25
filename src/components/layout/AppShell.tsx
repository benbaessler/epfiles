"use client";

import { isValidElement, cloneElement, type ReactNode, type ReactElement } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { PanelRightClose, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { cn } from "@/lib/utils";
import { useLayout } from "@/lib/layout-context";

interface AppShellProps {
  children: ReactNode;
  evidence: ReactNode;
}

export function AppShell({ children, evidence }: AppShellProps) {
  const { isEvidenceOpen, setIsEvidenceOpen, toggleEvidence } = useLayout();

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* Auth Buttons - Fixed top right */}
      <div className="fixed top-6 right-6 z-50 hidden lg:block">
        <AuthButtons />
      </div>
      
      {/* Mobile Implementation (Standard Flex/Fixed) - Resizable Panels are awkward on mobile touch usually */}
      <div className="lg:hidden flex flex-col h-full w-full">
         {/* Mobile Header */}
        <header className="flex-none flex h-14 items-center justify-between border-b border-border bg-zinc-925 px-4">
          <span className="font-semibold">Case File #001</span>
          <div className="flex items-center gap-2">
            <AuthButtons />
            <Button variant="ghost" size="icon" onClick={toggleEvidence}>
              <PanelRight className="h-5 w-5" />
            </Button>
          </div>
        </header>

         {/* Mobile Main Content */}
         <main className="flex-1 overflow-hidden relative bg-background">
            {children}
         </main>

         {/* Mobile Right Sidebar (Drawer) */}
        <aside
            className={cn(
            "fixed inset-y-0 right-0 z-50 w-80 border-l border-border bg-zinc-925 transition-transform duration-300 ease-in-out flex flex-col",
            isEvidenceOpen ? "translate-x-0" : "translate-x-full"
            )}
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

      {/* Desktop Implementation (Resizable Panels) */}
      <div className="hidden lg:block w-full h-full">
        <PanelGroup direction="horizontal">
          {/* Main Content */}
          <Panel minSize={30} className="bg-background flex flex-col">
             <div className="flex-1 overflow-hidden relative h-full">
                {children}
            </div>
          </Panel>

          {isEvidenceOpen && (
            <>
                <PanelResizeHandle className="w-[1px] bg-zinc-800 focus:outline-none" />
                
                {/* Right Sidebar */}
                <Panel defaultSize={40} minSize={30} maxSize={50} className="bg-zinc-925 flex flex-col">
                    <div className="flex-1 overflow-auto h-full">
                        {isValidElement(evidence) 
                            ? cloneElement(evidence as ReactElement<{ onClose: () => void }>, { onClose: () => setIsEvidenceOpen(false) }) 
                            : evidence
                        }
                    </div>
                </Panel>
            </>
          )}
        </PanelGroup>
      </div>
    </div>
  );
}
