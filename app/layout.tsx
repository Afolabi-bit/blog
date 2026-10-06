import type { Metadata } from "next";
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
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://bloggr.dev"),
  title: {
    default: "Bloggr — Distraction-Free Reading and Publishing",
    template: "%s — Bloggr",
  },
  description:
    "A modern blogging platform built with editorial craft, fast typography, and developer workflows.",
  openGraph: {
    title: "Bloggr — Distraction-Free Reading and Publishing",
    description:
      "A modern blogging platform built with editorial craft, fast typography, and developer workflows.",
    type: "website",
    url: "/",
    siteName: "Bloggr",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bloggr — Distraction-Free Reading and Publishing",
    description:
      "A modern blogging platform built with editorial craft, fast typography, and developer workflows.",
  },
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
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap"
          rel="stylesheet"
        />
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
                <Toaster position="bottom-right" />
              </AuthProvider>
            </TooltipProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
