"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Popover from "@radix-ui/react-popover";
import { Bell, Check } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import { formatNumber, toPersianDigits } from "@/lib/format-number";

const POLL_MS = 45000;

type Notification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

function timeAgoFa(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "همین الان";
  if (minutes < 60) return toPersianDigits(`${minutes} دقیقه پیش`);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return toPersianDigits(`${hours} ساعت پیش`);
  const days = Math.floor(hours / 24);
  return toPersianDigits(`${days} روز پیش`);
}

// notification=null (still polling for the first time) falls back to a
// Skeleton per field, so the placeholder row is always this row's real shape.
function NotificationRow({
  notification,
  onRead,
  onNavigate,
}: {
  notification: Notification | null;
  onRead: (id: string) => void;
  onNavigate: () => void;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm ${notification?.read ? "text-foreground/70" : "font-bold text-foreground"}`}>
          {notification?.title || <Skeleton width="70%" />}
        </p>
        {notification && !notification.read && <span className="mt-1 size-2 shrink-0 rounded-full bg-accent-500" />}
      </div>
      <p className="mt-1 line-clamp-2 text-xs text-foreground/50">{notification?.message || <Skeleton width="90%" />}</p>
      <p className="mt-1.5 text-[11px] text-foreground/35">
        {notification ? timeAgoFa(notification.createdAt) : <Skeleton width={64} />}
      </p>
    </>
  );

  if (!notification) {
    return <div className="px-4 py-3">{content}</div>;
  }

  return notification.link ? (
    <Link
      href={notification.link}
      onClick={() => {
        if (!notification.read) onRead(notification.id);
        onNavigate();
      }}
      className="block px-4 py-3 hover:bg-foreground/5"
    >
      {content}
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => !notification.read && onRead(notification.id)}
      className="block w-full px-4 py-3 text-right hover:bg-foreground/5"
    >
      {content}
    </button>
  );
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const res = await fetch("/api/account/notifications").catch(() => null);
      if (cancelled || !res?.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    };

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function markRead(id: string) {
    setNotifications((prev) => prev && prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await fetch("/api/account/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  async function markAllRead() {
    setNotifications((prev) => prev && prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await fetch("/api/account/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
  }

  const rows = notifications ?? Array.from({ length: 3 }, () => null);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="اعلان‌ها"
          className="relative flex size-10 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 text-foreground/70 transition-colors hover:border-accent-500/30 hover:text-foreground"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -left-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "۹+" : formatNumber(unreadCount)}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
            <p className="text-sm font-bold">اعلان‌ها</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-accent-400 hover:text-accent-300"
              >
                <Check className="size-3.5" />
                علامت‌گذاری همه به‌عنوان خوانده‌شده
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto overscroll-contain">
            {notifications?.length === 0 ? (
              <p className="p-6 text-center text-sm text-foreground/50">اعلانی وجود ندارد.</p>
            ) : (
              <div className="divide-y divide-foreground/5">
                {rows.map((n, i) => (
                  <NotificationRow key={n?.id ?? i} notification={n} onRead={markRead} onNavigate={() => setOpen(false)} />
                ))}
              </div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
