import { useEffect, useState, lazy, Suspense } from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const WelcomePage = lazy(() => import("./pages/WelcomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const DriverDashboard = lazy(() => import("./pages/driver/DriverDashboard"));
const DriverLoads = lazy(() => import("./pages/driver/DriverLoads"));
const DriverTasks = lazy(() => import("./pages/driver/DriverTasks"));
const DriverTrucks = lazy(() => import("./pages/driver/DriverTrucks"));
const DriverAccount = lazy(() => import("./pages/driver/DriverAccount"));
const ShipperDashboard = lazy(() => import("./pages/shipper/ShipperDashboard"));
const ShipperPostLoad = lazy(() => import("./pages/shipper/ShipperPostLoad"));
const ShipperDrivers = lazy(() => import("./pages/shipper/ShipperDrivers"));
const ShipperHistory = lazy(() => import("./pages/shipper/ShipperHistory"));
const ShipperTrack = lazy(() => import("./pages/shipper/ShipperTrack"));
const ShipperAccount = lazy(() => import("./pages/shipper/ShipperAccount"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {
  const [systemActive, setSystemActive] = useState<boolean>(() => localStorage.getItem('sas_sys_status') !== 'false');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data } = await supabase.from('system_status').select('is_active').single();
        if (data) {
          setSystemActive(data.is_active);
          localStorage.setItem('sas_sys_status', String(data.is_active));
        }
      } catch (e) {}
    };
    checkStatus();
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  if (!systemActive) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0a0c10] text-white text-center p-6">
      <h1 className="text-4xl font-black mb-4">النظام متوقف</h1>
      <p className="text-slate-400">نحن نجري بعض التحسينات، سنعود قريباً.</p>
    </div>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner position="top-center" richColors />
        <BrowserRouter>
          <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#0a0c10]"><Loader2 className="animate-spin text-blue-600" size={40} /></div>}>
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
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
