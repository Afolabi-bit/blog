"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { ThemeToggle } from "./ThemeToggle";
import { NavbarMobileDrawer } from "./NavbarMobileDrawer";
import {
  PenSquare,
  LayoutDashboard,
  Shield,
  Settings,
  LogOut,
  Menu,
  User as UserIcon,
  PenTool,
} from "lucide-react";

interface NavbarUserMenuProps {
  user: AuthUser | null;
}

export function NavbarUserMenu({ user: initialUser }: NavbarUserMenuProps) {
  const { user: contextUser, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="flex items-center gap-2 sm:gap-2.5">
      {/* Prominent Desktop "Write" Action for Creators */}
      {user && isAuthor && (
        <Button
          asChild
          size="sm"
          className="hidden sm:inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-full bg-accent-solid text-white hover:bg-accent-solid/90 shadow-2xs font-medium text-xs transition-transform active:scale-95"
        >
          <Link href="/dashboard/create">
            <PenSquare className="size-3.5" />
            <span>Write</span>
          </Link>
        </Button>
      )}

      {/* Reader Callout if on desktop */}
      {user && isReader && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="hidden md:inline-flex items-center gap-1.5 h-8.5 px-3 rounded-full border-border/80 text-muted-foreground hover:text-foreground text-xs"
        >
          <Link href="/settings/author-request">
            <PenTool className="size-3.5 text-accent-warm" />
            <span>Become an Author</span>
          </Link>
        </Button>
      )}

      {/* Theme Toggle (Desktop & Mobile) */}
      <ThemeToggle />

      {/* Desktop Authentication Island */}
      <div className="hidden sm:flex sm:items-center sm:gap-2.5">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative size-9 rounded-full p-0 ring-offset-background transition-transform hover:scale-105 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent-solid/40"
                aria-label="Open user menu"
              >
                <Avatar className="size-8.5 border border-border/80 shadow-2xs">
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

            <DropdownMenuContent className="w-64 p-1.5 rounded-xl border-border/80 shadow-lg" align="end" forceMount>
              {/* User Identity Card */}
              <DropdownMenuLabel className="font-normal p-2.5">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9 border border-border/80">
                    <AvatarImage src={user.avatar_url || user.picture} alt={displayName} />
                    <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <p className="text-sm font-bold leading-tight text-foreground truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate leading-tight">
                      {user.email}
                    </p>
                    <div className="pt-1">
                      <Badge
                        variant="secondary"
                        className="text-[9px] uppercase font-mono tracking-wider font-semibold py-0 px-1.5 bg-muted text-muted-foreground"
                      >
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Creator Shortcuts */}
              <DropdownMenuGroup>
                {isAuthor && (
                  <>
                    <DropdownMenuItem asChild className="rounded-lg p-2 cursor-pointer gap-2.5">
                      <Link href="/dashboard">
                        <LayoutDashboard className="size-4 text-muted-foreground" />
                        <span>Author Studio</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="rounded-lg p-2 cursor-pointer gap-2.5">
                      <Link href="/dashboard/create">
                        <PenSquare className="size-4 text-accent-solid" />
                        <span className="flex-1">Write New Story</span>
                        <Badge
                          variant="secondary"
                          className="text-[9px] font-mono px-1.5 py-0 bg-accent-solid/10 text-accent-solid"
                        >
                          NEW
                        </Badge>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {isAdmin && (
                  <DropdownMenuItem asChild className="rounded-lg p-2 cursor-pointer gap-2.5">
                    <Link href="/admin">
                      <Shield className="size-4 text-muted-foreground" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {isReader && (
                  <DropdownMenuItem asChild className="rounded-lg p-2 cursor-pointer gap-2.5">
                    <Link href="/settings/author-request">
                      <PenTool className="size-4 text-accent-warm" />
                      <span>Become an Author</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild className="rounded-lg p-2 cursor-pointer gap-2.5">
                  <Link href="/settings">
                    <Settings className="size-4 text-muted-foreground" />
                    <span>Settings & Profile</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="rounded-lg p-2 cursor-pointer gap-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="size-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-8.5 text-xs font-medium">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="h-8.5 px-3.5 rounded-full text-xs font-medium bg-accent-solid text-white hover:bg-accent-solid/90 shadow-2xs transition-transform active:scale-95"
            >
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Drawer Trigger (Opens Redesigned Sidebar) */}
      <div className="sm:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="size-9 rounded-lg hover:bg-muted"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>

        <NavbarMobileDrawer
          open={mobileOpen}
          onOpenChange={setMobileOpen}
          user={user}
          logout={logout}
          pathname={pathname || "/"}
        />
      </div>
    </div>
  );
}
