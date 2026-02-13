import { supabase } from '@/integrations/supabase/client';
import { UserProfile, Load, AdminStats, UserRole } from '@/types';

export const api = {
  // --- المصادقة (Auth) ---
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
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
    return { session: data.session, user: data.user, profile: profile as UserProfile, role: (roleData?.role || 'shipper') as UserRole };
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

  // --- الشاحنات والسائقين ---
  async addTruck(truckData: any, userId: string) {
    const { error } = await supabase.from('trucks').insert([{
      owner_id: userId, plate_number: truckData.plate_number, brand: truckData.brand,
      model_year: truckData.model_year, truck_type: truckData.truck_type, capacity: truckData.capacity,
    }]);
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
    const { error } = await supabase.from('sub_drivers').insert([{
      carrier_id: carrierId, driver_name: driverData.driver_name,
      driver_phone: driverData.driver_phone, id_number: driverData.id_number,
      license_number: driverData.license_number,
    }]);
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

  // --- الشحنات (Loads) ---
  async postLoad(loadData: any, userId: string) {
    const { error } = await supabase.from('loads').insert([{
      owner_id: userId, origin: loadData.origin, destination: loadData.destination,
      weight: parseFloat(loadData.weight) || 0, price: parseFloat(loadData.price) || 0,
      truck_size: loadData.truck_size, body_type: loadData.body_type,
      description: loadData.description || '', type: loadData.type || 'general',
      package_type: loadData.package_type, pickup_date: loadData.pickup_date,
      receiver_name: loadData.receiver_name, receiver_phone: loadData.receiver_phone,
      receiver_address: loadData.receiver_address, status: 'available',
      origin_lat: loadData.origin_lat, origin_lng: loadData.origin_lng,
      dest_lat: loadData.dest_lat, dest_lng: loadData.dest_lng, distance: loadData.distance || 0
    }]);
    if (error) throw error;
  },

  async getAvailableLoads() {
    // تم تبسيط الدالة لضمان ظهور البيانات للسائق
    const { data, error } = await supabase
      .from('loads')
      .select('*') 
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getUserLoads(userId: string) {
    const { data, error } = await supabase.from('loads').select('*').or(`owner_id.eq.${userId},driver_id.eq.${userId}`).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async acceptLoad(loadId: string, driverId: string) {
    const { error } = await supabase.from('loads').update({ status: 'in_progress', driver_id: driverId }).eq('id', loadId);
    if (error) throw error;
  },

  async submitBid(loadId: string, driverId: string, price: number, message?: string) {
    const { error } = await supabase.from('load_bids').insert([{ load_id: loadId, driver_id: driverId, price, message }]);
    if (error) throw error;
  },

  // --- الإحصائيات (Stats) - تم استعادتها لفك التعليق ---
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

  // --- الإدارة ---
  async getAllUsers() {
    const { data, error } = await supabase.from('profiles').select('*, user_roles(role)').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getAllLoads() {
    const { data, error } = await supabase.from('loads').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getTickets() {
    const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
};
