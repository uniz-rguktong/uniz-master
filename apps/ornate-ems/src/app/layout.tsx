import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ClbToastProvider } from "@/context/ClbToastContext";
import { TooltipProviderWrapper } from "@/components/TooltipProviderWrapper";
import type { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Ornate EMS",
    default: "Ornate EMS — Event Management System",
  },
  description: "Comprehensive multi-portal event management system for institutional event planning, registration, certificates, and analytics.",
  keywords: ["event management", "registration", "certificates", "dashboard", "university events"],
  icons: {
    icon: "/Ornate_LOGO.jpg.jpeg",
    apple: "/Ornate_LOGO.jpg.jpeg",
  },
  openGraph: {
    images: [{ url: "/Ornate_LOGO.jpg.jpeg" }],
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
          <ClbToastProvider>
            <TooltipProviderWrapper>
              <Toaster />
              {children}
            </TooltipProviderWrapper>
          </ClbToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
