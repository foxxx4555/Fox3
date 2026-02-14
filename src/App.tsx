import { useEffect, useState } from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from '@/integrations/supabase/client';
import { ShieldAlert, Loader2 } from 'lucide-react';

// استيراد الصفحات
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import NotFound from "./pages/NotFound";
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverLoads from "./pages/driver/DriverLoads";
import DriverTasks from "./pages/shipper/ShipperLoads";
import ShipperDashboard from "./pages/shipper/ShipperDashboard";
import ShipperHistory from "./pages/shipper/ShipperHistory";
import ShipperDrivers from "./pages/shipper/ShipperDrivers";
import ShipperTrack from "./pages/shipper/ShipperTrack";

const queryClient = new QueryClient();

const App = () => {
  const [systemActive, setSystemActive] = useState<boolean | null>(null);
  const [lockMessage, setLockMessage] = useState('');

  // 🔒 نظام الرقابة والتحكم عن بعد
  useEffect(() => {
    const checkStatus = async () => {
      const { data } = await supabase.from('system_status').select('*').single();
      if (data) {
        setSystemActive(data.is_active);
        setLockMessage(data.message);
      }
    };
    checkStatus();

    // بث مباشر لحالة القفل (لو غيرتها وإنت قاعد في بيتك السيستم يقفل عنده في ثانية)
    const channel = supabase.channel('system-lock')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_status' }, (payload) => {
        setSystemActive(payload.new.is_active);
        setLockMessage(payload.new.message);
      })
      .subscribe();

    document.documentElement.dir = 'rtl';
    return () => { supabase.removeChannel(channel); };
  }, []);

  // شاشة التحميل الأولية
  if (systemActive === null) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    );
  }

  // 🚫 إذا قمت بإغلاق السيستم من عندك تظهر هذه الشاشة فقط
  if (!systemActive) {
    return (
      <div className="h-screen w-full bg-[#0a0c10] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500 mb-8 animate-pulse border-2 border-rose-500/50">
          <ShieldAlert size={50} />
        </div>
        <h1 className="text-4xl font-black text-white mb-4">النظام متوقف</h1>
        <p className="text-slate-400 text-xl max-w-md font-bold leading-relaxed">{lockMessage}</p>
        <div className="mt-12 text-[10px] text-white/10 uppercase tracking-widest font-black">
          Access Denied - Security Protocol 77
        </div>
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
              <Route path="/driver/dashboard" element={<DriverDashboard />} />
              <Route path="/driver/loads" element={<DriverLoads />} />
              <Route path="/driver/tasks" element={<DriverTasks />} />
              <Route path="/shipper/dashboard" element={<ShipperDashboard />} />
              <Route path="/shipper/history" element={<ShipperHistory />} />
              <Route path="/shipper/drivers" element={<ShipperDrivers />} />
              <Route path="/shipper/track" element={<ShipperTrack />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
