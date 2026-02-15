import AppLayout from '@/components/AppLayout';

export default function DriverTasks() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-black">مهامي الحالية</h1>
        <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed">
          <p className="text-muted-foreground font-bold">لا توجد مهام نشطة حالياً</p>
        </div>
      </div>
    </AppLayout>
  );
}
