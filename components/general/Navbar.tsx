import Link from "next/link";
import Image from "next/image";
import type { AuthUser } from "@/lib/types";
import { NavbarUserMenu } from "./NavbarUserMenu";

interface NavbarProps {
  user: AuthUser | null;
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          >
            <Image
              src="/logo.png"
              alt="Bloggr"
              width={32}
              height={32}
              className="size-8 rounded-full shadow-xs object-cover"
              priority
            />
            <span className="font-serif text-2xl font-extrabold tracking-tight text-accent-solid">
              Bloggr
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link
              href="/"
              className="transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
            >
              Articles
            </Link>
          </nav>
        </div>

        {/* Client interactive island */}
        <NavbarUserMenu user={user} />
      </div>
    </header>
  );
}
