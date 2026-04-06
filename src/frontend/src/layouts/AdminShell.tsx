import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminSettingsPage from "../pages/admin/AdminSettingsPage";
import InternsPage from "../pages/admin/InternsPage";
import ProjectsPage from "../pages/admin/ProjectsPage";

type AdminPage = "dashboard" | "interns" | "projects" | "settings";

const navItems: { page: AdminPage; label: string; icon: React.ElementType }[] =
  [
    { page: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { page: "interns", label: "Interns", icon: Users },
    { page: "projects", label: "Projects", icon: FolderKanban },
    { page: "settings", label: "Settings", icon: Settings },
  ];

function SidebarContent({
  currentPage,
  onNavigate,
  onClose,
}: {
  currentPage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onClose?: () => void;
}) {
  const { clear } = useInternetIdentity();
  const { profile } = useAuth();

  const handleLogout = () => {
    clear();
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
          <div>
            <p className="font-display font-semibold text-sm text-sidebar-foreground">
              Internship Tracker
            </p>
            <p className="text-xs text-sidebar-foreground/50">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.page}
            type="button"
            onClick={() => {
              onNavigate(item.page);
              onClose?.();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left",
              currentPage === item.page
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {item.label}
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
            onClick={handleLogout}
            className="p-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminShell() {
  const [currentPage, setCurrentPage] = useState<AdminPage>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <AdminDashboard />;
      case "interns":
        return <InternsPage />;
      case "projects":
        return <ProjectsPage />;
      case "settings":
        return <AdminSettingsPage />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col border-r border-border">
        <SidebarContent currentPage={currentPage} onNavigate={setCurrentPage} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-60 border-r-0">
          <SidebarContent
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            onClose={() => setMobileOpen(false)}
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
          <span className="font-display font-semibold text-sm">
            Internship Tracker
          </span>
        </div>

        <main className="flex-1 overflow-y-auto">{renderPage()}</main>
      </div>
    </div>
  );
}
