"use client";

import { PricingTable } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

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

          <div className="flex-1 flex flex-col items-center justify-start sm:justify-center overflow-y-auto px-4 sm:px-6 py-8 sm:py-12">
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
          </div>
        </div>
      </div>
    </AppShell>
  );
}
