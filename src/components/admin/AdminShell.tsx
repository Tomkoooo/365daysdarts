"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Settings,
  Eye,
  Menu,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const PREVIEW_ITEMS = [
  { href: "/admin/preview/student", label: "Student view" },
  { href: "/admin/preview/lecturer", label: "Lecturer view" },
  { href: "/admin/preview/business", label: "Business view" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}

      <div className="mt-6 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Preview as role
      </div>
      {PREVIEW_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            pathname.startsWith(item.href)
              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Eye className="h-4 w-4 shrink-0" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AdminShell({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/10 flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-background">
        <div className="p-4 border-b">
          <Link href="/admin" className="font-semibold text-lg">
            Admin
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Platform management</p>
        </div>
        <div className="flex-1 p-3 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="p-3 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden shrink-0">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 flex flex-col">
                  <div className="p-4 border-b font-semibold">Admin</div>
                  <div className="flex-1 p-3 overflow-y-auto">
                    <NavLinks onNavigate={() => setOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
              <h1 className="text-xl font-bold truncate">{title}</h1>
            </div>
            {actions && (
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">{actions}</div>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
