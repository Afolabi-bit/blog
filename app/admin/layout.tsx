import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Console — Noterverse",
  description: "Moderation console for author requests and platform articles",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSession();

  // Route guard: strictly Admin access
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="py-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-accent-solid text-white">
              <Shield className="size-4" />
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Admin Moderation Console
            </h1>
            <Badge
              variant="outline"
              className="font-mono text-[10px] uppercase tracking-wider font-semibold py-0.5 px-2 bg-accent-solid/10 text-accent-solid border-accent-solid/30"
            >
              System Admin
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Review author promotion applications and moderate system-wide articles.
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
