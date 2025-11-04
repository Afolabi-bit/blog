"use client";

import Link from "next/link";
import { buttonVariants } from "../ui/button";
import {
  RegisterLink,
  LoginLink,
  LogoutLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useState } from "react";

export function Navbar() {
  const { getUser } = useKindeBrowserClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const user = getUser();
  return (
    <nav className="py-5 flex items-center justify-between">
      <div className="flex items-center gap-6 md:gap-[50px] lg:gap-[70px]">
        <Link href={"/"}>
          <h1 className="text-3xl font-semibold">
            <span className="text-[#ef862b] font-extrabold">Bloggr</span>
          </h1>
        </Link>

        <div className="hidden sm:flex items-center gap-6">
          <Link
            href={"/"}
            className="text-sm font-medium hover:text-[#ef862b] transition-colors"
          >
            Home
          </Link>
          <Link
            href={"/dashboard"}
            className="text-sm font-medium hover:text-[#ef862b] transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="sm:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </div>

      {
        isMenuOpen && (
          <div className="sm:hidden absolute top-16 left-0 right-0 w-full max-w-xs mx-auto bg-white p-4 rounded-md shadow-lg z-50">
            <div className="flex flex-col gap-4">
              <Link
                href={"/"}
                className="text-sm font-medium hover:text-[#ef862b] transition-colors"
              >
                Home
              </Link>
              <Link
                href={"/dashboard"}
                className="text-sm font-medium hover:text-[#ef862b] transition-colors"
              >
                Dashboard
              </Link>
              {user ? (
                <div className="flex flex-col gap-4">
                  <p>{user.given_name}</p>
                  <LogoutLink className={buttonVariants({ variant: "secondary" })}>
                    Logout
                  </LogoutLink>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <LoginLink className={buttonVariants()}>Login</LoginLink>
                  <RegisterLink className={buttonVariants({ variant: "secondary" })}>
                    Sign up
                  </RegisterLink>
                </div>
              )}
            </div>
          </div>
        )
      }

      <div className="hidden sm:flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <p>{user.given_name}</p>
            <LogoutLink className={buttonVariants({ variant: "secondary" })}>
              Logout
            </LogoutLink>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <LoginLink className={buttonVariants()}>Login</LoginLink>
            <RegisterLink className={buttonVariants({ variant: "secondary" })}>
              Sign up
            </RegisterLink>
          </div>
        )}
      </div>
    </nav>
  );
}
