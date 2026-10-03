"use client";

import { UserX } from "lucide-react";
import { NotFoundView } from "@/components/general/NotFoundView";

export default function AuthorNotFound() {
  return (
    <NotFoundView
      icon={UserX}
      heading="Author profile unavailable"
      description="We couldn't find a writer associated with this account. The profile may have been removed or the link might be mistyped."
      homeLabel="Browse stories"
    />
  );
}
