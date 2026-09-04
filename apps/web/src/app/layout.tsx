import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Linkedon — Professional Contact Enrichment",
    template: "%s | Linkedon",
  },
  description:
    "Find verified professional contact data from authorized sources. Enrich LinkedIn profiles, emails, and phone numbers with Linkedon's AI-powered enrichment platform.",
  keywords: [
    "contact enrichment",
    "email finder",
    "phone finder",
    "professional contacts",
    "LinkedIn enrichment",
    "sales intelligence",
    "recruiting tool",
  ],
  authors: [{ name: "Linkedon" }],
  creator: "Linkedon",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://linkedon.io",
    siteName: "Linkedon",
    title: "Linkedon — Professional Contact Enrichment",
    description: "Find verified professional contact data from authorized sources.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Linkedon — Professional Contact Enrichment",
    description: "Find verified professional contact data from authorized sources.",
    creator: "@linkedon",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
