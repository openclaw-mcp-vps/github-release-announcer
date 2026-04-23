import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "700"]
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500"]
});

export const metadata: Metadata = {
  metadataBase: new URL("https://github-release-announcer.vercel.app"),
  title: "GitHub Release Announcer | Auto-announce releases across all channels",
  description:
    "Automatically post GitHub releases to Slack, Discord, Twitter, and email lists with channel-specific formatting and reliable fan-out delivery logs.",
  openGraph: {
    title: "GitHub Release Announcer",
    description:
      "Never forget release announcements again. One GitHub release event, every customer-facing channel updated instantly.",
    url: "https://github-release-announcer.vercel.app",
    siteName: "GitHub Release Announcer",
    type: "website"
  },
  robots: {
    index: true,
    follow: true
  },
  twitter: {
    card: "summary_large_image",
    title: "GitHub Release Announcer",
    description:
      "Auto-announce GitHub releases across Slack, Discord, Twitter, and email with custom templates."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${plexMono.variable} antialiased`}>
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_42%),radial-gradient(circle_at_20%_20%,_rgba(34,197,94,0.12),_transparent_40%)]" />
          {children}
        </div>
      </body>
    </html>
  );
}
