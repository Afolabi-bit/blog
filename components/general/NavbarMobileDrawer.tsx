"use client";

import Link from "next/link";
import Image from "next/image";
import type { AuthUser } from "@/lib/types";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  BookOpen,
  LayoutDashboard,
  PenSquare,
  Shield,
  Settings,
  LogOut,
  Sun,
  Moon,
  Laptop,
  PenTool,
  User as UserIcon,
  ChevronRight,
} from "lucide-react";

interface NavbarMobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AuthUser | null;
  logout: () => void;
  pathname: string;
}

export function NavbarMobileDrawer({
  open,
  onOpenChange,
  user,
  logout,
  pathname,
}: NavbarMobileDrawerProps) {
  const { theme, setTheme } = useTheme();

  const displayName =
    user?.full_name || user?.username || user?.email?.split("@")[0] || "Reader";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const isAuthor = user?.role === "author" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const isReader = user?.role === "reader";

  const handleNavClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[85vw] sm:w-[360px] max-w-[380px] p-0 flex flex-col justify-between bg-background/98 backdrop-blur-xl border-l border-border/80 shadow-2xl"
      >
        {/* Drawer Header: Clean Brand Identity */}
        <SheetHeader className="p-5 pb-4 border-b border-border/60">
          <Link
            href="/"
            onClick={handleNavClick}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          >
            <Image
              src="/noterverse-logo.png"
              alt="Noterverse"
              width={28}
              height={28}
              className="size-7 rounded-full shadow-xs object-cover"
            />
            <SheetTitle className="font-serif text-xl font-extrabold tracking-tight text-accent-solid text-left leading-none">
              Noterverse
            </SheetTitle>
          </Link>
        </SheetHeader>

        {/* Navigation Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 custom-scrollbar">
          {/* Main Navigation Links */}
          <div className="space-y-1">
            <Link
              href="/"
              onClick={handleNavClick}
              aria-current={pathname === "/" ? "page" : undefined}
              className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                pathname === "/"
                  ? "bg-accent-solid/10 text-accent-solid font-semibold border border-accent-solid/20 shadow-2xs"
                  : "text-foreground/90 hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span>Articles</span>
              </div>
              <ChevronRight
                className={`size-4 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100 ${
                  pathname === "/" ? "text-accent-solid opacity-100" : ""
                }`}
              />
            </Link>

            {isAuthor && (
              <>
                <Link
                  href="/dashboard"
                  onClick={handleNavClick}
                  aria-current={pathname === "/dashboard" ? "page" : undefined}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    pathname === "/dashboard"
                      ? "bg-accent-solid/10 text-accent-solid font-semibold border border-accent-solid/20 shadow-2xs"
                      : "text-foreground/90 hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span>Author Studio</span>
                  </div>
                  <ChevronRight
                    className={`size-4 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100 ${
                      pathname === "/dashboard" ? "text-accent-solid opacity-100" : ""
                    }`}
                  />
                </Link>

                <Link
                  href="/dashboard/create"
                  onClick={handleNavClick}
                  aria-current={pathname === "/dashboard/create" ? "page" : undefined}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    pathname === "/dashboard/create"
                      ? "bg-accent-solid/10 text-accent-solid font-semibold border border-accent-solid/20 shadow-2xs"
                      : "text-foreground/90 hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <PenSquare className="size-4 text-accent-solid" />
                    <span>Write New Story</span>
                  </div>
                  <ChevronRight className="size-4 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              </>
            )}

            {isReader && (
              <Link
                href="/settings/author-request"
                onClick={handleNavClick}
                aria-current={pathname === "/settings/author-request" ? "page" : undefined}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  pathname === "/settings/author-request"
                    ? "bg-accent-solid/10 text-accent-solid font-semibold border border-accent-solid/20 shadow-2xs"
                    : "text-foreground/90 hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <PenTool className="size-4 text-accent-warm" />
                  <span>Become an Author</span>
                </div>
                <ChevronRight className="size-4 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={handleNavClick}
                aria-current={pathname.startsWith("/admin") ? "page" : undefined}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  pathname.startsWith("/admin")
                    ? "bg-accent-solid/10 text-accent-solid font-semibold border border-accent-solid/20 shadow-2xs"
                    : "text-foreground/90 hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="flex items-center gap-2">
                    <span>Admin Panel</span>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono px-1 py-0 uppercase bg-accent-solid/10 text-accent-solid border-accent-solid/30"
                    >
                      ADMIN
                    </Badge>
                  </span>
                </div>
                <ChevronRight className="size-4 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            )}

            {user && (
              <Link
                href="/settings"
                onClick={handleNavClick}
                aria-current={pathname === "/settings" ? "page" : undefined}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  pathname === "/settings"
                    ? "bg-accent-solid/10 text-accent-solid font-semibold border border-accent-solid/20 shadow-2xs"
                    : "text-foreground/90 hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span>Settings</span>
                </div>
                <ChevronRight className="size-4 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            )}
          </div>

          {/* Appearance Section */}
          <div className="pt-2 border-t border-border/60">
            <div className="rounded-xl border border-border/80 bg-card p-1 shadow-2xs">
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
                    theme === "light"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="Set light theme"
                >
                  <Sun className="size-3.5" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
                    theme === "dark"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="Set dark theme"
                >
                  <Moon className="size-3.5" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
                    theme === "system"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="Set system theme"
                >
                  <Laptop className="size-3.5" />
                  <span>Auto</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer: User Account Card or Sign-in Prompt */}
        <div className="p-4 border-t border-border/70 bg-card/60 backdrop-blur-sm">
          {user ? (
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/90 p-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Avatar className="size-8.5 border border-border/80 shadow-2xs">
                  <AvatarImage src={user.avatar_url || user.picture} alt={displayName} />
                  <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                    {initials || <UserIcon className="size-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="truncate">
                  <p className="text-xs font-bold text-foreground truncate leading-tight">
                    {displayName}
                  </p>
                  <div className="mt-0.5">
                    <Badge
                      variant="secondary"
                      className="text-[9px] uppercase font-mono tracking-wider font-semibold py-0 px-1.5"
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onOpenChange(false);
                  logout();
                }}
                className="size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm" className="w-full text-xs rounded-lg">
                <Link href="/login" onClick={handleNavClick}>
                  Sign in
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="w-full text-xs rounded-lg bg-accent-solid text-white hover:bg-accent-solid/90 shadow-xs"
              >
                <Link href="/register" onClick={handleNavClick}>
                  Get Started
                </Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
