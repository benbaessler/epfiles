"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export default function AboutPage() {
  const router = useRouter();

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
              {/* Hero Section */}
              <h1 className="font-[family-name:var(--font-libre-baskerville)] text-2xl sm:text-3xl text-[#060823] mb-4 leading-tight">
                Ask questions about the Epstein Files.
                <br />
                Get answers with sources.
              </h1>
              <p className="text-[#52525b] text-lg mb-12">
                Search thousands of court documents, depositions, and government
                releases using AI, with direct links to the original sources.
              </p>

              {/* How It Works */}
              <section className="mb-12">
                <h2 className="text-xl text-[#060823] font-semibold mb-6">
                  How It Works
                </h2>

                <div className="space-y-4 text-[#52525b]">
                  <p>
                    <strong className="text-[#060823]">You ask a question</strong>{" "}
                    like &quot;Who visited Little St. James in 2001?&quot; or
                    &quot;What did the pilot testify about?&quot;
                  </p>
                  <p>
                    <strong className="text-[#060823]">
                      The AI searches the documents
                    </strong>{" "}
                    and finds the most relevant passages across the entire corpus.
                  </p>
                  <p>
                    <strong className="text-[#060823]">
                      You get an answer with citations
                    </strong>{" "}
                    where each claim links directly to the source document and page
                    number, so you can verify it yourself.
                  </p>
                </div>
              </section>

              {/* What Documents Are Included */}
              <section className="mb-12">
                <h2 className="text-xl text-[#060823] font-semibold mb-4">
                  What Documents Are Included
                </h2>
                <div className="space-y-6 text-[#52525b]">
                  <div>
                    <h3 className="text-lg text-[#060823] font-medium mb-2">
                      DOJ Releases (Epstein Files Transparency Act)
                    </h3>
                    <p className="mb-2">
                      Data Sets 1 through 8 released under H.R.4405, the Epstein Files
                      Transparency Act. These include FBI reports, interview
                      transcripts, and investigative documents.
                    </p>
                    <p>
                      <a
                        href="https://www.justice.gov/epstein/doj-disclosures"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#161F81] hover:text-[#1a2599] underline underline-offset-2"
                      >
                        View original files at justice.gov
                      </a>
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg text-[#060823] font-medium mb-2">
                      House Oversight Committee
                    </h3>
                    <p className="mb-2">
                      The 7th Production release from the House Oversight
                      Committee, containing depositions, court filings, and
                      related materials.
                    </p>
                    <p>
                      <a
                        href="https://drive.google.com/drive/folders/1hTNH5woIRio578onLGElkTWofUSWRoH_"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#161F81] hover:text-[#1a2599] underline underline-offset-2"
                      >
                        View original files on Google Drive
                      </a>
                    </p>
                  </div>

                  <p className="text-sm text-[#71717a] italic">
                    This app is in its early stages. Currently only text content
                    is indexed (no images or videos). As functionality is proven
                    and the app evolves, the dataset will be expanded to include
                    more Epstein files.
                  </p>
                </div>
              </section>

              {/* Important Disclaimers */}
              <section className="mb-12">
                <h2 className="text-xl text-[#060823] font-semibold mb-4">
                  Important Disclaimers
                </h2>
                <div className="space-y-4 text-[#52525b]">
                  <p>
                    <strong className="text-[#060823]">AI can make mistakes.</strong>{" "}
                    The AI may misinterpret documents or miss relevant
                    information. Always verify important findings by reading the
                    original source documents.
                  </p>
                  <p>
                    <strong className="text-[#060823]">Not legal advice.</strong>{" "}
                    This tool is for research and informational purposes only. It
                    does not constitute legal advice or professional guidance.
                  </p>
                  <p>
                    <strong className="text-[#060823]">Public records only.</strong>{" "}
                    All documents indexed are publicly available records. We do
                    not create, modify, or editorialize the source material.
                  </p>
                </div>
              </section>

              {/* How To Use */}
              <section className="mb-12">
                <h2 className="text-xl text-[#060823] font-semibold mb-4">
                  How To Use
                </h2>
                <div className="space-y-4 text-[#52525b]">
                  <p>
                    This tool is <strong className="text-[#060823]">free to use</strong>.
                    You provide your own xAI API key and pay xAI directly for AI
                    processing costs (typically a few cents per conversation).
                  </p>
                  <p>
                    Your API key is{" "}
                    <strong className="text-[#060823]">
                      encrypted and stored only in your browser
                    </strong>
                    . It is never sent to our servers. You can choose to store it
                    only for your current session.
                  </p>
                  <p>
                    <a
                      href="https://console.x.ai/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#161F81] hover:text-[#1a2599] underline underline-offset-2"
                    >
                      Get an xAI API key
                    </a>
                  </p>
                </div>
              </section>

              {/* Open Source */}
              <section className="mb-12">
                <h2 className="text-xl text-[#060823] font-semibold mb-4">
                  Open Source
                </h2>
                <p className="text-[#52525b]">
                  This project is open source. View the source code, report issues,
                  or contribute on{" "}
                  <a
                    href="https://github.com/benbaessler/epfiles"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#161F81] hover:text-[#1a2599] underline underline-offset-2"
                  >
                    GitHub
                  </a>
                  .
                </p>
              </section>

            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
