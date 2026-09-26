"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "../ui/button";
import { useAuth } from "./AuthProvider";
import type { AuthUser } from "@/lib/types";

interface NavbarUserMenuProps {
  user: AuthUser | null;
}

export function NavbarUserMenu({ user: initialUser }: NavbarUserMenuProps) {
  const { user: contextUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Prefer context (updated after login) over the SSR-passed prop
  const user = contextUser ?? initialUser;
  const displayName =
    user?.full_name || user?.username || user?.email?.split("@")[0] || "User";

  return (
    <>
      {/* Mobile hamburger */}
      <div className="sm:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none p-1"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                isMenuOpen
                  ? "M6 18L18 6M6 6l12 12"
                  : "M4 6h16M4 12h16M4 18h16"
              }
            />
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {isMenuOpen && (
        <div className="sm:hidden absolute top-16 left-0 right-0 w-full max-w-xs mx-auto bg-white p-4 rounded-xl shadow-xl border border-gray-100 z-50">
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="text-sm font-medium hover:text-[#ef862b] transition-colors py-1"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            {user ? (
              <>
                {(user.role === "author" || user.role === "admin") && (
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium hover:text-[#ef862b] transition-colors py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Author Studio
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                {user.role === "reader" && (
                  <Link
                    href="/settings/author-request"
                    className="text-sm font-medium text-[#ef862b] transition-colors py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Become an Author
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="text-sm font-medium hover:text-[#ef862b] transition-colors py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Settings
                </Link>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">
                    {displayName}
                  </span>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                    }}
                    className="text-xs text-red-600 font-semibold"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={buttonVariants({ size: "sm" })}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Desktop auth controls */}
      <div className="hidden sm:flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                Admin Panel
              </Link>
            )}
            {(user.role === "author" || user.role === "admin") && (
              <Link
                href="/dashboard"
                className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-[#ef862b] border border-orange-200 hover:bg-orange-100 transition-colors"
              >
                Studio
              </Link>
            )}
            {user.role === "reader" && (
              <Link
                href="/settings/author-request"
                className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Become Author
              </Link>
            )}

            <Link
              href="/settings"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              title="Account Settings"
            >
              {displayName}
            </Link>

            <button
              onClick={logout}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Login
            </Link>
            <Link
              href="/register"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
