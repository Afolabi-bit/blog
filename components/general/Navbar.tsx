import Link from "next/link";
import type { AuthUser } from "@/lib/types";
import { NavbarUserMenu } from "./NavbarUserMenu";

interface NavbarProps {
  user: AuthUser | null;
}

// Server Component — no "use client" needed
export function Navbar({ user }: NavbarProps) {
  return (
    <nav className="py-5 flex items-center justify-between">
      <div className="flex items-center gap-6 md:gap-[50px] lg:gap-[70px]">
        <Link href="/">
          <h1 className="text-3xl font-semibold">
            <span className="text-[#ef862b] font-extrabold">Bloggr</span>
          </h1>
        </Link>

        <div className="hidden sm:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium hover:text-[#ef862b] transition-colors"
          >
            Home
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="text-sm font-medium hover:text-[#ef862b] transition-colors"
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Client island — handles logout + mobile menu state */}
      <NavbarUserMenu user={user} />
    </nav>
  );
}
