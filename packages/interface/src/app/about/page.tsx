export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#D9D9D9] overflow-auto">
      {/* Main Content Container */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Hero Section */}
        <div className="pt-12 sm:pt-16 md:pt-20 lg:pt-24 pb-8 sm:pb-12">
          <h1 className="font-[family-name:var(--font-libre-baskerville)] text-[1.625rem] sm:text-[1.875rem] md:text-[2.125rem] lg:text-[2.375rem] text-[#060823] leading-[1.15] tracking-[-0.02em] mb-4 sm:mb-5">
            Ask questions about the Epstein Files.
            <br />
            Get answers with sources.
          </h1>
          <p className="text-[#52525b] text-[0.9375rem] sm:text-base md:text-lg leading-relaxed max-w-xl">
            Search thousands of court documents, depositions, and government
            releases using AI, with direct links to the original sources.
          </p>
        </div>

        {/* Article Content */}
        <article className="pb-12 sm:pb-16 md:pb-20">
          {/* How It Works */}
          <section className="mb-12 sm:mb-14">
            <h2 className="text-lg sm:text-xl text-[#060823] font-semibold mb-5 tracking-[-0.01em]">
              How It Works
            </h2>

            <div className="space-y-4 text-[#52525b] text-[0.9375rem] sm:text-base leading-[1.7]">
              <p>
                <strong className="text-[#060823] font-medium">
                  You ask a question
                </strong>{" "}
                like &quot;Who visited Little St. James in 2001?&quot; or
                &quot;What did the pilot testify about?&quot;
              </p>
              <p>
                <strong className="text-[#060823] font-medium">
                  The AI searches the documents
                </strong>{" "}
                and finds the most relevant passages across the entire corpus.
              </p>
              <p>
                <strong className="text-[#060823] font-medium">
                  You get an answer with citations
                </strong>{" "}
                where each claim links directly to the source document and page
                number, so you can verify it yourself.
              </p>
            </div>
          </section>

          {/* What Documents Are Included */}
          <section className="mb-12 sm:mb-14">
            <h2 className="text-lg sm:text-xl text-[#060823] font-semibold mb-5 tracking-[-0.01em]">
              What Documents Are Included
            </h2>
            <div className="space-y-6 text-[#52525b] text-[0.9375rem] sm:text-base leading-[1.7]">
              <div>
                <h3 className="text-base sm:text-[1.0625rem] text-[#060823] font-medium mb-2">
                  DOJ Releases (Epstein Files Transparency Act)
                </h3>
                <p className="mb-2.5">
                  Datasets 4 through 7 released under H.R.4405, the Epstein
                  Files Transparency Act. These include FBI reports, interview
                  transcripts, and investigative documents.
                </p>
                <a
                  href="https://www.justice.gov/epstein/doj-disclosures"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[#161F81] hover:text-[#1a2599] underline underline-offset-2 decoration-[#161F81]/40 hover:decoration-[#161F81]/70 transition-colors"
                >
                  View original files at justice.gov
                </a>
              </div>

              <div>
                <h3 className="text-base sm:text-[1.0625rem] text-[#060823] font-medium mb-2">
                  House Oversight Committee
                </h3>
                <p className="mb-2.5">
                  The 7th Production release from the House Oversight Committee,
                  containing depositions, court filings, and related materials.
                </p>
                <a
                  href="https://drive.google.com/drive/folders/1hTNH5woIRio578onLGElkTWofUSWRoH_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[#161F81] hover:text-[#1a2599] underline underline-offset-2 decoration-[#161F81]/40 hover:decoration-[#161F81]/70 transition-colors"
                >
                  View original files on Google Drive
                </a>
              </div>

              <p className="text-sm text-[#71717a] italic border-l-2 border-[#a1a1aa] pl-4 py-0.5">
                This app is in its early stages. Currently only text content is
                indexed (no images or videos). As functionality is proven and
                the app evolves, the dataset will be expanded to include more
                Epstein files.
              </p>
            </div>
          </section>

          {/* Important Disclaimers */}
          <section className="mb-12 sm:mb-14">
            <h2 className="text-lg sm:text-xl text-[#060823] font-semibold mb-5 tracking-[-0.01em]">
              Important Disclaimers
            </h2>
            <div className="space-y-4 text-[#52525b] text-[0.9375rem] sm:text-base leading-[1.7]">
              <p>
                <strong className="text-[#060823] font-medium">
                  AI can make mistakes.
                </strong>{" "}
                The AI may misinterpret documents or miss relevant information.
                Always verify important findings by reading the original source
                documents.
              </p>
              <p>
                <strong className="text-[#060823] font-medium">
                  Not legal advice.
                </strong>{" "}
                This tool is for research and informational purposes only. It
                does not constitute legal advice or professional guidance.
              </p>
              <p>
                <strong className="text-[#060823] font-medium">
                  Public records only.
                </strong>{" "}
                All documents indexed are publicly available records. We do not
                create, modify, or editorialize the source material.
              </p>
            </div>
          </section>

          {/* How To Use */}
          <section className="mb-12 sm:mb-14">
            <h2 className="text-lg sm:text-xl text-[#060823] font-semibold mb-5 tracking-[-0.01em]">
              How To Use
            </h2>
            <div className="space-y-4 text-[#52525b] text-[0.9375rem] sm:text-base leading-[1.7]">
              <p>
                This tool is{" "}
                <strong className="text-[#060823] font-medium">
                  free to use
                </strong>
                . You provide your own xAI API key and pay xAI directly for AI
                processing costs (typically a few cents per conversation).
              </p>
              <p>
                Your API key is{" "}
                <strong className="text-[#060823] font-medium">
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
                  className="inline-flex items-center text-[#161F81] hover:text-[#1a2599] underline underline-offset-2 decoration-[#161F81]/40 hover:decoration-[#161F81]/70 transition-colors"
                >
                  Get an xAI API key
                </a>
              </p>
            </div>
          </section>

          {/* Open Source */}
          <section>
            <h2 className="text-lg sm:text-xl text-[#060823] font-semibold mb-5 tracking-[-0.01em]">
              Open Source
            </h2>
            <p className="text-[#52525b] text-[0.9375rem] sm:text-base leading-[1.7]">
              This project is open source. View the source code, report issues,
              or contribute on{" "}
              <a
                href="https://github.com/benbaessler/epfiles"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[#161F81] hover:text-[#1a2599] underline underline-offset-2 decoration-[#161F81]/40 hover:decoration-[#161F81]/70 transition-colors"
              >
                GitHub
              </a>
              .
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
