import { useEffect } from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

// Auth Pages
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import NotFound from "./pages/NotFound";

// Driver Pages (صفحات السائق)
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverLoads from "./pages/driver/DriverLoads";
import DriverTrucks from "./pages/driver/DriverTrucks";
import DriverAccount from "./pages/driver/DriverAccount";
import DriverTasks from "./pages/shipper/ShipperLoads"; // صفحة التحكم في الحالات للسائق

// Shipper Pages (صفحات التاجر)
import ShipperDashboard from "./pages/shipper/ShipperDashboard";
import ShipperPostLoad from "./pages/shipper/ShipperPostLoad";
import ShipperDrivers from "./pages/shipper/ShipperDrivers";
import ShipperHistory from "./pages/shipper/ShipperHistory";
import ShipperTrack from "./pages/shipper/ShipperTrack";
import ShipperAccount from "./pages/shipper/ShipperAccount";

// Admin Pages (صفحات الإدارة) ✅ تأكد من وجود هذه الملفات في فولدر admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLoads from "./pages/admin/AdminLoads";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner position="top-center" richColors />
        
        <BrowserRouter>
          <Routes>
            {/* 1. المسارات العامة */}
            <Route path="/" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* 2. المسارات المحمية */}
            <Route element={<ProtectedRoute />}>

              {/* قسم السائق */}
              <Route path="/driver/dashboard" element={<DriverDashboard />} />
              <Route path="/driver/loads" element={<DriverLoads />} />
              <Route path="/driver/tasks" element={<DriverTasks />} />
              <Route path="/driver/trucks" element={<DriverTrucks />} />
              <Route path="/driver/account" element={<DriverAccount />} />

              {/* قسم التاجر */}
              <Route path="/shipper/dashboard" element={<ShipperDashboard />} />
              <Route path="/shipper/post" element={<ShipperPostLoad />} />
              <Route path="/shipper/drivers" element={<ShipperDrivers />} />
              <Route path="/shipper/history" element={<ShipperHistory />} />
              <Route path="/shipper/track" element={<ShipperTrack />} />
              <Route path="/shipper/account" element={<ShipperAccount />} />

              {/* قسم الإدارة ✅ هذا هو القسم الذي كان ناقصاً أو به خطأ */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/loads" element={<AdminLoads />} />
              <Route path="/admin/tickets" element={<AdminTickets />} />
              <Route path="/admin/settings" element={<AdminSettings />} />

            </Route>

            {/* 3. التعامل مع الروابط غير الموجودة */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
