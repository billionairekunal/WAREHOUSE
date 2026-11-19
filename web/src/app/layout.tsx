import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, DM_Serif_Display, Noto_Sans_Devanagari } from "next/font/google";
import { getLang } from "@/lib/i18n/server";
import { messagesFor } from "@/lib/i18n";
import { LangProvider } from "@/lib/i18n/client";
import { FirebaseInit } from "@/components/FirebaseInit";
import "./globals.css";

const body = Inter({ variable: "--font-body", subsets: ["latin"], display: "swap" });
const display = Inter_Tight({ variable: "--font-display", subsets: ["latin"], weight: ["700", "800", "900"], display: "swap" });
// Hindi + Marathi; only downloaded when Devanagari text is on the page
const deva = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"], weight: ["400", "500", "600", "700", "800"], display: "swap", preload: false });
const serif = DM_Serif_Display({ variable: "--font-serif-display", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: { default: "Chakan MIDC Force · Verified warehouse space in Pune", template: "%s · Chakan MIDC Force" },
  description: "Find, compare and lease verified warehouses, open yards and flexible storage across Chakan, Talegaon, Bhosari and Pune.",
};

export const viewport: Viewport = { themeColor: "#03195b" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${body.variable} ${display.variable} ${serif.variable} ${deva.variable}`}>
      <body className="min-h-dvh">
        <LangProvider lang={lang} messages={messagesFor(lang)}>
        {children}
        <FirebaseInit />
        </LangProvider>
      </body>
    </html>
  );
}
