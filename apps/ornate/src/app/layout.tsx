import type { Metadata, Viewport } from 'next';
import { Orbitron, Rajdhani } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import AuthProvider from '@/components/providers/AuthProvider';
import PushBootstrap from '@/components/PushBootstrap';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import InstallPWA from '@/components/InstallPWA';
import { Toaster } from 'sonner';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron'
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  variable: '--font-rajdhani',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  manifest: '/manifest.json',
  applicationName: "Ornate",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "Ornate",
  },
  title: "Ornate '26 — A Fest Beyond Earth | RGUKT Ongole",
  description: "Ornate '26 is the annual technical and cultural fest of RGUKT Ongole. Register for events, track missions, and compete for glory across branches.",
  metadataBase: new URL('https://ornate.rguktong.in'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: 'https://ornate.rguktong.in',
    title: "Ornate '26 — A Fest Beyond Earth",
    description: "RGUKT Ongole's annual fest. Register for technical & cultural events, track live scores, and compete for branch glory.",
    siteName: "Ornate '26",
  },
  twitter: {
    card: 'summary_large_image',
    title: "Ornate '26 — A Fest Beyond Earth",
    description: "RGUKT Ongole's annual fest. Register for events, track live scores, and compete for branch glory.",
  },
  icons: {
    icon: [
      { url: '/assets/Ornate_LOGO.svg' },
      { url: '/assets/Ornate_LOGO.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
    apple: { url: '/assets/Ornate_LOGO.svg', sizes: '180x180', type: 'image/svg+xml' },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#030308',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${orbitron.variable} ${rajdhani.variable} antialiased text-white font-orbitron`} suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>
            <ServiceWorkerRegister />
            <PushBootstrap />
            <InstallPWA />
            {children}
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'rgba(10, 15, 10, 0.9)',
                  border: '1px solid var(--color-neon)',
                  color: '#fff',
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: '0.75rem',
                },
              }}
            />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
