import { useEffect, useState } from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from '@/integrations/supabase/client';
import { ShieldAlert, Loader2 } from 'lucide-react';

import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import NotFound from "./pages/NotFound";

import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverLoads from "./pages/driver/DriverLoads";
import DriverTrucks from "./pages/driver/DriverTrucks"; 
import DriverAccount from "./pages/driver/DriverAccount";
import DriverTasks from "./pages/shipper/ShipperLoads"; 

import ShipperDashboard from "./pages/shipper/ShipperDashboard";
import ShipperPostLoad from "./pages/shipper/ShipperPostLoad";
import ShipperDrivers from "./pages/shipper/ShipperDrivers";
import ShipperHistory from "./pages/shipper/ShipperHistory";
import ShipperTrack from "./pages/shipper/ShipperTrack";
import ShipperAccount from "./pages/shipper/ShipperAccount";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLoads from "./pages/admin/AdminLoads";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => {
  const [systemActive, setSystemActive] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const { data } = await supabase.from('system_status').select('*').single();
      setSystemActive(data?.is_active ?? true);
    };
    checkStatus();
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  if (systemActive === null) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin" /></div>;

  if (!systemActive) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white text-3xl font-black">النظام متوقف مؤقتاً</div>;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner position="top-center" richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/driver/dashboard" element={<DriverDashboard />} />
              <Route path="/driver/loads" element={<DriverLoads />} />
              <Route path="/driver/tasks" element={<DriverTasks />} />
              <Route path="/driver/trucks" element={<DriverTrucks />} /> 
              <Route path="/driver/account" element={<DriverAccount />} />

              <Route path="/shipper/dashboard" element={<ShipperDashboard />} />
              <Route path="/shipper/post" element={<ShipperPostLoad />} />
              <Route path="/shipper/drivers" element={<ShipperDrivers />} />
              <Route path="/shipper/history" element={<ShipperHistory />} />
              <Route path="/shipper/track" element={<ShipperTrack />} />
              <Route path="/shipper/account" element={<ShipperAccount />} />

              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/loads" element={<AdminLoads />} />
              <Route path="/admin/tickets" element={<AdminTickets />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
