"use client";

import { PricingTable } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BillingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#222126] flex flex-col">
      <header className="px-6 py-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-[family-name:var(--font-libre-baskerville)] text-3xl text-zinc-100 text-center">
          Upgrade your plan
        </h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-6xl">
          <PricingTable
            appearance={{
              elements: {
                tableRoot: "flex flex-row gap-6 justify-center items-start",
                planCard: "flex-1 max-w-sm",
              },
            }}
          />
        </div>
      </main>
    </div>
  );
}
