import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BranchProvider } from "@/contexts/BranchContext";

import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import Orders from "./pages/Orders";
import Kitchen from "./pages/Kitchen";
import MenuManagement from "./pages/MenuManagement";
import OrderHistory from "./pages/OrderHistory";
import Analytics from "./pages/Analytics";
import UserManagement from "./pages/UserManagement";
import BusinessSettings from "./pages/BusinessSettings";
import BranchManagement from "./pages/BranchManagement";
import AIChat from "./pages/AIChat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const roleAccess: Record<string, string[]> = {
  super_admin: ["/orders", "/kitchen", "/menu", "/history", "/analytics", "/users", "/branches", "/settings", "/ai"],
  admin: ["/orders", "/kitchen", "/menu", "/history", "/analytics", "/users", "/settings", "/ai"],
  cashier: ["/orders", "/kitchen", "/history"],
  chef: ["/kitchen"],
};

function RoleRedirect() {
  const { role } = useAuth();
  if (role === "chef") return <Navigate to="/kitchen" replace />;
  return <Navigate to="/orders" replace />;
}

function RoleGuard({ path, children }: { path: string; children: React.ReactNode }) {
  const { role } = useAuth();
  if (!role) return null;
  const allowed = roleAccess[role] ?? [];
  if (!allowed.includes(path)) {
    return <RoleRedirect />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BranchProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<AppLayout />}>
                <Route path="/" element={<RoleRedirect />} />
                <Route path="/orders" element={<RoleGuard path="/orders"><Orders /></RoleGuard>} />
                <Route path="/kitchen" element={<RoleGuard path="/kitchen"><Kitchen /></RoleGuard>} />
                <Route path="/menu" element={<RoleGuard path="/menu"><MenuManagement /></RoleGuard>} />
                <Route path="/history" element={<RoleGuard path="/history"><OrderHistory /></RoleGuard>} />
                <Route path="/analytics" element={<RoleGuard path="/analytics"><Analytics /></RoleGuard>} />
                <Route path="/users" element={<RoleGuard path="/users"><UserManagement /></RoleGuard>} />
                <Route path="/settings" element={<RoleGuard path="/settings"><BusinessSettings /></RoleGuard>} />
                <Route path="/branches" element={<RoleGuard path="/branches"><BranchManagement /></RoleGuard>} />
                <Route path="/ai" element={<RoleGuard path="/ai"><AIChat /></RoleGuard>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BranchProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
