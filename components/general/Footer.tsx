import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-border bg-card/50 py-12 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-serif text-xl font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
            >
              <Image
                src="/logo.png"
                alt="Bloggr"
                width={28}
                height={28}
                className="size-7 rounded-full shadow-xs object-cover"
              />
              <span className="font-extrabold text-accent-solid">Bloggr</span>
            </Link>
            <p className="max-w-sm text-sm text-muted-foreground">
              A distraction-free reading and publishing platform crafted for
              thoughtful developers and creators.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <Link
              href="/"
              className="transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
            >
              Articles
            </Link>
            <Link
              href="/register"
              className="transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
            >
              Start Writing
            </Link>
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
            >
              Studio
            </Link>
            <Link
              href="/settings"
              className="transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
            >
              Account
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {currentYear} Bloggr. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with modern typography, semantic design tokens, and Next.js.
          </p>
        </div>
      </div>
    </footer>
  );
}
