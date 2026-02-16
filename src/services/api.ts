import { supabase } from '@/integrations/supabase/client';
import { UserProfile, AdminStats, UserRole } from '@/types';

// 🛑 معالج أخطاء ذكي لتنظيف الـ Eruda من الرسائل المزعجة
const handleApiError = (err: any) => {
  // إذا كان الخطأ مجرد إلغاء طلب بسبب التنقل السريع، نتجاهله
  if (err.name === 'AbortError' || err.message?.includes('aborted')) {
    return null;
  }
  console.error("⚠️ API Error:", err.message || err);
  throw err;
};

export const api = {
  // =========================
  // 🔐 المصادقة (Auth)
  // =========================

  async loginByEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: profile } = await supabase.from('profiles').select('*, user_roles(role)').eq('id', data.user.id).maybeSingle();
      return { profile: profile as UserProfile, role: (profile?.user_roles?.[0]?.role || 'shipper') as UserRole };
    } catch (e) { return handleApiError(e); }
  },

  async loginAdmin(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();

      if (!roleData || roleData.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error("عذراً، هذا الحساب لا يملك صلاحيات الإدارة.");
      }
      return data;
    } catch (e) { return handleApiError(e); }
  },

  async registerUser(email: string, password: string, profile: { full_name: string; phone: string; role: UserRole }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: profile.full_name, phone: profile.phone, role: profile.role } },
      });
      if (error) throw error;
      return data;
    } catch (e) { return handleApiError(e); }
  },

  async verifyEmailOtp(email: string, token: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (error) throw error;
      return data;
    } catch (e) { return handleApiError(e); }
  },

  async resendOtp(email: string) {
    try {
      await supabase.auth.resend({ type: "signup", email });
    } catch (e) { handleApiError(e); }
  },

  // =========================
  // 🔔 نظام الإشعارات اللحظي
  // =========================
  
  async createNotification(userId: string, title: string, message: string, type: 'accept' | 'complete' | 'new_load' | 'system') {
    try {
      await supabase.from('notifications').insert([{ user_id: userId, title, message, type }]);
    } catch (e) { handleApiError(e); }
  },

  async getNotifications(userId: string) {
    try {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return data || [];
    } catch (e) { return handleApiError(e); }
  },

  async clearAllNotifications(userId: string) {
    try {
      await supabase.from('notifications').delete().eq('user_id', userId);
    } catch (e) { handleApiError(e); }
  },

  // =========================
  // 🚚 إدارة الشحنات (تحديث حي)
  // =========================
  
  async postLoad(loadData: any, userId: string) {
    try {
      const { data, error } = await supabase.from('loads').insert([{ ...loadData, owner_id: userId, status: 'available' }]).select().single();
      if (error) throw error;

      // 🚀 بث مباشر لكل السواقين
      const { data: drivers } = await supabase.from('user_roles').select('user_id').eq('role', 'driver');
      if (drivers) {
        const bulkNotifs = drivers.map(d => ({
          user_id: d.user_id,
          title: "📦 شحنة جديدة متاحة!",
          message: `من ${loadData.origin} إلى ${loadData.destination} بـ ${loadData.price} ريال`,
          type: 'new_load'
        }));
        await supabase.from('notifications').insert(bulkNotifs);
      }
      return data;
    } catch (e) { return handleApiError(e); }
  },

  async acceptLoad(loadId: string, driverId: string) {
    try {
      const { data: load } = await supabase.from('loads').select('owner_id, origin').eq('id', loadId).single();
      const { error } = await supabase.from('loads').update({ status: 'in_progress', driver_id: driverId, updated_at: new Date().toISOString() }).eq('id', loadId);
      if (error) throw error;

      if (load) {
        await this.createNotification(load.owner_id, "✅ تم قبول شحنتك", `أبشرك، الناقل في طريقه إليك الآن.`, 'accept');
      }
      return true;
    } catch (e) { return handleApiError(e); }
  },

  async completeLoad(loadId: string) {
    try {
      const { data: load } = await supabase.from('loads').select('owner_id').eq('id', loadId).single();
      await supabase.from('loads').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', loadId);
      if (load) {
        await this.createNotification(load.owner_id, "🏁 وصلت الشحنة بسلام", "تم تسليم بضاعتك بنجاح. شكراً لاستخدامك SAS.", 'complete');
      }
      return true;
    } catch (e) { return handleApiError(e); }
  },

  // =========================
  // 📈 الإحصائيات والجلب
  // =========================

  async getShipperStats(userId: string) {
    try {
      const { count: a } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('owner_id', userId).eq('status', 'in_progress');
      const { count: c } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('owner_id', userId).eq('status', 'completed');
      return { activeLoads: a || 0, completedTrips: c || 0 };
    } catch (e) { return { activeLoads: 0, completedTrips: 0 }; }
  },

  async getDriverStats(userId: string) {
    try {
      const { count: a } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'in_progress');
      const { count: c } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'completed');
      return { activeLoads: a || 0, completedTrips: c || 0, rating: 4.9 };
    } catch (e) { return { activeLoads: 0, completedTrips: 0, rating: 0 }; }
  },

  async getAvailableLoads() {
    try {
      const { data } = await supabase.from('loads').select(`*, owner:profiles!loads_owner_id_fkey (*)`).eq('status', 'available').order('created_at', { ascending: false });
      return data || [];
    } catch (e) { return []; }
  },

  async getUserLoads(userId: string) {
    try {
      const { data } = await supabase.from('loads').select(`*, owner:profiles!loads_owner_id_fkey(*), driver:profiles!loads_driver_id_fkey(*)`).or(`owner_id.eq.${userId},driver_id.eq.${userId}`).order('created_at', { ascending: false });
      return data || [];
    } catch (e) { return []; }
  },

  async getAvailableDrivers() {
    try {
      const { data } = await supabase.from('profiles').select('*, user_roles!inner(role)').eq('user_roles.role', 'driver');
      return data || [];
    } catch (e) { return []; }
  },

  async updateProfile(userId: string, updates: any) {
    try {
      await supabase.from('profiles').update(updates).eq('id', userId);
    } catch (e) { handleApiError(e); }
  },

  async getAdminStats(): Promise<AdminStats> {
    try {
      const { count: u } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: l } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('status', 'in_progress');
      return { totalUsers: u || 0, totalDrivers: 0, totalShippers: 0, activeLoads: l || 0, completedTrips: 0 };
    } catch (e) { return { totalUsers: 0, totalDrivers: 0, totalShippers: 0, activeLoads: 0, completedTrips: 0 }; }
  },

  async getTickets() {
    try {
      const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      return data || [];
    } catch (e) { return []; }
  }
};
