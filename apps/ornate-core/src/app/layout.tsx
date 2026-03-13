import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ClbToastProvider } from "@/context/ClbToastContext";
import { TooltipProviderWrapper } from "@/components/TooltipProviderWrapper";
import InstallPWA from "@/components/InstallPWA";
import PushBootstrap from "@/components/PushBootstrap";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  manifest: '/manifest.json',
  applicationName: "Ornate EMS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ornate EMS",
  },
  title: {
    template: '%s | Ornate EMS',
    default: 'Ornate EMS — Modern Event Management System',
  },
  description: 'Streamline institutional event planning with Ornate EMS. From sports registrations and certificates to real-time analytics and portal management.',
  keywords: ['Campus Events', 'Sports Management', 'University Registration', 'Ornate EMS', 'Event Analytics', 'Certificate Generation'],
  authors: [{ name: 'Ornate Team' }],
  creator: 'Ornate Team',
  publisher: 'Institutional Events',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/assets/icon-192x192.png' },
      { url: '/assets/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: { url: '/assets/icon-180x180.png', sizes: '180x180', type: 'image/png' },
  },
  openGraph: {
    title: 'Ornate EMS — Event Management Redefined',
    description: 'The ultimate platform for campus event management and student registrations.',
    url: siteUrl,
    siteName: 'Ornate EMS',
    images: [
      {
        url: '/Ornate_LOGO.jpg.jpeg',
        width: 800,
        height: 600,
        alt: 'Ornate EMS Logo',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ornate EMS — Event Management Redefined',
    description: 'Campus events, sports, and institutional management in one unified platform.',
    images: ['/Ornate_LOGO.jpg.jpeg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ServiceWorkerRegister />
          <PushBootstrap />
          <ClbToastProvider>
            <TooltipProviderWrapper>
              <Toaster />
              <InstallPWA />
              {children}
            </TooltipProviderWrapper>
          </ClbToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
