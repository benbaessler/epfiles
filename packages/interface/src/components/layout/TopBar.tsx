"use client";

import { Settings, HelpCircle, Menu, KeyRound, Scale } from "lucide-react";
import { Popover } from "@base-ui-components/react/popover";
import { AuthButtons } from "@/components/auth/AuthButtons";

interface TopBarProps {
  hasApiKey: boolean;
  isSignedIn: boolean;
  onSettingsClick: () => void;
  onMenuClick?: () => void;
}

export function TopBar({ hasApiKey, isSignedIn, onSettingsClick, onMenuClick }: TopBarProps) {

  return (
    <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-[#D9D9D9] border-b border-[#c4c4c4]">
      {/* Left side: Menu button (below lg breakpoint, only when signed in) */}
      {isSignedIn ? (
        <button
          onClick={onMenuClick}
          className="lg:hidden text-[#060823] hover:bg-black/5 rounded-lg cursor-pointer w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0"
          title="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      ) : (
        <div className="lg:hidden" />
      )}
      {/* Spacer for larger screens to maintain justify-end behavior */}
      <div className="hidden lg:block" />
      {/* Right side: Connection indicator + Settings + Auth buttons + Help */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
        {/* Connection indicator pill - only show when signed in */}
        {isSignedIn && (
          <button
            onClick={onSettingsClick}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-[#D9D9D9] border border-[#c4c4c4] rounded-full text-xs sm:text-sm text-[#060823] hover:border-[#a0a0a0] transition-colors cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                hasApiKey ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            <span className="whitespace-nowrap">{hasApiKey ? "xAI key connected" : "Add your xAI key"}</span>
          </button>
        )}

        {/* Settings popover - only show when signed in */}
        {isSignedIn && (
          <Popover.Root>
            <Popover.Trigger
              className="text-[#060823] hover:bg-black/5 rounded-lg cursor-pointer w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0"
              title="Settings"
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner sideOffset={8} align="end">
                <Popover.Popup className="bg-white border border-[#c4c4c4] rounded-lg shadow-lg py-1.5 min-w-[180px] outline-none animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
                  <Popover.Close
                    onClick={onSettingsClick}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#060823] hover:bg-[#f0f0f0] cursor-pointer transition-colors text-left"
                  >
                    <KeyRound className="h-4 w-4 text-[#5a5a5a]" />
                    <span>Manage API key</span>
                  </Popover.Close>
                  <Popover.Close
                    onClick={() => window.open("/legal", "_blank")}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#060823] hover:bg-[#f0f0f0] cursor-pointer transition-colors text-left"
                  >
                    <Scale className="h-4 w-4 text-[#5a5a5a]" />
                    <span>Terms & Policies</span>
                  </Popover.Close>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        )}

        <AuthButtons />

        {/* Help button */}
        <button
          onClick={() => window.open("/about", "_blank")}
          className="text-[#060823] hover:bg-black/5 rounded-lg cursor-pointer w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0"
          title="How it works"
        >
          <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  );
}

