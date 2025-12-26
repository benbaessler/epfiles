"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@base-ui-components/react/dialog";
import { Eye, EyeOff, ExternalLink, Pencil, X } from "lucide-react";

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingKey: string | null;
  onSave: (key: string) => void;
  onRemove: () => void;
}

function maskApiKey(key: string): string {
  if (key.length <= 12) return "********";
  const start = key.slice(0, 4);
  const end = key.slice(-4);
  return `${start}********${end}`;
}

export function ApiKeyModal({
  open,
  onOpenChange,
  existingKey,
  onSave,
  onRemove,
}: ApiKeyModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingKey, setIsEditingKey] = useState(false);

  const hasExistingKey = existingKey !== null && existingKey.length > 0;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setInputValue("");
      setShowPassword(false);
      setError(null);
      setIsEditingKey(false);
    }
  }, [open]);

  const handleSave = () => {
    const trimmedKey = inputValue.trim();

    if (!trimmedKey) {
      if (hasExistingKey && !isEditingKey) {
        // No changes made, just close
        onOpenChange(false);
        return;
      }
      setError("Please enter an API key");
      return;
    }

    // Basic validation for xAI key format
    if (!trimmedKey.startsWith("xai-")) {
      setError("API key should start with 'xai-'");
      return;
    }

    if (trimmedKey.length < 20) {
      setError("API key appears to be too short");
      return;
    }

    onSave(trimmedKey);
    onOpenChange(false);
  };

  const handleRemove = () => {
    onRemove();
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  const handleEditClick = () => {
    setIsEditingKey(true);
    setInputValue("");
  };

  const handleCancelEdit = () => {
    setIsEditingKey(false);
    setInputValue("");
    setShowPassword(false);
    setError(null);
  };

  // Show save button if: no existing key OR user clicked edit
  const canSave = !hasExistingKey || isEditingKey;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-[#c4c4c4] rounded shadow-xl shadow-black/10 p-6 w-full max-w-md z-50">
          <Dialog.Title className="text-lg font-semibold text-[#060823] mb-2">
            {hasExistingKey
              ? "Manage your xAI API key"
              : "Connect your xAI API key"}
          </Dialog.Title>

          <Dialog.Description className="text-sm text-[#52525b] mb-4">
            Your API key is stored locally in your browser and sent directly to
            xAI. We never store or have access to your key.
          </Dialog.Description>

          <div className="mb-4">
            <label
              htmlFor="api-key-input"
              className="block text-sm font-medium text-[#060823] mb-1.5"
            >
              API key
            </label>
            <div className="relative">
              <input
                id="api-key-input"
                type={
                  hasExistingKey && !isEditingKey
                    ? "text"
                    : showPassword
                      ? "text"
                      : "password"
                }
                value={
                  hasExistingKey && !isEditingKey
                    ? showPassword
                      ? existingKey
                      : maskApiKey(existingKey)
                    : inputValue
                }
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="xai-..."
                disabled={hasExistingKey && !isEditingKey}
                className={`w-full px-3 py-2 pr-20 border border-[#c4c4c4] rounded text-sm text-[#060823] placeholder:text-zinc-400 focus:outline-none focus:border-[#161F81] focus:ring-1 focus:ring-[#161F81] ${
                  hasExistingKey && !isEditingKey
                    ? "bg-zinc-100 text-zinc-500 cursor-not-allowed"
                    : ""
                }`}
                autoFocus={!hasExistingKey || isEditingKey}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                {/* Eye toggle - always visible */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  title={showPassword ? "Hide key" : "Show key"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>

                {/* Display mode: show pencil to edit */}
                {hasExistingKey && !isEditingKey && (
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    title="Edit API key"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}

                {/* Edit mode: show X to cancel */}
                {hasExistingKey && isEditingKey && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    title="Cancel edit"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
          </div>

          <div className="mb-6 p-3 bg-zinc-50 rounded border border-zinc-200">
            <p className="text-xs text-zinc-600 leading-relaxed">
              Get your API key from{" "}
              <a
                href="https://console.x.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[#161F81] hover:underline font-medium"
              >
                console.x.ai
                <ExternalLink className="h-3 w-3" />
              </a>
              . Your account needs a credit balance for API calls to work.
            </p>
          </div>

          <div className="flex justify-between gap-3">
            <div>
              {hasExistingKey && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer transition-colors"
                >
                  Remove key
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <Dialog.Close className="px-4 py-2 text-sm font-medium text-[#060823] bg-[#e5e5e5] hover:bg-[#d4d4d4] rounded cursor-pointer transition-colors">
                Cancel
              </Dialog.Close>
              {canSave && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#161F81] hover:bg-[#1a2599] rounded cursor-pointer transition-colors"
                >
                  {hasExistingKey ? "Update" : "Connect"}
                </button>
              )}
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
