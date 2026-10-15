import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StoreProvider } from "@/components/dashboard/store";
import { CommandPalette } from "@/components/command-palette";
import { OnboardingOverlay } from "@/components/onboarding/onboarding-overlay";
import { MotionConfig } from "motion/react";
import { AuroraParallax } from "@/components/motion/aurora-parallax";
import { ScrollDriver } from "@/components/motion/scroll-driver";
import { Cursor } from "@/components/motion/cursor";

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

/**
 * A proportional face, for reading.
 *
 * The whole product is set in a monospace, which is the identity and the right choice for
 * labels, numbers, code and controls — a column of figures lines up, and it reads as a
 * terminal. It is the wrong choice for *prose*: monospace sets every glyph to the same width,
 * so long passages lose the word-shape variation that the eye uses to skim, and readers
 * measurably slow down. So long-form text gets this, and nothing else changes.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AdmissionHack — the admission system, decoded",
    template: "%s · AdmissionHack",
  },
  description:
    "How admission works, how to choose universities, and every exam explained — SAT, IELTS, TOEFL, CSCA and more. Read the system. Get in.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jetbrains.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-mono">
        <MotionConfig reducedMotion="user">
        <StoreProvider>
          <AuroraParallax />
          <div className="backdrop-grid" aria-hidden />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <ScrollDriver />
          <Cursor />
          <CommandPalette />
          <OnboardingOverlay />
        </StoreProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
