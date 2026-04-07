import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import {
  Bell,
  CheckCircle,
  FolderKanban,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { View__4, backendInterface } from "../backend";

type NotificationView = View__4;

interface NotificationBellProps {
  actor: backendInterface | null;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "newApprovalRequest":
      return <UserPlus className="h-4 w-4 text-warning" />;
    case "projectAssigned":
      return <FolderKanban className="h-4 w-4 text-accent" />;
    case "milestoneUpdate":
      return <CheckCircle className="h-4 w-4 text-success" />;
    case "messageReceived":
      return <MessageSquare className="h-4 w-4 text-primary" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

function getRelativeTime(timestampNs: bigint): string {
  const ms = Number(timestampNs) / 1_000_000;
  const now = Date.now();
  const diffMs = now - ms;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHour > 0) return `${diffHour}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return "Just now";
}

export default function NotificationBell({ actor }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!actor) return;
    try {
      const count = await actor.getUnreadNotificationCount();
      setUnreadCount(Number(count));
    } catch {
      // silent
    }
  }, [actor]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const fetchNotifications = useCallback(async () => {
    if (!actor) return;
    setLoadingNotifs(true);
    try {
      const data = await actor.getNotificationsForCaller();
      const sorted = [...data].sort(
        (a, b) => Number(b.timestamp) - Number(a.timestamp),
      );
      setNotifications(sorted);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoadingNotifs(false);
    }
  }, [actor]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkRead = async (notifId: bigint) => {
    if (!actor) return;
    try {
      await actor.markNotificationRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    if (!actor) return;
    setMarkingAll(true);
    try {
      await actor.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          data-ocid="notification.open_modal_button"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[9px] bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
              data-ocid="notification.toast"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="start"
        side="right"
        data-ocid="notification.popover"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="font-display font-semibold text-sm">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              data-ocid="notification.confirm_button"
            >
              {markingAll ? "Marking..." : "Mark all read"}
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {loadingNotifs ? (
            <div
              className="p-4 space-y-3"
              data-ocid="notification.loading_state"
            >
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10 px-4 text-center"
              data-ocid="notification.empty_state"
            >
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notif, idx) => (
                <button
                  key={String(notif.id)}
                  type="button"
                  onClick={() => {
                    if (!notif.isRead) handleMarkRead(notif.id);
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-border/50 last:border-0 hover:bg-muted/50 ${
                    notif.isRead ? "opacity-60" : ""
                  }`}
                  data-ocid={`notification.item.${idx + 1}`}
                >
                  <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    {getNotificationIcon(notif.notificationType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {getRelativeTime(notif.timestamp)}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="px-4 py-2 text-center">
              <p className="text-xs text-muted-foreground">
                {notifications.length} notification
                {notifications.length !== 1 ? "s" : ""} total
              </p>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
