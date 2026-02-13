// src/services/api.ts
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, Load, AdminStats, UserRole } from '@/types';

export const api = {
  // ==========================================
  // 1. المصادقة والحساب (Auth & Account)
  // ==========================================
  async loginByEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    // جلب الملف الشخصي مع الدور
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .eq('id', data.user.id)
      .maybeSingle();

    return { 
      session: data.session, 
      user: data.user, 
      profile: profile as UserProfile, 
      role: (profile?.user_roles?.[0]?.role || 'shipper') as UserRole 
    };
  },

  async registerUser(email: string, password: string, metadata: { full_name: string; phone: string; role: UserRole }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw error;
  },

  // ==========================================
  // 2. نظام الإشعارات المتطور (Notifications)
  // ==========================================
  async createNotification(userId: string, title: string, message: string, type: string, data: any = {}) {
    const { error } = await supabase.from('notifications').insert([{
      user_id: userId,
      title,
      message,
      type,
      data // تخزين بيانات إضافية مثل bidId أو loadId
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

  async deleteNotification(id: string) {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // 3. إدارة السائقين والتعقب (Drivers & Tracking)
  // ==========================================
  async getAvailableDrivers() {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`user_id, profiles:user_id (*)`)
      .eq('role', 'driver');
    if (error) throw error;
    return data.map(item => item.profiles).filter(p => p !== null);
  },

  async getMyDrivers(shipperId: string) {
    const { data, error } = await supabase
      .from('loads')
      .select(`driver:profiles!loads_driver_id_fkey (*)`)
      .eq('owner_id', shipperId)
      .not('driver_id', 'is', null);
    if (error) throw error;
    const unique = Array.from(new Map(data.map(i => [i.driver['id'], i.driver])).values());
    return unique;
  },

  // ==========================================
  // 4. إدارة الشحنات والرحلات (Loads & Trips)
  // ==========================================
  async postLoad(loadData: any, userId: string) {
    const { error } = await supabase.from('loads').insert([{ ...loadData, owner_id: userId, status: 'available' }]);
    if (error) throw error;
  },

  async acceptLoad(loadId: string, driverId: string) {
    // جلب بيانات الشحنة وصاحبها
    const { data: load } = await supabase.from('loads').select('owner_id, origin, destination').eq('id', loadId).single();
    
    const { error } = await supabase.from('loads').update({ status: 'in_progress', driver_id: driverId }).eq('id', loadId);
    if (error) throw error;

    if (load) {
      await this.createNotification(
        load.owner_id, 
        "✅ تم قبول شحنتك", 
        `قام سائق بقبول شحنتك من ${load.origin} إلى ${load.destination}`,
        "accept",
        { loadId }
      );
    }
  },

  async completeLoad(loadId: string) {
    // إنهاء الرحلة من قبل السائق
    const { data: load } = await supabase.from('loads').select('owner_id, origin, destination').eq('id', loadId).single();
    
    const { error } = await supabase.from('loads').update({ status: 'completed' }).eq('id', loadId);
    if (error) throw error;

    if (load) {
      await this.createNotification(
        load.owner_id, 
        "🏁 تم توصيل الشحنة", 
        `أكد السائق وصول الشحنة من ${load.origin} بنجاح.`,
        "complete",
        { loadId }
      );
    }
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

  async getAvailableLoads() {
    const { data, error } = await supabase
      .from('loads')
      .select(`*, owner:profiles!loads_owner_id_fkey (full_name, phone, avatar_url)`)
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // ==========================================
  // 5. نظام عروض الأسعار (Bidding System)
  // ==========================================
  async submitBid(loadId: string, driverId: string, price: number, message?: string) {
    const { data: load } = await supabase.from('loads').select('owner_id, origin').eq('id', loadId).single();
    
    const { data: bid, error } = await supabase.from('load_bids').insert([{ 
      load_id: loadId, 
      driver_id: driverId, 
      price, 
      message 
    }]).select().single();
    
    if (error) throw error;

    if (load && bid) {
      await this.createNotification(
        load.owner_id, 
        "💰 عرض سعر جديد", 
        `وصلك عرض بقيمة ${price} ر.س على شحنة ${load.origin}`,
        "bid",
        { bidId: bid.id, loadId, price, driverId }
      );
    }
  },

  async respondToBid(bidId: string, status: 'accepted' | 'rejected', loadId: string, driverId: string) {
    // 1. تحديث حالة العرض في جدول العروض
    const { error: bidErr } = await supabase.from('load_bids').update({ status }).eq('id', bidId);
    if (bidErr) throw bidErr;

    if (status === 'accepted') {
      // 2. إذا تم القبول، نقوم بتعيين الشحنة لهذا السائق وتغيير حالتها
      const { error: loadErr } = await supabase.from('loads').update({ 
        status: 'in_progress', 
        driver_id: driverId 
      }).eq('id', loadId);
      if (loadErr) throw loadErr;

      // 3. إشعار للسائق بالقبول
      await this.createNotification(driverId, "🎊 تم قبول عرضك!", "وافق صاحب الشحنة على عرضك، يمكنك البدء بالتحميل الآن.", "bid_response");
    } else {
      // 4. إشعار للسائق بالرفض
      await this.createNotification(driverId, "❌ رفض العرض", "نعتذر، لم يتم قبول عرض السعر المقدم من قبلك.", "bid_response");
    }
  },

  // ==========================================
  // 6. الشاحنات والسائقين (Trucks & Sub-drivers)
  // ==========================================
  async addTruck(truckData: any, userId: string) {
    await supabase.from('trucks').insert([{ ...truckData, owner_id: userId }]);
  },

  async getTrucks(userId: string) {
    const { data } = await supabase.from('trucks').select('*').eq('owner_id', userId).order('created_at', { ascending: false });
    return data;
  },

  async deleteTruck(id: string) {
    await supabase.from('trucks').delete().eq('id', id);
  },

  async addSubDriver(driverData: any, carrierId: string) {
    await supabase.from('sub_drivers').insert([{ ...driverData, carrier_id: carrierId }]);
  },

  async getSubDrivers(carrierId: string) {
    const { data } = await supabase.from('sub_drivers').select('*').eq('carrier_id', carrierId).order('created_at', { ascending: false });
    return data;
  },

  async deleteSubDriver(id: string) {
    await supabase.from('sub_drivers').delete().eq('id', id);
  },

  // ==========================================
  // 7. الإحصائيات (Stats)
  // ==========================================
  async getShipperStats(userId: string) {
    const { count: active } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('owner_id', userId).in('status', ['available', 'in_progress']);
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('owner_id', userId).eq('status', 'completed');
    return { activeLoads: active || 0, completedTrips: completed || 0 };
  },

  async getDriverStats(userId: string) {
    const { count: active } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'in_progress');
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'completed');
    return { activeLoads: active || 0, completedTrips: completed || 0, rating: 4.9 };
  },

  async getAdminStats(): Promise<AdminStats> {
    const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: drivers } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'driver');
    const { count: shippers } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'shipper');
    const { count: activeLoads } = await supabase.from('loads').select('*', { count: 'exact', head: true }).in('status', ['available', 'in_progress']);
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    return { totalUsers: users || 0, totalDrivers: drivers || 0, totalShippers: shippers || 0, activeLoads: activeLoads || 0, completedTrips: completed || 0 };
  }
};
