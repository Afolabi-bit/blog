import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border/50 bg-background/60 backdrop-blur-sm transition-colors">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
        {/* Brand & Copyright */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2 transition-opacity hover:opacity-85 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            aria-label="Bloggr home"
          >
            <Image
              src="/logo.png"
              alt=""
              width={22}
              height={22}
              className="size-5.5 rounded-full object-cover shadow-2xs"
            />
            <span className="font-serif text-base font-bold tracking-tight text-accent-solid">
              Bloggr
            </span>
          </Link>
          <span className="text-muted-foreground/30 text-xs select-none">·</span>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            © {currentYear}
          </span>
        </div>

        {/* Editorial Statement */}
        <p className="hidden text-xs text-muted-foreground/80 md:block">
          Distraction-free publishing for essays, stories, and ideas.
        </p>

        {/* Navigation */}
        <nav
          aria-label="Footer"
          className="flex items-center gap-6 text-xs font-medium text-muted-foreground"
        >
          <Link
            href="/"
            className="transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
          >
            Articles
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
            Settings
          </Link>
          <Link
            href="/settings/author-request"
            className="transition-colors hover:text-accent-solid focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
          >
            Write
          </Link>
        </nav>
      </div>
    </footer>
  );
}
