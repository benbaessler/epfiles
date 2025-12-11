"use client";

import { X, FileText } from "lucide-react";
import { useLayout } from "@/lib/layout-context";

interface DocumentViewerProps {
  onClose?: () => void;
}

export function DocumentViewer({ onClose }: DocumentViewerProps) {
  const { selectedDocument, setIsEvidenceOpen } = useLayout();

  const handleClose = () => {
    setIsEvidenceOpen(false);
    onClose?.();
  };

  if (!selectedDocument) {
    return (
      <div className="flex flex-col h-full bg-zinc-900 items-center justify-center text-zinc-500">
        <FileText className="w-12 h-12 mb-4" />
        <p>Select a source to preview</p>
      </div>
    );
  }

  // Construct preview URL from source filename
  const previewUrl = `https://jeffgpt-backend-production.up.railway.app/api/documents/${selectedDocument.doc_id}/preview`;

  return (
    <div className="flex flex-col h-full bg-zinc-900 relative">
      {/* Close button - top right corner */}
      <button
        type="button"
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 p-2 text-zinc-400 hover:text-zinc-100 cursor-pointer"
        aria-label="Close document preview"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Document title */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-xl font-semibold text-zinc-100 pr-10">
          {selectedDocument.source_filename}
        </h2>
      </div>

      {/* Document preview */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-zinc-800 rounded-lg overflow-hidden">
          <img
            src={previewUrl}
            alt={`Preview of ${selectedDocument.source_filename}`}
            className="w-full h-auto"
            onError={(e) => {
              // Hide broken image and show placeholder
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const placeholder = target.nextElementSibling;
              if (placeholder) {
                (placeholder as HTMLElement).style.display = 'flex';
              }
            }}
          />
          {/* Fallback placeholder */}
          <div 
            className="hidden flex-col items-center justify-center py-20 text-zinc-500"
            style={{ display: 'none' }}
          >
            <FileText className="w-16 h-16 mb-4" />
            <p className="text-sm">Preview not available</p>
            <p className="text-xs mt-2 text-zinc-600">{selectedDocument.source_filename}</p>
          </div>
        </div>

        {/* Document ID footer */}
        <div className="mt-4 text-xs text-zinc-500">
          {selectedDocument.doc_id}
        </div>
      </div>
    </div>
  );
}

