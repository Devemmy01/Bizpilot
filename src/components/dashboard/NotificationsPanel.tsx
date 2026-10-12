"use client";

import { AlertTriangle, Bell, CheckCheck, Mail, PartyPopper } from "lucide-react";
import { Modal } from "@/components/dashboard/ui/Modal";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import type { NotificationItem, NotificationType } from "@/types/business";

const typeIcon: Record<NotificationType, typeof Bell> = {
  low_stock: AlertTriangle,
  report_sent: Mail,
  welcome: PartyPopper,
};

const typeTone: Record<NotificationType, string> = {
  low_stock: "bg-red-50 text-red-500",
  report_sent: "bg-blue-50 text-ocean",
  welcome: "bg-emerald-50 text-growth",
};

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

type NotificationsPanelProps = {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
};

export function NotificationsPanel({
  open,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
}: NotificationsPanelProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="text-base font-black text-ink">Notifications</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[60vh] overflow-y-auto px-3 py-3">
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications yet." subtitle="Alerts about stock, reports, and account activity will show up here." />
        ) : (
          <div className="grid gap-1">
            {notifications.map((n) => {
              const Icon = typeIcon[n.type];
              return (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => !n.read && onMarkRead(n._id!)}
                  className={`flex items-start gap-3 rounded-xl p-3 text-left transition ${
                    n.read ? "hover:bg-slate-50" : "bg-blue-50/50 hover:bg-blue-50"
                  }`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${typeTone[n.type]}`}>
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-ink">{n.title}</p>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-ocean" />}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{n.body}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
