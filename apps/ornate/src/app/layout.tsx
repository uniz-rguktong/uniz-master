import type { Metadata } from "next";
import { Orbitron } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/Layout/SmoothScroll";
import { getAssetUrl } from "@/lib/assets";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Ornate | Witness the Gallons of Zeal",
  description:
    "Join the ultimate spacefest journey. A revolutionary college festival experience beyond the stars.",
  keywords: [
    "college fest",
    "ornate",
    "spacefest",
    "techfest",
    "cultural fest",
    "events space",
    "student festival",
  ],
  openGraph: {
    title: "Ornate | Witness the Gallons of Zeal",
    description:
      "Join the ultimate spacefest journey. A revolutionary college festival experience beyond the stars.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ornate | Witness the Gallons of Zeal",
    description:
      "Join the ultimate spacefest journey. A revolutionary college festival experience beyond the stars.",
  },
  icons: {
    icon: "https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev/landing-assets/Ornate_LOGO.svg",
    shortcut:
      "https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev/landing-assets/Ornate_LOGO.svg",
    apple:
      "https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev/landing-assets/Ornate_LOGO.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ornate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={orbitron.className} suppressHydrationWarning>
        <SmoothScroll>{children}</SmoothScroll>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) { console.log('[PWA] ServiceWorker registration successful'); },
                    function(err) { console.log('[PWA] ServiceWorker registration failed: ', err); }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
