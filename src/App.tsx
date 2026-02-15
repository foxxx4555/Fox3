import { useEffect, useState, lazy, Suspense } from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// 🚀 تسريع التحميل: استدعاء الصفحات فقط عند الحاجة (Lazy Loading)
const WelcomePage = lazy(() => import("./pages/WelcomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// صفحات السائق
const DriverDashboard = lazy(() => import("./pages/driver/DriverDashboard"));
const DriverLoads = lazy(() => import("./pages/driver/DriverLoads"));
const DriverTrucks = lazy(() => import("./pages/driver/DriverTrucks"));
const DriverAccount = lazy(() => import("./pages/driver/DriverAccount"));

// صفحات التاجر
const ShipperDashboard = lazy(() => import("./pages/shipper/ShipperDashboard"));
const ShipperPostLoad = lazy(() => import("./pages/shipper/ShipperPostLoad"));
const ShipperDrivers = lazy(() => import("./pages/shipper/ShipperDrivers"));
const ShipperHistory = lazy(() => import("./pages/shipper/ShipperHistory"));
const ShipperTrack = lazy(() => import("./pages/shipper/ShipperTrack"));
const ShipperAccount = lazy(() => import("./pages/shipper/ShipperAccount"));

// صفحات الإدارة
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

const queryClient = new QueryClient();

const App = () => {
  // 🔐 حماية ذكية: يقرأ آخر حالة للنظام من ذاكرة الموبايل للسرعة القصوى
  const [systemActive, setSystemActive] = useState<boolean>(() => {
    return localStorage.getItem('sas_sys_status') !== 'false';
  });

  useEffect(() => {
    // التأكد من حالة النظام في الخلفية (Background Check)
    const checkStatus = async () => {
      try {
        const { data } = await supabase.from('system_status').select('is_active').single();
        if (data) {
          setSystemActive(data.is_active);
          // حفظ الحالة للفتح السريع المرة القادمة
          localStorage.setItem('sas_sys_status', String(data.is_active));
        }
      } catch (e) {
        console.log("Offline mode or status check skipped");
      }
    };
    
    checkStatus();
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  // 🛑 شاشة الإغلاق: تظهر فوراً لو الحالة "false"
  if (!systemActive) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0c10] text-white p-6 text-center">
        <div className="w-24 h-24 bg-rose-500/10 rounded-[2rem] flex items-center justify-center text-rose-500 mb-8 animate-pulse border border-rose-500/20">
           <span className="text-5xl font-black">!</span>
        </div>
        <h1 className="text-4xl font-black mb-4 tracking-tighter">النظام متوقف</h1>
        <p className="text-slate-400 text-lg font-bold leading-relaxed max-w-xs">
          عذراً، النظام يخضع للصيانة حالياً. <br/> يرجى المحاولة لاحقاً.
        </p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner position="top-center" richColors />
        <BrowserRouter>
          {/* 🌀 شاشة انتظار خفيفة جداً تظهر فقط عند التنقل بين الصفحات */}
          <Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-[#0a0c10]">
              <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
          }>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              <Route element={<ProtectedRoute />}>
                {/* مسارات السائق */}
                <Route path="/driver/dashboard" element={<DriverDashboard />} />
                <Route path="/driver/loads" element={<DriverLoads />} />
                <Route path="/driver/tasks" element={<DriverLoads />} /> 
                <Route path="/driver/trucks" element={<DriverTrucks />} /> 
                <Route path="/driver/account" element={<DriverAccount />} />

                {/* مسارات التاجر */}
                <Route path="/shipper/dashboard" element={<ShipperDashboard />} />
                <Route path="/shipper/post" element={<ShipperPostLoad />} />
                <Route path="/shipper/drivers" element={<ShipperDrivers />} />
                <Route path="/shipper/history" element={<ShipperHistory />} />
                <Route path="/shipper/track" element={<ShipperTrack />} />
                <Route path="/shipper/account" element={<ShipperAccount />} />

                {/* مسارات الإدارة */}
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
