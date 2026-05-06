import type { Metadata } from "next";
import { Inter, Space_Grotesk, Sora } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";
import Loader from "@components/loader";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "./providers";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space",
});


const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "Mutate Tools",
  description: "Mutate Tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  const googleClientId = process.env.GOOGLE_CLIENT_ID || "";

  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body
        className={`
          ${inter.className}
          ${spaceGrotesk.variable}
          ${sora.variable}
        `}
      >
        <Suspense fallback={<Loader />}>
          <Providers googleClientId={googleClientId}>
            <Toaster />
            {children}
          </Providers>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
