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
      <div className="flex h-full bg-[#D9D9D9] overflow-hidden">
        <div className="flex-1 flex flex-col h-full relative">
          <div className="py-4 px-3">
            <div className="flex mb-2 justify-start items-center">
              <button
                onClick={() => router.back()}
                className="text-[#060823] hover:bg-black/5 rounded-lg cursor-pointer w-10 h-10 flex items-center justify-center shrink-0"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="max-w-2xl mx-auto">
              {/* Tabs */}
              <div className="flex gap-1 mb-8 p-1 bg-[#e5e5e5] border border-[#c4c4c4] rounded-lg w-fit">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      activeTab === tab.id
                        ? "bg-white text-[#060823] shadow-sm"
                        : "text-[#52525b] hover:text-[#060823] hover:bg-white/50"
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
      <h1 className="font-[family-name:var(--font-libre-baskerville)] text-2xl sm:text-3xl text-[#060823] mb-8">
        Privacy Policy
      </h1>

      <div className="max-w-none space-y-6 text-[#52525b]">
        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            epfiles.ai (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you use our AI-powered research service.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">2. Information We Collect</h2>

          <h3 className="text-lg text-[#3f3f46] font-medium mt-6 mb-3">Account Information</h3>
          <p>When you create an account, we collect:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Email address</li>
            <li>Name (if provided)</li>
            <li>Profile picture (if provided via OAuth)</li>
            <li>Authentication credentials managed by Clerk</li>
          </ul>

          <h3 className="text-lg text-[#3f3f46] font-medium mt-6 mb-3">Usage Data</h3>
          <p>When you use our service, we collect:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Search queries and conversation history</li>
            <li>Query timestamps and frequency</li>
          </ul>

          <h3 className="text-lg text-[#3f3f46] font-medium mt-6 mb-3">Technical Data</h3>
          <p>We automatically collect:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
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
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">4. Third-Party Services</h2>
          <p>We use the following third-party services that may process your data:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Clerk</strong> - Authentication and user management</li>
            <li><strong>xAI</strong> - AI language model processing (when you provide your own API key)</li>
            <li><strong>Vercel</strong> - Website hosting</li>
            <li><strong>Railway</strong> - Backend infrastructure</li>
          </ul>
          <p className="mt-4">
            Each third-party service has its own privacy policy governing the use of your information.
            When you use your own xAI API key, your queries are sent directly to xAI and are subject
            to xAI&apos;s privacy policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">5. Data Retention</h2>
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
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access</strong> - Request a copy of your personal data</li>
            <li><strong>Correction</strong> - Request correction of inaccurate data</li>
            <li><strong>Deletion</strong> - Request deletion of your personal data</li>
            <li><strong>Export</strong> - Request a portable copy of your data</li>
            <li><strong>Opt-out</strong> - Opt out of marketing communications</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, open an issue on{" "}
            <a href="https://github.com/benbaessler/epfiles/issues" className="text-[#161F81] hover:text-[#1a2599]">
              GitHub
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">7. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your
            personal data against unauthorized access, alteration, disclosure, or destruction.
            However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">8. Cookies</h2>
          <p>
            We use cookies and similar technologies to maintain your session, remember your
            preferences, and analyze how our service is used. You can control cookies through
            your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any
            changes by posting the new Privacy Policy on this page.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please open an issue on{" "}
            <a href="https://github.com/benbaessler/epfiles/issues" className="text-[#161F81] hover:text-[#1a2599]">
              GitHub
            </a>.
          </p>
        </section>
      </div>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <h1 className="font-[family-name:var(--font-libre-baskerville)] text-2xl sm:text-3xl text-[#060823] mb-8">
        Terms of Service
      </h1>

      <div className="max-w-none space-y-6 text-[#52525b]">
        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using epfiles.ai (&quot;the Service&quot;), you agree to be bound by these
            Terms of Service. If you do not agree to these terms, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">2. Description of Service</h2>
          <p>
            epfiles.ai is an AI-powered research tool that uses Retrieval-Augmented Generation (RAG)
            technology to help users search and analyze publicly available documents. The Service
            provides AI-generated responses based on indexed public records. To use the AI features,
            you must provide your own xAI API key.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">3. Account Registration</h2>
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
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">4. Acceptable Use</h2>
          <p>You agree NOT to use the Service to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Conduct illegal research or activities</li>
            <li>Harass, defame, or harm any person</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Attempt to gain unauthorized access to the Service</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Use automated tools to scrape or extract data beyond normal use</li>
            <li>Share your account credentials with others</li>
            <li>Resell or redistribute the Service without authorization</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">5. Content Disclaimer</h2>
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
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">6. API Keys</h2>
          <p>
            <strong>Your API Key:</strong> The Service requires you to provide your own xAI API key
            to use AI-powered features. You are solely responsible for obtaining, securing, and
            managing your API key.
          </p>
          <p className="mt-4">
            <strong>API Usage and Billing:</strong> API usage is billed directly by xAI according to
            their pricing and terms. We do not charge for the use of this Service; you only pay xAI
            for your API usage.
          </p>
          <p className="mt-4">
            <strong>Third-Party Terms:</strong> By using your xAI API key with this Service, you agree
            to comply with xAI&apos;s terms of service and acceptable use policies.
          </p>
          <p className="mt-4">
            <strong>Key Security:</strong> Keep your API key confidential. Your API key is encrypted
            and stored locally in your browser. It is never sent to our servers. You can choose to
            store it only for your current browser session. We are not responsible for any unauthorized
            use of your API key or charges incurred through such use.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">7. Intellectual Property</h2>
          <p>
            <strong>Our Content:</strong> The Service, including its design, features, and
            underlying technology, is owned by us and protected by intellectual property laws.
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
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT
            WARRANTIES OF ANY KIND. WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
          </p>
          <p className="mt-4">
            AS THIS SERVICE IS PROVIDED FREE OF CHARGE, OUR TOTAL LIABILITY FOR ANY CLAIMS
            ARISING FROM YOUR USE OF THE SERVICE SHALL BE LIMITED TO THE FULLEST EXTENT
            PERMITTED BY LAW.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">9. Indemnification</h2>
          <p>
            You agree to indemnify and hold us harmless from any claims, damages, or expenses
            arising from your use of the Service, your violation of these Terms, or your
            violation of any rights of a third party.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">10. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your access to the Service at any
            time for violation of these Terms or for any other reason at our discretion.
            You may terminate your account at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">11. Changes to Terms</h2>
          <p>
            We may modify these Terms at any time. We will notify you of material changes by
            posting the updated Terms on the Service. Your continued use after changes
            constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">12. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the
            United States, without regard to conflict of law principles.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#060823] font-semibold mt-8 mb-4">13. Contact</h2>
          <p>
            For questions about these Terms, please open an issue on{" "}
            <a href="https://github.com/benbaessler/epfiles/issues" className="text-[#161F81] hover:text-[#1a2599]">
              GitHub
            </a>.
          </p>
        </section>
      </div>
    </>
  );
}
