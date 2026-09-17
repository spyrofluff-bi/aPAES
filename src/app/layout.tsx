import type { Metadata } from "next";
import { Inter, Outfit, Bowlby_One } from "next/font/google";
import "./globals.css";
import AuthGate from "../components/AuthGate";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const bowlbyOne = Bowlby_One({ weight: "400", subsets: ["latin"], variable: "--font-bowlby" });

export const metadata: Metadata = {
    title: "Panel de estudio",
  description: "Organiza tus ensayos, practica y revisa tu progreso.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Panel de estudio",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#dadaec" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.variable} ${outfit.variable} ${bowlbyOne.variable} font-inter antialiased bg-[#dadaec] text-black`}>
        <AuthGate>
          {children}
        </AuthGate>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
