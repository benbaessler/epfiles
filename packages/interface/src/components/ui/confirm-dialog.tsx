"use client";

import { useState } from "react";
import { Dialog } from "@base-ui-components/react/dialog";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Error handling is delegated to the onConfirm callback
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-[#c4c4c4] rounded shadow-xl shadow-black/10 p-6 w-full max-w-md z-50">
          <Dialog.Title className="text-lg font-semibold text-[#060823] mb-2">
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-[#52525b] mb-6">
            {description}
          </Dialog.Description>
          <div className="flex justify-end gap-3">
            <Dialog.Close
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-[#060823] bg-[#e5e5e5] hover:bg-[#d4d4d4] rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </Dialog.Close>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                variant === "destructive"
                  ? "text-white bg-red-600 hover:bg-red-700"
                  : "text-white bg-[#161F81] hover:bg-[#1a2599]"
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
