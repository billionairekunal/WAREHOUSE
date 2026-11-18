import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, DM_Serif_Display } from "next/font/google";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { FirebaseInit } from "@/components/FirebaseInit";
import "./globals.css";

const body = Inter({ variable: "--font-body", subsets: ["latin"] });
const display = Inter_Tight({ variable: "--font-display", subsets: ["latin"], weight: ["600", "700", "800", "900"] });
const serif = DM_Serif_Display({ variable: "--font-serif-display", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: { default: "Chakan MIDC Force · Verified warehouse space in Pune", template: "%s · Chakan MIDC Force" },
  description: "Find, compare and lease verified warehouses, open yards and flexible storage across Chakan, Talegaon, Bhosari and Pune.",
};

export const viewport: Viewport = { themeColor: "#03195b" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${serif.variable}`}>
      <body className="min-h-dvh">
        <Header />
        {children}
        <MobileNav />
        <FirebaseInit />
      </body>
    </html>
  );
}
