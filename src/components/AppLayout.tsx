import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Pizza,
  ShoppingCart,
  ChefHat,
  BarChart3,
  Settings,
  LogOut,
  Menu as MenuIcon,
  ClipboardList,
  Loader2,
  Users,
  Sparkles,
  Building2,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";
import BranchSwitcher from "@/components/BranchSwitcher";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: "Orders", path: "/orders", icon: <ShoppingCart className="h-5 w-5" />, roles: ["super_admin", "admin", "cashier"] },
  { label: "Kitchen", path: "/kitchen", icon: <ChefHat className="h-5 w-5" />, roles: ["super_admin", "admin", "chef"] },
  { label: "Menu", path: "/menu", icon: <Pizza className="h-5 w-5" />, roles: ["super_admin", "admin"] },
  { label: "History", path: "/history", icon: <ClipboardList className="h-5 w-5" />, roles: ["super_admin", "admin", "cashier"] },
  { label: "Analytics", path: "/analytics", icon: <BarChart3 className="h-5 w-5" />, roles: ["super_admin", "admin"] },
  { label: "Users", path: "/users", icon: <Users className="h-5 w-5" />, roles: ["super_admin", "admin"] },
  { label: "Branches", path: "/branches", icon: <Building2 className="h-5 w-5" />, roles: ["super_admin"] },
  { label: "Settings", path: "/settings", icon: <Settings className="h-5 w-5" />, roles: ["super_admin", "admin"] },
  { label: "AI Assistant", path: "/ai", icon: <Sparkles className="h-5 w-5" />, roles: ["super_admin", "admin"] },
];

function SidebarNav({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const location = useLocation();
  const { signOut } = useAuth();
  const filtered = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Pizza className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-bold text-sidebar-foreground">LiveSync POS</h1>
          <p className="text-xs text-sidebar-foreground/60 capitalize">{role === "super_admin" ? "Super Admin" : role}</p>
        </div>
      </div>

      {/* Branch Switcher */}
      <BranchSwitcher />

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-auto">
        {filtered.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-3 py-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { session, role, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  useNotifications();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">No role assigned. Contact admin.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-shrink-0">
        <SidebarNav role={role} />
      </aside>

      {/* Mobile header + sheet */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b px-4 py-3 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarNav role={role} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Pizza className="h-5 w-5 text-primary" />
            <span className="font-bold">LiveSync POS</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
