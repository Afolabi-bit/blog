import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/general/Navbar";
import { Footer } from "@/components/general/Footer";
import { AuthProvider } from "@/components/general/AuthProvider";
import { ThemeProvider, themeScript } from "@/lib/theme";
import { QueryProvider } from "@/lib/query-client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ColdStartNotice } from "@/components/general/ColdStartNotice";
import { OfflineBanner } from "@/components/general/OfflineBanner";
import { getServerSession } from "@/lib/auth";
import { Toaster } from "sonner";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bloggr — Distraction-Free Reading and Publishing",
  description:
    "A modern blogging platform built with editorial craft, fast typography, and developer workflows.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getServerSession();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-accent-solid/20 selection:text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-accent-solid focus:px-4 focus:py-2 focus:text-white focus:shadow-md focus-visible:outline-hidden"
        >
          Skip to main content
        </a>
        <OfflineBanner />
        <QueryProvider>
          <ThemeProvider>
            <TooltipProvider delayDuration={200}>
              <AuthProvider initialUser={user}>
                <div className="flex min-h-screen flex-col">
                  <Navbar user={user} />
                  <main
                    id="main-content"
                    className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6"
                  >
                    {children}
                  </main>
                  <Footer />
                </div>
                <ColdStartNotice />
                <Toaster position="top-right" richColors />
              </AuthProvider>
            </TooltipProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
