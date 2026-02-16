import { supabase } from '@/integrations/supabase/client';
import { UserProfile, AdminStats, UserRole } from '@/types';

export const api = {
  // =========================
  // 🔐 المصادقة (Auth)
  // =========================

  // تسجيل دخول المستخدمين (سائق / تاجر)
  async loginByEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: profile } = await supabase.from('profiles').select('*, user_roles(role)').eq('id', data.user.id).maybeSingle();
      return { profile: profile as UserProfile, role: (profile?.user_roles?.[0]?.role || 'shipper') as UserRole };
    } catch (e) { throw e; }
  },

  // ✅ حل المشكلة: وظيفة تسجيل دخول الأدمن المفقودة
  async loginAdmin(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // التأكد أن المستخدم لديه صلاحية admin فعلاً
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (!roleData || roleData.role !== 'admin') {
        await supabase.auth.signOut(); // طرده إذا لم يكن أدمن
        throw new Error("عذراً، هذا الحساب لا يملك صلاحيات الإدارة.");
      }
      return data;
    } catch (e) { throw e; }
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
    } catch (e) { throw e; }
  },

  async verifyEmailOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) throw error;
    return data;
  },

  async resendOtp(email: string) {
    await supabase.auth.resend({ type: "signup", email });
  },

  // =========================
  // 🔔 نظام الإشعارات اللحظي (الرادار)
  // =========================
  
  async createNotification(userId: string, title: string, message: string, type: 'accept' | 'complete' | 'new_load' | 'system') {
    try {
      // إرسال الإشعار لجدول الإشعارات في سوبابيز ليلقطه الـ Realtime
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

    // 🚀 تحديث حي: إخطار جميع السائقين بوجود شحنة جديدة
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
  },

  async acceptLoad(loadId: string, driverId: string) {
    const { data: load } = await supabase.from('loads').select('owner_id, origin').eq('id', loadId).single();
    const { error } = await supabase.from('loads').update({ 
      status: 'in_progress', 
      driver_id: driverId, 
      updated_at: new Date().toISOString() 
    }).eq('id', loadId);
    
    if (error) throw error;

    // 🚀 تحديث حي: إرسال رنة للتاجر بأن شحنته قُبلت
    if (load) {
      await this.createNotification(load.owner_id, "✅ تم قبول شحنتك", `أبشرك، الناقل في طريقه إليك الآن.`, 'accept');
    }
    return true;
  },

  async completeLoad(loadId: string) {
    const { data: load } = await supabase.from('loads').select('owner_id').eq('id', loadId).single();
    await supabase.from('loads').update({ 
      status: 'completed', 
      updated_at: new Date().toISOString() 
    }).eq('id', loadId);
    
    // 🚀 تحديث حي: إرسال رنة للتاجر بالوصول
    if (load) {
      await this.createNotification(load.owner_id, "🏁 وصلت الشحنة بسلام", "تم تسليم بضاعتك بنجاح. شكراً لاستخدامك SAS.", 'complete');
    }
    return true;
  },

  async cancelLoad(loadId: string) {
    await supabase.from('loads').update({ status: 'available', driver_id: null }).eq('id', loadId);
    return true;
  },

  // =========================
  // 📈 الإحصائيات والجلب
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

  async getAvailableLoads() {
    const { data } = await supabase.from('loads').select(`*, owner:profiles!loads_owner_id_fkey (*)`).eq('status', 'available').order('created_at', { ascending: false });
    return data || [];
  },

  async getUserLoads(userId: string) {
    const { data } = await supabase.from('loads').select(`*, owner:profiles!loads_owner_id_fkey(*), driver:profiles!loads_driver_id_fkey(*)`).or(`owner_id.eq.${userId},driver_id.eq.${userId}`).order('created_at', { ascending: false });
    return data || [];
  },

  async getAvailableDrivers() {
    const { data } = await supabase.from('profiles').select('*, user_roles!inner(role)').eq('user_roles.role', 'driver');
    return data || [];
  },

  async updateProfile(userId: string, updates: any) {
    await supabase.from('profiles').update(updates).eq('id', userId);
  },

  async getAdminStats(): Promise<AdminStats> {
    const { count: u } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: l } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('status', 'in_progress');
    return { totalUsers: u || 0, totalDrivers: 0, totalShippers: 0, activeLoads: l || 0, completedTrips: 0 };
  },

  async getTickets() {
    const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    return data || [];
  }
};
