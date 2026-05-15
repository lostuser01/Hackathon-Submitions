import type { Metadata } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { SceneProvider } from "@/components/SceneContext";

import { GlobalScene } from "@/components/GlobalScene";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["300", "400", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Prestige Protocol | Smart Grievance Redressal",
  description: "AI-powered civic issue reporting & resolution",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sora.variable} ${mono.variable}`}>
      <body>
        <SceneProvider>
          <GlobalScene />
          <div className="relative z-10">{children}</div>
        </SceneProvider>
      </body>
    </html>
  );
}

