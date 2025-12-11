import type { Metadata } from "next";
import { Inter, Libre_Baskerville } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { PostHogPageview } from "@/components/providers/PostHogPageview";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-libre-baskerville",
  display: "swap",
});

export const metadata: Metadata = {
  title: "epfiles.ai",
  description: "AI-powered forensic analysis of the Epstein files.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        elements: {
          formFieldRow__name: {
            display: "none",
          },
        },
      }}
    >
      <html lang="en" className="dark">
        <body
          className={`${inter.variable} ${libreBaskerville.variable} antialiased bg-zinc-950 text-zinc-200`}
          suppressHydrationWarning
        >
          <PostHogProvider>
            <PostHogPageview />
            {children}
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
