import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, X, Trash2, CheckCircle } from 'lucide-react';
import { Load } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ShipperLoads() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();

  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchLoads = async () => {
    if (!userProfile?.id) return;

    try {
      const data = await api.getUserLoads(userProfile.id);
      setLoads(data as any as Load[]);
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء تحميل الشحنات");
    } finally {
      setLoading(false);
    }
  };

  // 🔄 إرجاع الشحنة متاحة
  const handleCancelAssignment = async (loadId: string) => {
    if (!window.confirm("هل تريد إرجاع الشحنة للسواقين؟")) return;

    try {
      setActionLoading(loadId);

      const { error } = await supabase
        .from('loads')
        .update({
          status: 'available',
          driver_id: null,
        })
        .eq('id', loadId);

      if (error) throw error;

      toast.success("تم إرجاع الشحنة بنجاح");
      fetchLoads();
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء العملية");
    } finally {
      setActionLoading(null);
    }
  };

  // 🗑 حذف الشحنة
  const handleDelete = async (loadId: string) => {
    if (!window.confirm("هل تريد حذف الشحنة نهائيًا؟")) return;

    try {
      setActionLoading(loadId);

      const { error } = await supabase
        .from('loads')
        .delete()
        .eq('id', loadId);

      if (error) throw error;

      toast.success("تم حذف الشحنة");
      fetchLoads();
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ تأكيد الاستلام
  const handleComplete = async (loadId: string) => {
    if (!window.confirm("هل تم استلام الشحنة؟")) return;

    try {
      setActionLoading(loadId);

      const { error } = await supabase
        .from('loads')
        .update({ status: 'completed' })
        .eq('id', loadId);

      if (error) throw error;

      toast.success("تم تأكيد الاستلام");
      fetchLoads();
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchLoads();

    const channel = supabase
      .channel('shipper-loads')
      .on(
        'postgres_changes',
        { event: '*', table: 'loads', schema: 'public' },
        () => {
          fetchLoads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile]);

  const statusColors: Record<string, string> = {
    available: 'bg-accent/10 text-accent',
    pending: 'bg-secondary/10 text-secondary',
    in_progress: 'bg-primary/10 text-primary',
    completed: 'bg-green-100 text-green-600',
    cancelled: 'bg-destructive/10 text-destructive',
  };

  const filteredLoads =
    statusFilter === 'all'
      ? loads
      : loads.filter(load => load.status === statusFilter);

  return (
    <AppLayout>
      <div className="space-y-4">

        {/* 🔎 فلترة */}
        <div className="flex gap-2 flex-wrap mb-4">
          {['all','available','pending','in_progress','completed','cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded text-xs border ${
                statusFilter === status
                  ? 'bg-primary text-white'
                  : 'bg-muted'
              }`}
            >
              {status === 'all' ? 'الكل' : t(status)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : filteredLoads.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('no_data')}
          </div>
        ) : (
          filteredLoads.map(load => (
            <Card key={load.id}>
              <CardContent className="p-5">

                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[load.status]}>
                      {t(load.status)}
                    </Badge>

                    {/* ❌ إرجاع */}
                    {(load.status === 'pending' || load.status === 'in_progress') && (
                      <button
                        onClick={() => handleCancelAssignment(load.id)}
                        className="text-destructive"
                        disabled={actionLoading === load.id}
                      >
                        {actionLoading === load.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <X size={16} />
                        )}
                      </button>
                    )}

                    {/* 🗑 حذف */}
                    {load.status === 'available' && (
                      <button
                        onClick={() => handleDelete(load.id)}
                        className="text-destructive"
                        disabled={actionLoading === load.id}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    {/* ✅ تأكيد استلام */}
                    {load.status === 'in_progress' && (
                      <button
                        onClick={() => handleComplete(load.id)}
                        className="text-green-600"
                        disabled={actionLoading === load.id}
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}

                  </div>

                  <span className="text-xs text-muted-foreground">
                    {new Date(load.created_at).toLocaleDateString('ar')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm mb-2">
                  <MapPin size={14} className="text-primary" />
                  {load.origin} → {load.destination}
                </div>

                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{load.weight} طن</span>
                  <span>{load.price} ر.س</span>
                  {load.receiver_name && (
                    <span>المستلم: {load.receiver_name}</span>
                  )}
                </div>

              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppLayout>
  );
}
