"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  student: "Tanuló",
  lecturer: "Oktató",
  business: "Üzleti",
};

export function RolePreviewBanner({ role }: { role: string }) {
  return (
    <div className="bg-amber-100 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800 px-3 sm:px-4 py-2.5">
      <div className="container mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-200 min-w-0">
          <Eye className="h-4 w-4 shrink-0 mt-0.5 sm:mt-0" />
          <span className="min-w-0">
            <span className="sm:hidden">
              Előnézet — <strong>{ROLE_LABELS[role] || role}</strong>
            </span>
            <span className="hidden sm:inline">
              Előnézeti mód — <strong>{ROLE_LABELS[role] || role}</strong> nézetben.
              A munkamenet továbbra is admin; ez csak UI előnézet.
            </span>
          </span>
        </div>
        <Button size="sm" variant="outline" asChild className="shrink-0 w-full sm:w-auto min-h-10">
          <Link href="/admin">
            <X className="h-4 w-4 mr-1" />
            Előnézet bezárása
          </Link>
        </Button>
      </div>
    </div>
  );
}
