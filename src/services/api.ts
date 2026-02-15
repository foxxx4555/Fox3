import { supabase } from '@/integrations/supabase/client';
import { UserProfile, AdminStats, UserRole } from '@/types';

// دالة مساعدة لمعالجة الأخطاء الصامتة
const handleApiError = (err: any) => {
  if (err.name === 'AbortError' || err.message?.includes('aborted')) {
    return null;
  }
  console.error("API Error:", err);
  throw err;
};

export const api = {
  // --- المصادقة والحساب ---
  async loginByEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, user_roles(role)')
        .eq('id', data.user.id)
        .maybeSingle();
      return { 
        profile: profile as UserProfile, 
        role: (profile?.user_roles?.[0]?.role || 'shipper') as UserRole 
      };
    } catch (e) { return handleApiError(e); }
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) throw error;
    } catch (e) { handleApiError(e); }
  },

  // --- الإشعارات ---
  async createNotification(userId: string, title: string, message: string, type: string) {
    try {
      await supabase.from('notifications').insert([{ user_id: userId, title, message, type }]);
    } catch (e) { handleApiError(e); }
  },

  // --- إدارة الشحنات (العمليات الأساسية) ---
  
  // 1. نشر شحنة جديدة
  async postLoad(loadData: any, userId: string) {
    try {
      const { error } = await supabase.from('loads').insert([{ ...loadData, owner_id: userId, status: 'available' }]);
      if (error) throw error;
    } catch (e) { handleApiError(e); }
  },

  // 2. جلب الشحنات المتاحة في السوق
  async getAvailableLoads() {
    try {
      const { data, error } = await supabase
        .from('loads')
        .select(`*, owner:profiles!loads_owner_id_fkey (*)`)
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) { return handleApiError(e) || []; }
  },

  // 3. قبول الشحنة (تحويلها من متاح إلى قيد التنفيذ)
  async acceptLoad(loadId: string, driverId: string) {
    try {
      // جلب بيانات صاحب الشحنة لإرسال إشعار له
      const { data: load } = await supabase.from('loads').select('owner_id, origin').eq('id', loadId).single();
      
      const { error } = await supabase
        .from('loads')
        .update({ 
          status: 'in_progress', 
          driver_id: driverId,
          updated_at: new Date().toISOString() 
        })
        .eq('id', loadId);

      if (error) throw error;

      if (load) {
        await this.createNotification(
          load.owner_id, 
          "✅ تم قبول شحنتك", 
          `وافق سائق على نقل شحنتك من ${load.origin}`, 
          "accept"
        );
      }
    } catch (e) { return handleApiError(e); }
  },

  // 4. إنهاء الشحنة (تغيير الحالة لمكتملة)
  async completeLoad(loadId: string) {
    try {
      const { data: load } = await supabase.from('loads').select('owner_id').eq('id', loadId).single();
      
      const { error } = await supabase
        .from('loads')
        .update({ 
          status: 'completed', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', loadId);

      if (error) throw error;

      if (load) {
        await this.createNotification(
          load.owner_id, 
          "🏁 وصلت الشحنة", 
          `تم تسليم شحنتك بنجاح. يرجى تقييم تجربة النقل.`, 
          "complete"
        );
      }
    } catch (e) { return handleApiError(e); }
  },

  // 5. إلغاء المهمة (إعادتها للسوق العام)
  async cancelLoad(loadId: string) {
    try {
      const { error } = await supabase
        .from('loads')
        .update({ 
          status: 'available', 
          driver_id: null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', loadId);
      if (error) throw error;
    } catch (e) { handleApiError(e); }
  },

  // 6. جلب شحنات مستخدم معين (سائق أو تاجر)
  async getUserLoads(userId: string) {
    try {
      const { data, error } = await supabase
        .from('loads')
        .select(`*, owner:profiles!loads_owner_id_fkey(*), driver:profiles!loads_driver_id_fkey(*)`)
        .or(`owner_id.eq.${userId},driver_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) { return handleApiError(e) || []; }
  },

  // --- الإحصائيات والإدارة ---
  async getAvailableDrivers() {
    try {
      const { data } = await supabase.from('user_roles').select(`user_id, profiles:user_id (*)`).eq('role', 'driver');
      return data?.map(item => item.profiles).filter(p => p !== null) || [];
    } catch (e) { return []; }
  },

  async getAdminStats(): Promise<AdminStats> {
    try {
      const { count: u } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: l } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('status', 'in_progress');
      return { totalUsers: u || 0, totalDrivers: 0, totalShippers: 0, activeLoads: l || 0, completedTrips: 0 };
    } catch (e) { return { totalUsers: 0, totalDrivers: 0, totalShippers: 0, activeLoads: 0, completedTrips: 0 }; }
  },

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
  }
};
