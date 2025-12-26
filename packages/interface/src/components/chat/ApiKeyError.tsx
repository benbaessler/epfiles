import { RefreshCw } from "lucide-react";

interface ApiKeyErrorProps {
  onRetry: () => void;
}

export function ApiKeyError({ onRetry }: ApiKeyErrorProps) {
  return (
    <div className="flex w-full px-5 sm:px-4 py-2 justify-start">
      <div className="max-w-[90%] sm:max-w-[80%]">
        <p className="text-[#060823] leading-relaxed">
          <span className="text-red-600 font-medium">Request failed.</span>{" "}
          Please ensure that you entered a valid{" "}
          <span className="font-semibold">xAI API key</span> and have a{" "}
          <span className="font-semibold">credit balance on your xAI account</span>.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 flex items-center gap-1.5 text-[#52525b] hover:text-[#060823] cursor-pointer text-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      </div>
    </div>
  );
}

