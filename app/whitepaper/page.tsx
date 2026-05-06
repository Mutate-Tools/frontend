import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Whitepaper | Mutate Tools",
  description:
    "Official Whitepaper for Mutate.tools — a privacy-first, Web3-native social communication platform built on moving-target identity architecture.",
};

export default function WhitepaperPage() {
  return (
    <iframe
      src="/docs/whitepaper.html"
      className="fixed inset-0 w-full h-full border-0"
      title="Mutate Tools — Official Whitepaper v1.0"
      allowFullScreen
    />
  );
}
