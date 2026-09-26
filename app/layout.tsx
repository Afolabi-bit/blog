import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/general/Navbar";
import { AuthProvider } from "@/components/general/AuthProvider";
import { getServerSession } from "@/lib/auth";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Bloggr by Fenigma",
  description: "A modern blogging platform for developers",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch session server-side so the initial render is authenticated
  const user = await getServerSession();

  return (
    <html lang="en">
      <body className="antialiased max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
        <AuthProvider initialUser={user}>
          <div className="relative">
            <Navbar user={user} />
            <main>{children}</main>
          </div>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
