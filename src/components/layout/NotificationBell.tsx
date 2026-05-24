"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/dolgozat-actions";
import Link from "next/link";
import { useSession } from "next-auth/react";

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  async function load() {
    if (!session?.user) return;
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  if (!session?.user) return null;

  const role = session.user.role;
  const canUse =
    role === "lecturer" || role === "admin" || role === "student";
  if (!canUse) return null;

  function getNotificationLink(n: any): string {
    if (role === "lecturer" || role === "admin") {
      if (n.type === "dolgozat_submitted" && n.submissionId) {
        return `/lecturer/courses/${n.courseId}/dolgozatok/${n.dolgozatId}/grade/${n.submissionId}`;
      }
      return `/lecturer/courses/${n.courseId}/dolgozatok/${n.dolgozatId}`;
    }
    return `/courses/${n.courseId}/dolgozatok/${n.dolgozatId}`;
  }

  async function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) load();
  }

  async function handleClick(n: any) {
    if (!n.readAt) {
      await markNotificationRead(n._id);
      load();
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:text-cta">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-cta text-[10px] font-bold text-navy flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto bg-navy-darker border-navy-lighter text-white"
      >
        <div className="flex items-center justify-between px-2 py-2 border-b border-navy-lighter">
          <span className="text-sm font-medium">Értesítések</span>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs text-cta hover:underline"
              onClick={async () => {
                await markAllNotificationsRead();
                load();
              }}
            >
              Mind olvasott
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">Nincs értesítés</div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n._id}
              asChild
              className={`focus:bg-navy-lighter cursor-pointer ${!n.readAt ? "bg-navy-lighter/30" : ""}`}
            >
              <Link href={getNotificationLink(n)} onClick={() => handleClick(n)}>
                <div className="flex flex-col gap-0.5 py-1">
                  <span className="text-sm">{n.message}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(n.createdAt).toLocaleString("hu-HU")}
                  </span>
                </div>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
