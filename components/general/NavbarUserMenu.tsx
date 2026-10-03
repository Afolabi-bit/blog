"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import type { AuthUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle";
import {
  PenSquare,
  LayoutDashboard,
  Shield,
  Settings,
  LogOut,
  Menu,
  User as UserIcon,
  Sparkles,
} from "lucide-react";

interface NavbarUserMenuProps {
  user: AuthUser | null;
}

export function NavbarUserMenu({ user: initialUser }: NavbarUserMenuProps) {
  const { user: contextUser, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use initialUser during SSR and first render to avoid hydration mismatch.
  // After mount, switch to live context user.
  const user = mounted ? (contextUser ?? initialUser) : initialUser;
  const displayName =
    user?.full_name || user?.username || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const isAuthor = user?.role === "author" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const isReader = user?.role === "reader";

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <ThemeToggle />

      {/* Desktop Auth Section */}
      <div className="hidden sm:flex sm:items-center sm:gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            {isAuthor && (
              <Button asChild size="sm" variant="outline" className="gap-1.5 h-8">
                <Link href="/dashboard">
                  <PenSquare className="size-3.5 text-accent-solid" />
                  <span>Write</span>
                </Link>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative size-9 rounded-full p-0 ring-offset-background transition-transform hover:scale-105 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Open user menu"
                >
                  <Avatar className="size-9 border border-border">
                    <AvatarImage
                      src={user.avatar_url || user.picture}
                      alt={displayName}
                    />
                    <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                      {initials || <UserIcon className="size-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold leading-none text-foreground">
                      {displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                    <div className="pt-1">
                      <Badge
                        variant="secondary"
                        className="text-[10px] uppercase font-mono tracking-wider font-semibold py-0 px-1.5"
                      >
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  {isAuthor && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer gap-2">
                        <LayoutDashboard className="size-4 text-muted-foreground" />
                        <span>Author Studio</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer gap-2">
                        <Shield className="size-4 text-muted-foreground" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {isReader && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/settings/author-request"
                        className="cursor-pointer gap-2"
                      >
                        <Sparkles className="size-4 text-accent-warm" />
                        <span>Become an Author</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer gap-2">
                      <Settings className="size-4 text-muted-foreground" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="bg-accent-solid text-white hover:bg-accent-solid/90">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Drawer Sheet */}
      <div className="sm:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="flex flex-col justify-between w-72">
            <SheetHeader>
              <SheetTitle className="text-left font-serif text-lg font-bold">
                Bloggr
              </SheetTitle>
            </SheetHeader>

            <div className="flex flex-col gap-4 py-6">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium text-foreground hover:text-accent-solid transition-colors"
              >
                Articles
              </Link>

              {user ? (
                <>
                  {isAuthor && (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-base font-medium text-foreground hover:text-accent-solid transition-colors"
                    >
                      <LayoutDashboard className="size-4 text-muted-foreground" />
                      <span>Author Studio</span>
                    </Link>
                  )}

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-base font-medium text-foreground hover:text-accent-solid transition-colors"
                    >
                      <Shield className="size-4 text-muted-foreground" />
                      <span>Admin Panel</span>
                    </Link>
                  )}

                  {isReader && (
                    <Link
                      href="/settings/author-request"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-base font-medium text-foreground hover:text-accent-solid transition-colors"
                    >
                      <Sparkles className="size-4 text-accent-warm" />
                      <span>Become an Author</span>
                    </Link>
                  )}

                  <Link
                    href="/settings"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-base font-medium text-foreground hover:text-accent-solid transition-colors"
                  >
                    <Settings className="size-4 text-muted-foreground" />
                    <span>Settings</span>
                  </Link>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-4">
                  <Button asChild variant="outline" className="w-full justify-center">
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-center bg-accent-solid text-white hover:bg-accent-solid/90">
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {user && (
              <div className="border-t border-border pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <Avatar className="size-8">
                    <AvatarImage src={user.avatar_url || user.picture} alt={displayName} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="truncate">
                    <p className="text-xs font-semibold truncate text-foreground">{displayName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{user.role}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="text-xs text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="size-3.5" />
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
