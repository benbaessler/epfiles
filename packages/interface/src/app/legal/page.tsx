"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";

type Tab = "privacy" | "terms";

export default function LegalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("privacy");

  const tabs = [
    { id: "privacy" as const, label: "Privacy Policy" },
    { id: "terms" as const, label: "Terms of Service" },
  ];

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

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="max-w-2xl mx-auto">
              {/* Tabs */}
              <div className="flex gap-1 mb-8 p-1 bg-zinc-900 rounded-lg w-fit">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      activeTab === tab.id
                        ? "bg-zinc-700 text-zinc-100"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              {activeTab === "privacy" && <PrivacyContent />}
              {activeTab === "terms" && <TermsContent />}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function PrivacyContent() {
  return (
    <>
      <h1 className="font-[family-name:var(--font-libre-baskerville)] text-2xl sm:text-3xl text-zinc-100 mb-8">
        Privacy Policy
      </h1>

      <div className="prose prose-invert prose-zinc max-w-none space-y-6 text-zinc-300">
        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            epfiles.ai (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you use our AI-powered research service.
          </p>
          <p className="mt-4">
            This project is open source and available on GitHub under the MIT license.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">2. Information We Collect</h2>

          <h3 className="text-lg text-zinc-300 font-medium mt-6 mb-3">Account Information</h3>
          <p>When you create an account, we collect:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Email address</li>
            <li>Name (if provided)</li>
            <li>Profile picture (if provided via OAuth)</li>
            <li>Authentication credentials managed by Clerk</li>
          </ul>

          <h3 className="text-lg text-zinc-300 font-medium mt-6 mb-3">Usage Data</h3>
          <p>When you use our service, we collect:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Search queries and conversation history</li>
            <li>Query timestamps</li>
          </ul>

          <h3 className="text-lg text-zinc-300 font-medium mt-6 mb-3">What We Don&apos;t Collect</h3>
          <p>We do not use any third-party analytics or tracking services. We do not:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Track your browsing behavior</li>
            <li>Use fingerprinting technologies</li>
            <li>Share data with advertisers</li>
            <li>Sell your personal information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and maintain our service</li>
            <li>Process your queries through our RAG (Retrieval-Augmented Generation) system</li>
            <li>Manage your account</li>
            <li>Improve our service and user experience</li>
            <li>Communicate with you about your account or service updates</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">4. Third-Party Services</h2>
          <p>We use the following third-party services that may process your data:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Clerk</strong> - Authentication and user management</li>
            <li><strong>OpenAI</strong> - AI language model processing (embeddings)</li>
            <li><strong>Groq</strong> - AI inference processing</li>
            <li><strong>Vercel</strong> - Website hosting</li>
            <li><strong>Railway</strong> - Backend infrastructure</li>
          </ul>
          <p className="mt-4">
            Each third-party service has its own privacy policy governing the use of your information.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">5. Data Retention</h2>
          <p>
            We retain your account information and conversation history for as long as your
            account is active. You may request deletion of your data at any time by contacting us.
          </p>
          <p className="mt-4">
            Upon account deletion, we will remove your personal data within 30 days, except
            where retention is required by law or for legitimate business purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access</strong> - Request a copy of your personal data</li>
            <li><strong>Correction</strong> - Request correction of inaccurate data</li>
            <li><strong>Deletion</strong> - Request deletion of your personal data</li>
            <li><strong>Export</strong> - Request a portable copy of your data</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, contact us at support@epfiles.ai.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">7. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your
            personal data against unauthorized access, alteration, disclosure, or destruction.
            However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">8. Cookies</h2>
          <p>
            We use only essential cookies required for authentication and session management.
            We do not use tracking cookies or third-party analytics cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any
            changes by posting the new Privacy Policy on this page.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <p className="mt-2">
            <a href="mailto:support@epfiles.ai" className="text-blue-400 hover:text-blue-300">
              support@epfiles.ai
            </a>
          </p>
        </section>
      </div>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <h1 className="font-[family-name:var(--font-libre-baskerville)] text-2xl sm:text-3xl text-zinc-100 mb-8">
        Terms of Service
      </h1>

      <div className="prose prose-invert prose-zinc max-w-none space-y-6 text-zinc-300">
        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using epfiles.ai (&quot;the Service&quot;), you agree to be bound by these
            Terms of Service. If you do not agree to these terms, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">2. Description of Service</h2>
          <p>
            epfiles.ai is a free, open-source AI-powered research tool that uses Retrieval-Augmented
            Generation (RAG) technology to help users search and analyze publicly available documents.
            The Service provides AI-generated responses based on indexed public records.
          </p>
          <p className="mt-4">
            The source code for this project is available on GitHub under the MIT license.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">3. Account Registration</h2>
          <p>
            To use the Service, you must create an account. You agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide accurate and complete registration information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized use</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">4. Acceptable Use</h2>
          <p>You agree NOT to use the Service to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Conduct illegal research or activities</li>
            <li>Harass, defame, or harm any person</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Attempt to gain unauthorized access to the Service</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Use automated tools to scrape or extract data beyond normal use</li>
            <li>Share your account credentials with others</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">5. Content Disclaimer</h2>
          <p>
            <strong>AI-Generated Content:</strong> The Service uses artificial intelligence to
            generate responses. AI systems can make errors, produce inaccurate information, or
            &quot;hallucinate&quot; content that appears factual but is not. You should independently
            verify any information obtained through the Service before relying on it.
          </p>
          <p className="mt-4">
            <strong>Source Material:</strong> The documents indexed by our Service are publicly
            available records. We do not guarantee the accuracy, completeness, or reliability
            of the underlying source documents.
          </p>
          <p className="mt-4">
            <strong>Not Legal Advice:</strong> The Service does not provide legal, professional,
            or expert advice. Consult qualified professionals for specific guidance.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">6. Open Source License</h2>
          <p>
            <strong>MIT License:</strong> The source code for this project is released under the
            MIT License. You are free to use, copy, modify, merge, publish, distribute, sublicense,
            and/or sell copies of the software, subject to the license terms.
          </p>
          <p className="mt-4">
            <strong>Your Queries:</strong> You retain ownership of the queries you submit.
            By using the Service, you grant us a license to process your queries to provide
            the Service.
          </p>
          <p className="mt-4">
            <strong>AI Outputs:</strong> Outputs generated by the AI are provided for your
            personal or business use. We make no claim of ownership over AI-generated outputs.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">7. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT
            WARRANTIES OF ANY KIND. WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
          </p>
          <p className="mt-4">
            This is a free, open-source service provided without warranty. Use at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">8. Indemnification</h2>
          <p>
            You agree to indemnify and hold us harmless from any claims, damages, or expenses
            arising from your use of the Service, your violation of these Terms, or your
            violation of any rights of a third party.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">9. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your access to the Service at any
            time for violation of these Terms or for any other reason at our discretion.
            You may terminate your account at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">10. Changes to Terms</h2>
          <p>
            We may modify these Terms at any time. We will notify you of material changes by
            posting the updated Terms on the Service. Your continued use after changes
            constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">11. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the
            United States, without regard to conflict of law principles.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-zinc-200 font-semibold mt-8 mb-4">12. Contact</h2>
          <p>
            For questions about these Terms, contact us at:
          </p>
          <p className="mt-2">
            <a href="mailto:support@epfiles.ai" className="text-blue-400 hover:text-blue-300">
              support@epfiles.ai
            </a>
          </p>
        </section>
      </div>
    </>
  );
}
