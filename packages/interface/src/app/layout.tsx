import type { Metadata } from "next";
import { Inter, Libre_Baskerville, Space_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Epfiles",
  description: "AI-powered forensic analysis of the Epstein files.",
};

const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html lang="en">
      <body
        className={`${inter.variable} ${libreBaskerville.variable} ${spaceMono.variable} antialiased bg-[#D9D9D9] text-[#060823]`}
        suppressHydrationWarning
      >
        <PostHogProvider>
          <PostHogPageview />
          {children}
        </PostHogProvider>
      </body>
    </html>
  );

  if (!isProd) {
    return content;
  }

  return (
    <ClerkProvider
      appearance={{
        elements: {
          formFieldRow__name: {
            display: "none",
          },
        },
      }}
    >
      {content}
    </ClerkProvider>
  );
}
