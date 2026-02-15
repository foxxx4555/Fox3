import { supabase } from '@/integrations/supabase/client';
import { UserProfile, AdminStats, UserRole } from '@/types';

export const api = {
  // --- المصادقة والحساب ---
  async loginByEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile } = await supabase.from('profiles').select('*, user_roles(role)').eq('id', data.user.id).maybeSingle();
    return { profile: profile as UserProfile, role: (profile?.user_roles?.[0]?.role || 'shipper') as UserRole };
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    await supabase.from('profiles').update(updates).eq('id', userId);
  },

  // --- الإشعارات ---
  async createNotification(userId: string, title: string, message: string, type: string) {
    await supabase.from('notifications').insert([{ user_id: userId, title, message, type }]);
  },

  async getNotifications(userId: string) {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data;
  },

  // --- الشحنات (السوق العام والمهام) ---
  async postLoad(loadData: any, userId: string) {
    const { error } = await supabase.from('loads').insert([{ ...loadData, owner_id: userId, status: 'available' }]);
    if (error) throw error;
  },

  async getAvailableLoads() {
    const { data } = await supabase.from('loads').select(`*, owner:profiles!loads_owner_id_fkey (*)`).eq('status', 'available').order('created_at', { ascending: false });
    return data;
  },

  async getUserLoads(userId: string) {
    const { data } = await supabase.from('loads').select(`*, owner:profiles!loads_owner_id_fkey(*), driver:profiles!loads_driver_id_fkey(*)`).or(`owner_id.eq.${userId},driver_id.eq.${userId}`).order('created_at', { ascending: false });
    return data;
  },

  async acceptLoad(loadId: string, driverId: string) {
    const { data: load } = await supabase.from('loads').select('owner_id, origin').eq('id', loadId).single();
    await supabase.from('loads').update({ status: 'in_progress', driver_id: driverId }).eq('id', loadId);
    if (load) {
      await this.createNotification(load.owner_id, "✅ تم قبول شحنتك", `وافق سائق على شحنتك من ${load.origin}`, "accept");
    }
  },

  async completeLoad(loadId: string) {
    const { data: load } = await supabase.from('loads').select('owner_id, origin').eq('id', loadId).single();
    await supabase.from('loads').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', loadId);
    if (load) {
      await this.createNotification(load.owner_id, "🏁 وصلت الشحنة", `تم تسليم شحنتك بنجاح. يرجى تقييم السائق.`, "complete");
    }
  },

  async cancelLoad(loadId: string) {
    await supabase.from('loads').update({ status: 'available', driver_id: null }).eq('id', loadId);
  },

  // --- الإدارة والسائقين ---
  async getAvailableDrivers() {
    const { data } = await supabase.from('user_roles').select(`user_id, profiles:user_id (*)`).eq('role', 'driver');
    return data?.map(item => item.profiles).filter(p => p !== null) || [];
  },

  async getAdminStats(): Promise<AdminStats> {
    const { count: u } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: l } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('status', 'in_progress');
    return { totalUsers: u || 0, totalDrivers: 0, totalShippers: 0, activeLoads: l || 0, completedTrips: 0 };
  },

  async getShipperStats(userId: string) {
    const { count: a } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('owner_id', userId).eq('status', 'in_progress');
    const { count: c } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('owner_id', userId).eq('status', 'completed');
    return { activeLoads: a || 0, completedTrips: c || 0 };
  },

  async getDriverStats(userId: string) {
    const { count: a } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'in_progress');
    const { count: c } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'completed');
    return { activeLoads: a || 0, completedTrips: c || 0, rating: 4.9 };
  }
};
