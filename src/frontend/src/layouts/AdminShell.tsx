import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart2,
  CalendarClock,
  CalendarDays,
  FileText,
  Flag,
  FolderKanban,
  GanttChartSquare,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Users,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import NotificationCenter from "../components/NotificationCenter";
import ThemeToggle from "../components/ThemeToggle";
import { useActor } from "../hooks/useActor";
import { useAuth } from "../hooks/useAuth";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import MessagesPage from "../pages/MessagesPage";
import AdminActivityPage from "../pages/admin/AdminActivityPage";
import AdminCodeMonitorPage from "../pages/admin/AdminCodeMonitorPage";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminMilestonesPage from "../pages/admin/AdminMilestonesPage";
import AdminSettingsPage from "../pages/admin/AdminSettingsPage";
import AnalyticsPage from "../pages/admin/AnalyticsPage";
import AnnouncementsPage from "../pages/admin/AnnouncementsPage";
import CalendarPage from "../pages/admin/CalendarPage";
import ExtensionRequestsPage from "../pages/admin/ExtensionRequestsPage";
import InternsPage from "../pages/admin/InternsPage";
import ProjectsPage from "../pages/admin/ProjectsPage";
import ReportsPage from "../pages/admin/ReportsPage";
import SearchPage from "../pages/admin/SearchPage";
import TimelinePage from "../pages/admin/TimelinePage";

type AdminPage =
  | "dashboard"
  | "interns"
  | "projects"
  | "activity"
  | "messages"
  | "settings"
  | "analytics"
  | "milestones"
  | "reports"
  | "extensions"
  | "calendar"
  | "timeline"
  | "code-monitor"
  | "announcements"
  | "search";

const navItems: { page: AdminPage; label: string; icon: React.ElementType }[] =
  [
    { page: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { page: "interns", label: "Interns", icon: Users },
    { page: "projects", label: "Projects", icon: FolderKanban },
    { page: "activity", label: "Activity", icon: Activity },
    { page: "analytics", label: "Analytics", icon: BarChart2 },
    { page: "milestones", label: "Milestones", icon: Flag },
    { page: "reports", label: "Reports", icon: FileText },
    { page: "extensions", label: "Extensions", icon: CalendarClock },
    { page: "calendar", label: "Calendar", icon: CalendarDays },
    { page: "timeline", label: "Timeline", icon: GanttChartSquare },
    { page: "code-monitor", label: "Code Monitor", icon: GitBranch },
    { page: "announcements", label: "Announcements", icon: Megaphone },
    { page: "messages", label: "Messages", icon: MessageSquare },
    { page: "search", label: "Search", icon: Search },
    { page: "settings", label: "Settings", icon: Settings },
  ];

function SidebarContent({
  currentPage,
  onNavigate,
  onClose,
  unreadCount,
}: {
  currentPage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onClose?: () => void;
  unreadCount: number;
}) {
  const { clear } = useInternetIdentity();
  const { profile } = useAuth();
  const { actor } = useActor();

  const handleNavigate = (page: AdminPage) => {
    onNavigate(page);
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <span className="text-sidebar-primary-foreground text-sm font-bold">
              IT
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-sm text-sidebar-foreground">
              Internship Tracker
            </p>
            <p className="text-xs text-sidebar-foreground/50">Admin Panel</p>
          </div>
          <ThemeToggle />
          <NotificationCenter
            actor={actor}
            onNavigate={(page) => handleNavigate(page as AdminPage)}
          />
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.page}
            type="button"
            onClick={() => handleNavigate(item.page)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left",
              currentPage === item.page
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            data-ocid={`admin.nav.${item.page}.link`}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.page === "messages" && unreadCount > 0 && (
              <Badge className="h-4 min-w-4 px-1 text-[10px] bg-destructive text-destructive-foreground">
                {unreadCount}
              </Badge>
            )}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {profile?.name?.charAt(0)?.toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile?.name || "Admin"}
            </p>
            <p className="text-xs text-sidebar-foreground/50">Administrator</p>
          </div>
          <button
            type="button"
            onClick={() => {
              clear();
              onClose?.();
            }}
            className="p-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            title="Sign out"
            data-ocid="admin.nav.logout.button"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminShell() {
  const { actor } = useActor();
  const [currentPage, setCurrentPage] = useState<AdminPage>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!actor) return;
    try {
      const count = await actor.getUnreadCount();
      setUnreadCount(Number(count));
    } catch {
      // silent
    }
  }, [actor]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <AdminDashboard />;
      case "interns":
        return <InternsPage />;
      case "projects":
        return <ProjectsPage />;
      case "activity":
        return <AdminActivityPage />;
      case "analytics":
        return <AnalyticsPage />;
      case "milestones":
        return <AdminMilestonesPage />;
      case "reports":
        return <ReportsPage />;
      case "extensions":
        return <ExtensionRequestsPage />;
      case "calendar":
        return <CalendarPage />;
      case "timeline":
        return <TimelinePage />;
      case "code-monitor":
        return <AdminCodeMonitorPage />;
      case "announcements":
        return <AnnouncementsPage />;
      case "search":
        return <SearchPage />;
      case "messages":
        return <MessagesPage />;
      case "settings":
        return <AdminSettingsPage />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col border-r border-border">
        <SidebarContent
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          unreadCount={unreadCount}
        />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-60 border-r-0">
          <SidebarContent
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            onClose={() => setMobileOpen(false)}
            unreadCount={unreadCount}
          />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display font-semibold text-sm flex-1">
            Internship Tracker
          </span>
          <ThemeToggle />
        </div>

        <main className="flex-1 overflow-y-auto">{renderPage()}</main>
      </div>
    </div>
  );
}
