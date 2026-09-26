import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
        404 - Page Not Found
      </h2>
      <p className="text-gray-600 mb-6 max-w-md">
        Sorry, we couldn&apos;t find the page or post you were looking for.
      </p>
      <Link href="/" className={buttonVariants()}>
        Return to Home
      </Link>
    </div>
  );
}
