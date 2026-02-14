import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"; // استيراد القائمة المنسدلة
import { toast } from 'sonner';
import { Loader2, Truck, Package, MailCheck, RefreshCcw, User, Phone, Lock, ChevronRight, UserCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserRole } from '@/types';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // جعل القيمة الافتراضية فارغة لإجبار المستخدم على الاختيار
  const [role, setRole] = useState<UserRole | "">(""); 
  
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [timer, setTimer] = useState(0);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirmPassword: '' });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // منع التسجيل إذا لم يتم اختيار نوع الحساب
    if (!role) {
      toast.error('يرجى تحديد نوع الحساب أولاً (سائق أم صاحب شاحنة)');
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('كلمة المرور غير متطابقة');
      return;
    }

    setLoading(true);
    try {
      await api.registerUser(form.email, form.password, { 
        full_name: form.full_name, 
        phone: form.phone, 
        role: role as UserRole 
      });
      toast.success('تم إرسال رمز التحقق بريدياً');
      setShowOtp(true);
      setTimer(60);
    } catch (err: any) { 
      toast.error(err.message || t('error')); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) return toast.error('الرجاء إدخال الرمز كاملاً');
    setLoading(true);
    try {
      await api.verifyEmailOtp(form.email, otpCode);
      toast.success('تم تفعيل حسابك بنجاح!');
      navigate('/login');
    } catch (err: any) { toast.error('رمز التحقق غير صحيح'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 relative overflow-hidden p-6 py-12">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xl mb-6">
            <Truck className="text-primary w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">{showOtp ? 'تأكيد الهوية' : t('register')}</h1>
          <p className="text-muted-foreground font-medium mt-2">انضم إلى شبكة SAS Transport الذكية</p>
        </div>

        <Card className="shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)] border-white/50 bg-white/70 backdrop-blur-2xl rounded-[3rem] overflow-hidden">
          <CardContent className="p-8 md:p-12">
            {!showOtp ? (
              <form onSubmit={handleRegister} className="space-y-6">
                
                {/* قائمة اختيار نوع الحساب الجديدة */}
                <div className="space-y-3">
                  <Label className="text-sm font-black uppercase ms-1 text-primary">نوع الحساب (مطلوب) *</Label>
                  <Select onValueChange={(val) => setRole(val as UserRole)} value={role}>
                    <SelectTrigger className="h-16 rounded-2xl border-2 border-primary/20 bg-white/50 focus:ring-primary focus:border-primary font-black text-lg transition-all">
                      <SelectValue placeholder="اختر: أنت سائق أم صاحب شاحنة؟" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="driver" className="h-14 font-bold cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Truck size={20} className="text-primary" />
                          <span>سائق / ناقل بضائع</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="shipper" className="h-14 font-bold cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Package size={20} className="text-amber-500" />
                          <span>تاجر / صاحب شحنة</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-muted-foreground ms-2">الاسم بالكامل</Label>
                    <div className="relative group">
                      <User className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} required className="ps-12 h-14 rounded-2xl border-transparent bg-muted/50 focus:bg-white transition-all font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-muted-foreground ms-2">رقم الجوال</Label>
                    <div className="relative group">
                      <Phone className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} dir="ltr" className="ps-12 h-14 rounded-2xl border-transparent bg-muted/50 focus:bg-white transition-all font-bold" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-muted-foreground ms-2">البريد الإلكتروني</Label>
                  <div className="relative group">
                    <MailCheck className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required dir="ltr" className="ps-12 h-14 rounded-2xl border-transparent bg-muted/50 focus:bg-white transition-all font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-muted-foreground ms-2">كلمة المرور</Label>
                    <Input type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required className="h-14 rounded-2xl border-transparent bg-muted/50 focus:bg-white transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-muted-foreground ms-2">تأكيد كلمة المرور</Label>
                    <Input type="password" value={form.confirmPassword} onChange={e => setForm(p => ({...p, confirmPassword: e.target.value}))} required className="h-14 rounded-2xl border-transparent bg-muted/50 focus:bg-white transition-all font-bold" />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !role} // التعطيل لو مختارش
                  className="w-full h-16 rounded-[1.5rem] mt-4 text-lg font-black bg-primary hover:bg-primary/95 shadow-xl shadow-primary/20 transition-all"
                >
                  {loading ? <Loader2 className="animate-spin" /> : t('register')}
                </Button>

                <p className="text-sm font-bold text-center text-muted-foreground mt-6">
                  {t('have_account')} <Link to="/login" className="text-primary hover:underline font-black">{t('login')}</Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-8 text-center">
                 {/* كود الـ OTP كما هو ... */}
                 <div className="flex justify-center mb-6">
                   <MailCheck size={48} className="text-primary animate-bounce" />
                 </div>
                 <h2 className="text-2xl font-black">تحقق من بريدك</h2>
                 <div className="flex justify-center py-4" dir="ltr">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup className="gap-3">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="h-16 w-12 text-2xl font-black rounded-2xl border-2 bg-muted/30 focus-within:border-primary transition-all border-transparent" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button type="submit" className="w-full h-16 rounded-[1.5rem] text-lg font-black shadow-xl" disabled={loading || otpCode.length < 6}>
                  تفعيل الحساب
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
