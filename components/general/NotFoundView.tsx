"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NotFoundViewProps {
  icon: LucideIcon;
  heading: string;
  description: string;
  homeLabel?: string;
}

export function NotFoundView({
  icon: Icon,
  heading,
  description,
  homeLabel = "Browse stories",
}: NotFoundViewProps) {
  const router = useRouter();

  return (
    <main
      id="main-content"
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center sm:py-24"
    >
      {/* Icon badge */}
      <div
        className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-accent-solid/10 ring-1 ring-accent-solid/20
          animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out"
        aria-hidden="true"
      >
        <Icon className="size-7 text-accent-solid" strokeWidth={1.75} />
      </div>

      {/* Descriptive Heading + Details */}
      <div
        className="max-w-md animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out"
        style={{ animationDelay: "60ms", animationFillMode: "both" }}
      >
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-balance">
          {heading}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base text-pretty">
          {description}
        </p>
      </div>

      {/* Helpful recovery actions */}
      <div
        className="mt-8 flex flex-wrap items-center justify-center gap-3
          animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out"
        style={{ animationDelay: "120ms", animationFillMode: "both" }}
      >
        <Button
          asChild
          className="gap-2 bg-accent-solid text-white hover:bg-accent-solid/90 active:scale-[0.96] transition-[scale,background-color] duration-150"
        >
          <Link href="/">
            <Home className="size-4" strokeWidth={1.75} />
            <span>{homeLabel}</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="gap-2 active:scale-[0.96] transition-[scale,background-color] duration-150"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          <span>Go back</span>
        </Button>
      </div>
    </main>
  );
}
