import { useEffect, useState } from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// الصفحات العامة
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import NotFound from "./pages/NotFound";

// صفحات السائق
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverLoads from "./pages/driver/DriverLoads";
import DriverTrucks from "./pages/driver/DriverTrucks"; 
import DriverAccount from "./pages/driver/DriverAccount";
import DriverTasks from "./pages/driver/DriverTasks"; 

// صفحات التاجر
import ShipperDashboard from "./pages/shipper/ShipperDashboard";
import ShipperPostLoad from "./pages/shipper/ShipperPostLoad";
import ShipperLoads from "./pages/shipper/ShipperLoads"; 
import ShipperDrivers from "./pages/shipper/ShipperDrivers";
import ShipperHistory from "./pages/shipper/ShipperHistory";
import ShipperTrack from "./pages/shipper/ShipperTrack";
import ShipperAccount from "./pages/shipper/ShipperAccount";

// صفحات الإدارة
import AdminDashboard from "./pages/admin/AdminDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [systemActive, setSystemActive] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true; // حماية لمنع الـ AbortError عند إغلاق المكون

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('system_status')
          .select('is_active')
          .maybeSingle();

        if (isMounted) {
          // لو الجدول مش موجود أو حصل خطأ بنخلي السيستم شغال افتراضياً
          setSystemActive(data?.is_active ?? true);
        }
      } catch (e) { 
        if (isMounted) setSystemActive(true); 
      }
    };

    checkStatus();
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';

    return () => {
      isMounted = false; // تنظيف عند الخروج لمنع أي Abort Signal
    };
  }, []);

  if (systemActive === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0c10]">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

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
              {/* مسارات السائق */}
              <Route path="/driver/dashboard" element={<DriverDashboard />} />
              <Route path="/driver/loads" element={<DriverLoads />} />
              <Route path="/driver/tasks" element={<DriverTasks />} /> 
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
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
