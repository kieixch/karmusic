import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { AppShell } from "@/components/layout/AppShell";

const vercelUrl =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  process.env.VERCEL_URL;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "KarMusic — Free music player with landscape lyrics",
    template: "%s · KarMusic",
  },
  description:
    "A free, local-first music player with a royalty-free online catalog, your own audio files, synced LRC lyrics and a fullscreen landscape lyrics mode.",
  applicationName: "KarMusic",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "KarMusic",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icons/icon-2911.jpeg", type: "image/jpeg", sizes: "1254x1254" }],
    apple: [{ url: "/icons/icon-2911.jpeg", type: "image/jpeg", sizes: "1254x1254" }],
  },
  openGraph: {
    title: "KarMusic",
    description:
      "Play free music and your own audio files with synced lyrics built for landscape screens.",
    type: "website",
    siteName: "KarMusic",
  },
};

export const viewport: Viewport = {
  themeColor: "#08090a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh app-surface antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-black"
        >
          Skip to content
        </a>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
