import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import Orders from "./pages/Orders";
import Kitchen from "./pages/Kitchen";
import MenuManagement from "./pages/MenuManagement";
import OrderHistory from "./pages/OrderHistory";
import Analytics from "./pages/Analytics";
import UserManagement from "./pages/UserManagement";
import BusinessSettings from "./pages/BusinessSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RoleRedirect() {
  const { role } = useAuth();
  if (role === "chef") return <Navigate to="/kitchen" replace />;
  return <Navigate to="/orders" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<RoleRedirect />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/kitchen" element={<Kitchen />} />
              <Route path="/menu" element={<MenuManagement />} />
              <Route path="/history" element={<OrderHistory />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/settings" element={<BusinessSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
