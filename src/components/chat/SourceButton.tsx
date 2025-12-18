import { FileText, ExternalLink } from "lucide-react";
import { getGDriveUrl } from "@/lib/gdrive-links";

interface SourceButtonProps {
  displayName: string;
  docId: string;
  onClick?: () => void;
}

export function SourceButton({ displayName, docId, onClick }: SourceButtonProps) {
  const gdriveUrl = getGDriveUrl(docId);
  
  const className = "inline-flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm !text-zinc-300 cursor-pointer !no-underline";
  
  // If we have a Google Drive link, render as an anchor that opens in new tab
  if (gdriveUrl) {
    return (
      <a
        href={gdriveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={{ textDecoration: 'none' }}
      >
        <FileText className="w-4 h-4 text-zinc-400" />
        <span className="!text-zinc-300" style={{ textDecoration: 'none' }}>{displayName}</span>
        <ExternalLink className="w-3 h-3 text-zinc-500" />
      </a>
    );
  }
  
  // Fallback to button with onClick handler
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
    >
      <FileText className="w-4 h-4 text-zinc-400" />
      <span>{displayName}</span>
    </button>
  );
}












