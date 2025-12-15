"use client";

import { PricingTable } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 1200 1227"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
    </svg>
  );
}

export default function BillingPage() {
  const router = useRouter();

  return (
    <AppShell>
      <div className="flex h-full bg-zinc-950/50 overflow-hidden">
        <div className="flex-1 flex flex-col h-full relative">
          <div className="py-4 px-3">
            <div className="flex mb-2 justify-start items-center">
              <button
                onClick={() => router.back()}
                className="text-zinc-300 hover:text-zinc-200 hover:bg-zinc-700/50 rounded-lg cursor-pointer w-10 h-10 flex items-center justify-center shrink-0"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto px-4 sm:px-6 pt-4 sm:pt-10 pb-10">
            <div className="flex-1 flex flex-col items-center min-h-full">
              <h1 className="font-[family-name:var(--font-libre-baskerville)] text-2xl sm:text-3xl text-zinc-100 text-center mb-6 sm:mb-8">
                Upgrade your plan
              </h1>
              <div className="w-full max-w-6xl">
                <PricingTable
                  appearance={{
                    elements: {
                      tableRoot: "flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center sm:items-start",
                      planCard: "w-full sm:flex-1 max-w-sm",
                    },
                  }}
                />
              </div>

              <div className="flex flex-col items-center gap-3 mt-10 sm:mt-auto sm:pt-10">
                <div className="text-zinc-400 text-sm">
                  Built by{" "}
                  <span className="font-[family-name:var(--font-libre-baskerville)] italic">
                    Ben Bassler
                  </span>
                </div>
                <a
                  className="opacity-65 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 transition-opacity"
                  href="https://x.com/basslerben"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Ben Bassler on X"
                >
                  <XLogo className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
