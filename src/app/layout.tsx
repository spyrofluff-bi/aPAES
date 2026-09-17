import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Bowlby_One } from "next/font/google";
import "./globals.css";
import AuthGate from "../components/AuthGate";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const bowlbyOne = Bowlby_One({ weight: "400", subsets: ["latin"], variable: "--font-bowlby" });

export const metadata: Metadata = {
  title: {
    default: "Panel de estudio",
    template: "%s | Panel de estudio",
  },
  description: "Organiza tus ensayos, practica y revisa tu progreso con un panel de estudio sencillo.",
  keywords: ["estudio", "ensayos", "práctica", "progreso académico", "exámenes"],
  applicationName: "Panel de estudio",
  authors: [{ name: "Panel de estudio" }],
  creator: "Panel de estudio",
  publisher: "Panel de estudio",
  category: "education",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    siteName: "Panel de estudio",
    title: "Panel de estudio",
    description: "Organiza tus ensayos, practica y revisa tu progreso.",
  },
  twitter: {
    card: "summary",
    title: "Panel de estudio",
    description: "Organiza tus ensayos, practica y revisa tu progreso.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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

export const viewport: Viewport = {
  themeColor: "#dadaec",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
