import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Bell, Check, X, Trash2, Clock, DollarSign, Package } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { userProfile, currentRole } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isAllOpen, setIsAllOpen] = useState(false);

  useEffect(() => {
    if (!userProfile?.id) return;
    api.getNotifications(userProfile.id).then(setNotifications);

    const channel = supabase.channel('realtime-notif')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile.id}` }, 
      (p) => {
        setNotifications(prev => [p.new, ...prev]);
        toast.info(p.new.title, { description: p.new.message });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleBidAction = async (notif: any, status: 'accepted' | 'rejected') => {
    try {
      // نحتاج لجلب الـ driverId من العرض الفعلي
      const { data: bid } = await supabase.from('load_bids').select('driver_id').eq('id', notif.data.bidId).single();
      if (!bid) return;

      await api.respondToBid(notif.data.bidId, status, notif.data.loadId, bid.driver_id);
      toast.success(status === 'accepted' ? "تم قبول العرض بنجاح" : "تم رفض العرض");
      await api.deleteNotification(notif.id);
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch (err) { toast.error("حدث خطأ في معالجة الطلب"); }
  };

  const NotificationItem = ({ n }: { n: any }) => (
    <div className={cn("p-4 flex gap-3 group border-b", !n.is_read && "bg-primary/5")}>
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
        {n.type === 'bid' ? <DollarSign className="text-amber-600" /> : <Package className="text-primary" />}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-start">
          <p className="font-black text-sm">{n.title}</p>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDelete(n.id, e)}>
            <Trash2 size={14} className="text-destructive" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground font-medium">{n.message}</p>
        
        {/* أزرار قبول/رفض العرض */}
        {n.type === 'bid' && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="h-8 bg-emerald-600 font-bold" onClick={() => handleBidAction(n, 'accepted')}><Check size={14} className="me-1"/> قبول</Button>
            <Button size="sm" variant="outline" className="h-8 border-rose-200 text-rose-600 font-bold" onClick={() => handleBidAction(n, 'rejected')}><X size={14} className="me-1"/> رفض</Button>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-2">{new Date(n.created_at).toLocaleTimeString('ar-SA')}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* ... الكود السابق للـ Sidebar ... */}
      
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-2xl bg-muted/50">
                  <Bell size={24} />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-destructive rounded-full border-2 border-background" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-2xl shadow-2xl overflow-hidden border-none" align="end">
                <div className="p-4 bg-primary text-white font-black text-sm flex justify-between">
                  تنبيهات النظام
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{notifications.length} إشعار</span>
                </div>
                <ScrollArea className="h-80">
                  {notifications.length > 0 ? notifications.slice(0, 5).map(n => <NotificationItem key={n.id} n={n} />) 
                  : <div className="p-10 text-center opacity-30 font-bold">لا توجد إشعارات</div>}
                </ScrollArea>
                <Button variant="ghost" className="w-full h-12 text-xs font-bold rounded-none border-t" onClick={() => setIsAllOpen(true)}>عرض جميع التنبيهات</Button>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* نافذة "عرض جميع التنبيهات" */}
        <Dialog open={isAllOpen} onOpenChange={setIsAllOpen}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-none">
            <DialogHeader className="p-6 bg-muted/30 border-b">
              <DialogTitle className="text-2xl font-black">مركز الإشعارات</DialogTitle>
              <DialogDescription>تابع عروض الأسعار وحالات الشحن الحية هنا.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="grid grid-cols-1">
                {notifications.map(n => <NotificationItem key={n.id} n={n} />)}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
