import type { Metadata, Viewport } from "next";
import { Inter as FontSans } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import SessionProvider from "@/components/providers/session-provider"
import { auth } from "@/auth"
import { ReactQueryProvider } from "@/components/providers/query-provider"
import "./globals.css";
import { cn } from "@/lib/utils";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap", // Performance: prevent FOIT
  preload: true,
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Learnaxia",
    template: "%s | Learnaxia",
  },
  description: "Yargılamaz, ilerletir. Akıllı öğrenme platformu ile kartlarını oluştur, çalış ve ilerlemeni takip et.",
  keywords: ["öğrenme", "flashcard", "spaced repetition", "quiz", "eğitim", "AI", "yapay zeka"],
  authors: [{ name: "Learnaxia" }],
  creator: "Learnaxia",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Learnaxia",
    title: "Learnaxia — Akıllı Öğrenme Platformu",
    description: "AI destekli flashcard ve quiz oluştur, spaced repetition ile öğren.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Learnaxia",
    description: "AI destekli akıllı öğrenme platformu",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth()

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://accounts.google.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <SessionProvider session={session}>
          <ReactQueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </ReactQueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
