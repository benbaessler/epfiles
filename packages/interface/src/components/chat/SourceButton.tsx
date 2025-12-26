import { FileText, ExternalLink } from "lucide-react";
import { getGDriveUrl } from "@/lib/gdrive-links";

interface SourceButtonProps {
  displayName: string;
  docId: string;
  onClick?: () => void;
}

export function SourceButton({ displayName, docId, onClick }: SourceButtonProps) {
  const gdriveUrl = getGDriveUrl(docId);
  
  const className = "inline-flex items-center gap-2 px-3 py-2 bg-[#f0f0f0] hover:bg-[#e5e5e5] rounded text-sm !text-[#060823] cursor-pointer !no-underline border border-[#c4c4c4]";
  
  // If we have a document link (GDrive or DOJ), render as an anchor that opens in new tab
  if (gdriveUrl) {
    return (
      <a
        href={gdriveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={{ textDecoration: 'none' }}
      >
        <FileText className="w-4 h-4 text-[#52525b]" />
        <span className="!text-[#060823]" style={{ textDecoration: 'none' }}>{displayName}</span>
        <ExternalLink className="w-3 h-3 text-[#71717a]" />
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
      <FileText className="w-4 h-4 text-[#52525b]" />
      <span>{displayName}</span>
    </button>
  );
}













