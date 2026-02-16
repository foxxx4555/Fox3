import { supabase } from '@/integrations/supabase/client';
import { UserProfile, AdminStats, UserRole } from '@/types';

export const api = {
  // =========================
  // 🔐 المصادقة
  // =========================
  async registerUser(email: string, password: string, profile: { full_name: string; phone: string; role: UserRole }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: profile.full_name, phone: profile.phone, role: profile.role } },
      });
      if (error) throw error;
      
      // إشعار للإدارة بوجود مستخدم جديد (اختياري)
      await this.createNotification('admin_general', '🆕 مستخدم جديد', `انضم ${profile.full_name} كـ ${profile.role} الآن`, 'system');
      
      return data;
    } catch (e) { throw e; }
  },

  async verifyEmailOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) throw error;
    return data;
  },

  async loginByEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile } = await supabase.from('profiles').select('*, user_roles(role)').eq('id', data.user.id).maybeSingle();
    return { profile: profile as UserProfile, role: (profile?.user_roles?.[0]?.role || 'shipper') as UserRole };
  },

  // =========================
  // 🔔 نظام الإشعارات الفوري
  // =========================
  async createNotification(userId: string, title: string, message: string, type: 'accept' | 'complete' | 'new_load' | 'system') {
    try {
      await supabase.from('notifications').insert([{ user_id: userId, title, message, type }]);
    } catch (e) { console.error("Notification Error:", e); }
  },

  async getNotifications(userId: string) {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  },

  async clearAllNotifications(userId: string) {
    await supabase.from('notifications').delete().eq('user_id', userId);
  },

  // =========================
  // 🚚 إدارة الشحنات (التحديث الفوري)
  // =========================
  async postLoad(loadData: any, userId: string) {
    const { data, error } = await supabase.from('loads').insert([{ ...loadData, owner_id: userId, status: 'available' }]).select().single();
    if (error) throw error;

    // 🚀 إرسال إشعار عام "لكل السائقين" بوجود شحنة جديدة
    // ملاحظة: في النسخة المتقدمة نستخدم Edge Function، هنا سنرسل إشعاراً لكل السائقين النشطين
    const { data: drivers } = await supabase.from('user_roles').select('user_id').eq('role', 'driver');
    if (drivers) {
      const bulkNotifs = drivers.map(d => ({
        user_id: d.user_id,
        title: "📦 شحنة جديدة متاحة!",
        message: `حمل جديد من ${loadData.origin} إلى ${loadData.destination} بـ ${loadData.price} ريال`,
        type: 'new_load'
      }));
      await supabase.from('notifications').insert(bulkNotifs);
    }
    return data;
  },

  async acceptLoad(loadId: string, driverId: string) {
    const { data: load } = await supabase.from('loads').select('owner_id, origin').eq('id', loadId).single();
    const { error } = await supabase.from('loads').update({ status: 'in_progress', driver_id: driverId, updated_at: new Date().toISOString() }).eq('id', loadId);
    if (error) throw error;

    if (load) {
      await this.createNotification(load.owner_id, "✅ تم قبول شحنتك", `الناقل في طريقه إليك لتحميل شحنة ${load.origin}`, 'accept');
    }
    return true;
  },

  async completeLoad(loadId: string) {
    const { data: load } = await supabase.from('loads').select('owner_id').eq('id', loadId).single();
    await supabase.from('loads').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', loadId);
    
    if (load) {
      await this.createNotification(load.owner_id, "🏁 وصلت الشحنة", "تم تسليم شحنتك بنجاح. شكراً لاستخدامك SAS.", 'complete');
    }
    return true;
  },

  // =========================
  // 📊 الإحصائيات
  // =========================
  async getShipperStats(userId: string) {
    const { count: a } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('owner_id', userId).eq('status', 'in_progress');
    const { count: c } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('owner_id', userId).eq('status', 'completed');
    return { activeLoads: a || 0, completedTrips: c || 0 };
  },

  async getDriverStats(userId: string) {
    const { count: a } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'in_progress');
    const { count: c } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'completed');
    return { activeLoads: a || 0, completedTrips: c || 0, rating: 4.9 };
  },

  async getAvailableDrivers() {
    const { data } = await supabase.from('profiles').select('*, user_roles!inner(role)').eq('user_roles.role', 'driver');
    return data || [];
  },

  async getAvailableLoads() {
    const { data } = await supabase.from('loads').select(`*, owner:profiles!loads_owner_id_fkey (*)`).eq('status', 'available').order('created_at', { ascending: false });
    return data || [];
  },

  async getUserLoads(userId: string) {
    const { data } = await supabase.from('loads').select(`*, owner:profiles!loads_owner_id_fkey(*), driver:profiles!loads_driver_id_fkey(*)`).or(`owner_id.eq.${userId},driver_id.eq.${userId}`).order('created_at', { ascending: false });
    return data || [];
  },

  async updateProfile(userId: string, updates: any) {
    await supabase.from('profiles').update(updates).eq('id', userId);
  }
};
