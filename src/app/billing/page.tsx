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
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-10">
            <h1 className="font-[family-name:var(--font-libre-baskerville)] text-3xl text-zinc-100 mb-3">
              Upgrade your plan
            </h1>
          </div>

          <PricingTable />
        </div>
      </main>
    </div>
  );
}
