import { supabase } from '@/integrations/supabase/client';
import { UserProfile, AdminStats, UserRole } from '@/types';

// دالة مساعدة لمعالجة الأخطاء الصامتة
const handleApiError = (err: any) => {
  if (err.name === 'AbortError' || err.message?.includes('aborted')) {
    return null; // تجاهل الخطأ لو كان بسبب إلغاء الطلب
  }
  console.error("API Error:", err);
  throw err;
};

export const api = {
  async loginByEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: profile } = await supabase.from('profiles').select('*, user_roles(role)').eq('id', data.user.id).maybeSingle();
      return { profile: profile as UserProfile, role: (profile?.user_roles?.[0]?.role || 'shipper') as UserRole };
    } catch (e) { return handleApiError(e); }
  },

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

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) throw error;
    } catch (e) { handleApiError(e); }
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
  },
  
  // دالة إرسال الشحنة المعدلة
  async postLoad(loadData: any, userId: string) {
    try {
      const { error } = await supabase.from('loads').insert([{ ...loadData, owner_id: userId, status: 'available' }]);
      if (error) throw error;
    } catch (e) { handleApiError(e); }
  }
};
