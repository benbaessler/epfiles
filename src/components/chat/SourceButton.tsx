import { FileText } from "lucide-react";

interface SourceButtonProps {
  displayName: string;
  onClick: () => void;
}

export function SourceButton({ displayName, onClick }: SourceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-800/50 rounded-lg text-sm text-zinc-300 cursor-pointer"
    >
      <FileText className="w-4 h-4 text-zinc-400" />
      <span>{displayName}</span>
    </button>
  );
}
