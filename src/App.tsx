import { useEffect, useState } from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// استيراد الصفحات العامة
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import NotFound from "./pages/NotFound";

// استيراد صفحات السائق
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverLoads from "./pages/driver/DriverLoads";
import DriverTrucks from "./pages/driver/DriverTrucks"; 
import DriverAccount from "./pages/driver/DriverAccount";

// استيراد صفحات التاجر (Shipper)
import ShipperDashboard from "./pages/shipper/ShipperDashboard";
import ShipperPostLoad from "./pages/shipper/ShipperPostLoad";
import ShipperLoads from "./pages/shipper/ShipperLoads"; // تم تغيير الاسم هنا للوضوح
import ShipperDrivers from "./pages/shipper/ShipperDrivers";
import ShipperHistory from "./pages/shipper/ShipperHistory";
import ShipperTrack from "./pages/shipper/ShipperTrack";
import ShipperAccount from "./pages/shipper/ShipperAccount";

// استيراد صفحات الإدارة (تأكد أن هذه الملفات موجودة فعلياً في مشروعك)
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLoads from "./pages/admin/AdminLoads";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => {
  const [systemActive, setSystemActive] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      try {
        const { data } = await supabase.from('system_status').select('is_active').single();
        if (mounted) setSystemActive(data?.is_active ?? true);
      } catch (e) {
        if (mounted) setSystemActive(true);
      }
    };
    checkStatus();
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
    return () => { mounted = false; };
  }, []);

  if (systemActive === null) return <div className="h-screen flex items-center justify-center bg-[#0a0c10]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
  if (!systemActive) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white text-3xl font-black">النظام متوقف مؤقتاً</div>;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner position="top-center" richColors />
        <BrowserRouter>
          <Routes>
            {/* المسارات العامة */}
            <Route path="/" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route element={<ProtectedRoute />}>
              {/* مسارات السائق */}
              <Route path="/driver/dashboard" element={<DriverDashboard />} />
              <Route path="/driver/loads" element={<DriverLoads />} />
              <Route path="/driver/trucks" element={<DriverTrucks />} /> 
              <Route path="/driver/account" element={<DriverAccount />} />

              {/* مسارات التاجر */}
              <Route path="/shipper/dashboard" element={<ShipperDashboard />} />
              <Route path="/shipper/post" element={<ShipperPostLoad />} />
              <Route path="/shipper/loads" element={<ShipperLoads />} /> 
              <Route path="/shipper/drivers" element={<ShipperDrivers />} />
              <Route path="/shipper/history" element={<ShipperHistory />} />
              <Route path="/shipper/track" element={<ShipperTrack />} />
              <Route path="/shipper/account" element={<ShipperAccount />} />

              {/* مسارات الإدارة */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/loads" element={<AdminLoads />} />
              <Route path="/admin/tickets" element={<AdminTickets />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            {/* صفحة 404 لأي مسار غير معروف */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
