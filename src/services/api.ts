// src/services/api.ts
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, Load, AdminStats, UserRole } from '@/types';

export const api = {
  // ==========================================
  // 1. المصادقة والحساب (Auth & Account)
  // ==========================================
  async registerUser(email: string, password: string, metadata: { full_name: string; phone: string; role: UserRole }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
    return data;
  },

  async verifyEmailOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    if (error) throw error;
    return data;
  },

  async resendOtp(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  },

  async loginByEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile } = await supabase.from('profiles').select('*, user_roles(role)').eq('id', data.user.id).maybeSingle();
    return { 
      session: data.session, 
      user: data.user, 
      profile: profile as UserProfile, 
      role: (profile?.user_roles?.[0]?.role || 'shipper') as UserRole 
    };
  },

  async loginAdmin(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
    if (roleData?.role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error('ليس لديك صلاحيات الإدارة');
    }
    return { session: data.session, user: data.user, role: 'admin' as UserRole };
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw error;
  },

  async forgotPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' });
    if (error) throw error;
  },

  // ==========================================
  // 2. نظام الإشعارات (Notifications)
  // ==========================================
  async createNotification(userId: string, title: string, message: string, type: string) {
    const { error } = await supabase.from('notifications').insert([{
      user_id: userId,
      title,
      message,
      type
    }]);
    if (error) console.error("Notification Error:", error);
  },

  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // ==========================================
  // 3. إدارة السائقين والتعقب (Drivers & Tracking)
  // ==========================================
  async getAvailableDrivers() {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          profiles:user_id (id, full_name, phone, avatar_url, latitude, longitude, last_seen_at)
        `)
        .eq('role', 'driver');
      if (error) throw error;
      return data.map(item => item.profiles).filter(p => p !== null);
    } catch (err) {
      console.error("Error fetching drivers:", err);
      throw err;
    }
  },

  async getMyDrivers(shipperId: string) {
    const { data, error } = await supabase
      .from('loads')
      .select(`driver:profiles!loads_driver_id_fkey (id, full_name, phone, avatar_url, latitude, longitude)`)
      .eq('owner_id', shipperId)
      .not('driver_id', 'is', null);
    if (error) throw error;
    const unique = Array.from(new Map(data.map(i => [i.driver['id'], i.driver])).values());
    return unique;
  },

  async addTruck(truckData: any, userId: string) {
    const { error } = await supabase.from('trucks').insert([{ ...truckData, owner_id: userId }]);
    if (error) throw error;
  },

  async getTrucks(userId: string) {
    const { data, error } = await supabase.from('trucks').select('*').eq('owner_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async deleteTruck(truckId: string) {
    const { error } = await supabase.from('trucks').delete().eq('id', truckId);
    if (error) throw error;
  },

  async addSubDriver(driverData: any, carrierId: string) {
    const { error } = await supabase.from('sub_drivers').insert([{ ...driverData, carrier_id: carrierId }]);
    if (error) throw error;
  },

  async getSubDrivers(carrierId: string) {
    const { data, error } = await supabase.from('sub_drivers').select('*').eq('carrier_id', carrierId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async deleteSubDriver(id: string) {
    const { error } = await supabase.from('sub_drivers').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // 4. إدارة الشحنات (Loads & Bids)
  // ==========================================
  async postLoad(loadData: any, userId: string) {
    const { error } = await supabase.from('loads').insert([{ ...loadData, owner_id: userId, status: 'available' }]);
    if (error) throw error;
  },

  async getAvailableLoads() {
    const { data, error } = await supabase
      .from('loads')
      .select(`*, owner:profiles!loads_owner_id_fkey (full_name, phone, avatar_url)`)
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getUserLoads(userId: string) {
    const { data, error } = await supabase
      .from('loads')
      .select(`*, owner:profiles!loads_owner_id_fkey(full_name, phone), driver:profiles!loads_driver_id_fkey(full_name, phone, latitude, longitude)`)
      .or(`owner_id.eq.${userId},driver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async acceptLoad(loadId: string, driverId: string) {
    // جلب بيانات الشحنة لإرسال إشعار لصاحبها
    const { data: load } = await supabase.from('loads').select('owner_id, origin, destination').eq('id', loadId).single();
    
    const { error } = await supabase.from('loads').update({ status: 'in_progress', driver_id: driverId }).eq('id', loadId);
    if (error) throw error;

    if (load) {
      await this.createNotification(
        load.owner_id, 
        "✅ تم قبول شحنتك", 
        `قام سائق بقبول شحنتك من ${load.origin} إلى ${load.destination}`,
        "accept"
      );
    }
  },

  async submitBid(loadId: string, driverId: string, price: number, message?: string) {
    const { data: load } = await supabase.from('loads').select('owner_id').eq('id', loadId).single();
    
    const { error } = await supabase.from('load_bids').insert([{ load_id: loadId, driver_id: driverId, price, message }]);
    if (error) throw error;

    if (load) {
      await this.createNotification(
        load.owner_id, 
        "💰 عرض سعر جديد", 
        `وصلك عرض سعر جديد بقيمة ${price} ر.س على شحنتك`,
        "bid"
      );
    }
  },

  // ==========================================
  // 5. الإحصائيات (Dashboard Stats)
  // ==========================================
  async getDriverStats(userId: string) {
    const { count: active } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'in_progress');
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'completed');
    return { activeLoads: active || 0, completedTrips: completed || 0, rating: 4.8 };
  },

  async getShipperStats(userId: string) {
    const { count: active } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('owner_id', userId).in('status', ['available', 'in_progress']);
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('owner_id', userId).eq('status', 'completed');
    return { activeLoads: active || 0, completedTrips: completed || 0 };
  },

  async getAdminStats(): Promise<AdminStats> {
    const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: drivers } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'driver');
    const { count: shippers } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'shipper');
    const { count: activeLoads } = await supabase.from('loads').select('*', { count: 'exact', head: true }).in('status', ['available', 'in_progress']);
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    return { totalUsers: users || 0, totalDrivers: drivers || 0, totalShippers: shippers || 0, activeLoads: activeLoads || 0, completedTrips: completed || 0 };
  },

  // ==========================================
  // 6. الإدارة (Admin Management)
  // ==========================================
  async getAllUsers() {
    const { data, error } = await supabase.from('profiles').select('*, user_roles(role)').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getAllLoads() {
    const { data, error } = await supabase.from('loads').select('*, owner:profiles!loads_owner_id_fkey(full_name)').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getTickets() {
    const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
};
