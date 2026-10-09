"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { AuthUser } from "@/lib/types";
import { NavbarUserMenu } from "./NavbarUserMenu";
import { BookOpen, LayoutDashboard } from "lucide-react";

interface NavbarProps {
  user: AuthUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const isAuthor = user?.role === "author" || user?.role === "admin";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand & Primary Navigation */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent-solid/50 rounded-lg p-0.5"
            aria-label="Noterverse home"
          >
            <div className="relative size-8.5 rounded-full overflow-hidden shadow-xs ring-1 ring-border/50 transition-transform group-hover:scale-105">
              <Image
                src="/noterverse-logo.png"
                alt="Noterverse"
                width={34}
                height={34}
                className="size-full object-cover"
                priority
              />
            </div>
            <span className="font-serif text-2xl font-extrabold tracking-tight text-accent-solid">
              Noterverse
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-1.5 text-sm font-medium"
          >
            <Link
              href="/"
              aria-current={pathname === "/" ? "page" : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs lg:text-sm transition-all ${
                pathname === "/"
                  ? "bg-muted/80 text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <BookOpen className="size-3.5 opacity-70" />
              <span>Articles</span>
            </Link>

            {isAuthor && (
              <Link
                href="/dashboard"
                aria-current={pathname === "/dashboard" ? "page" : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs lg:text-sm transition-all ${
                  pathname.startsWith("/dashboard")
                    ? "bg-muted/80 text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <LayoutDashboard className="size-3.5 opacity-70" />
                <span>Studio</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right: Actions, Theme, User Menu, and Mobile Trigger */}
        <NavbarUserMenu user={user} />
      </div>
    </header>
  );
}
