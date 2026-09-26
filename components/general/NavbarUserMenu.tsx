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

  return (
    <>
      {/* Mobile hamburger */}
      <div className="sm:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
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
        <div className="sm:hidden absolute top-16 left-0 right-0 w-full max-w-xs mx-auto bg-white p-4 rounded-md shadow-lg z-50">
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="text-sm font-medium hover:text-[#ef862b] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium hover:text-[#ef862b] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <p className="text-sm font-medium">{user.username}</p>
                <button
                  onClick={logout}
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={buttonVariants()}>
                  Login
                </Link>
                <Link
                  href="/register"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Desktop auth controls */}
      <div className="hidden sm:flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{user.username}</span>
            <button
              onClick={logout}
              className={buttonVariants({ variant: "secondary" })}
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className={buttonVariants()}>
              Login
            </Link>
            <Link
              href="/register"
              className={buttonVariants({ variant: "secondary" })}
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
