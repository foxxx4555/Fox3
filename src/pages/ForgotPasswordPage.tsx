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
} from "@/components/ui/select"; // تأكد من وجود هذا المكون
import { toast } from 'sonner';
import { Loader2, Truck, MailCheck, User, Phone, Lock, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserRole } from '@/types';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // جعل الحالة الافتراضية فارغة لإجبار المستخدم على الاختيار
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
    
    if (!role) {
      toast.error('يرجى تحديد نوع الحساب أولاً');
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
      setShowOtp(true);
      setTimer(60);
      toast.success('تم إرسال رمز التحقق');
    } catch (err: any) { 
      toast.error(err.message || t('error')); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.verifyEmailOtp(form.email, otpCode);
      toast.success('تم تفعيل الحساب!');
      navigate('/login');
    } catch (err: any) { toast.error('رمز غير صحيح'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 relative overflow-hidden p-6 py-12">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl relative z-10">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xl mb-6">
            <Truck className="text-primary w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">{showOtp ? 'تأكيد الهوية' : 'إنشاء حساب جديد'}</h1>
        </div>

        <Card className="shadow-2xl border-white/50 bg-white/80 backdrop-blur-2xl rounded-[3rem] overflow-hidden">
          <CardContent className="p-8 md:p-12">
            {!showOtp ? (
              <form onSubmit={handleRegister} className="space-y-6">
                
                {/* قائمة الاختيار (بشكل يشبه حقول المدينة في سكرين 0214) */}
                <div className="space-y-2">
                  <Label className="text-sm font-black text-slate-700 ms-1">سجل حسابك كـ *</Label>
                  <Select onValueChange={(val) => setRole(val as UserRole)} value={role}>
                    <SelectTrigger className="w-full h-14 rounded-2xl border-2 border-slate-100 bg-white shadow-sm font-bold text-lg px-6 flex-row-reverse text-right focus:border-primary transition-all">
                      <SelectValue placeholder="اختر: أنت سائق أم صاحب شاحنة؟" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="driver" className="h-12 font-bold cursor-pointer">ناقل / سائق</SelectItem>
                      <SelectItem value="shipper" className="h-12 font-bold cursor-pointer">شاحن / صاحب بضاعة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-muted-foreground ms-1">الاسم الكامل</Label>
                    <div className="relative group">
                      <User className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} required className="ps-12 h-14 rounded-2xl border-transparent bg-muted/50 focus:bg-white transition-all font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-muted-foreground ms-1">رقم الجوال</Label>
                    <div className="relative group">
                      <Phone className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} dir="ltr" className="ps-12 h-14 rounded-2xl border-transparent bg-muted/50 focus:bg-white transition-all font-bold" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-muted-foreground ms-1">البريد الإلكتروني</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required className="h-14 rounded-2xl border-transparent bg-muted/50 focus:bg-white transition-all font-bold" dir="ltr" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-muted-foreground ms-1">كلمة المرور</Label>
                    <Input type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required className="h-14 rounded-2xl border-transparent bg-muted/50 focus:bg-white transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-muted-foreground ms-1">تأكيد كلمة المرور</Label>
                    <Input type="password" value={form.confirmPassword} onChange={e => setForm(p => ({...p, confirmPassword: e.target.value}))} required className="h-14 rounded-2xl border-transparent bg-muted/50 focus:bg-white transition-all font-bold" />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !role} // لا يعمل الزر إلا إذا تم اختيار نوع الحساب
                  className={cn(
                    "w-full h-16 rounded-[1.5rem] mt-4 text-xl font-black transition-all",
                    !role ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-primary hover:bg-primary/95 text-white shadow-xl shadow-primary/20"
                  )}
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'إنشاء حساب'}
                </Button>

                <p className="text-sm font-bold text-center text-muted-foreground mt-6">
                  لديك حساب؟ <Link to="/login" className="text-primary hover:underline font-black">تسجيل الدخول</Link>
                </p>
              </form>
            ) : (
              // قسم الـ OTP يبقى كما هو...
              <div className="text-center space-y-6">
                 <MailCheck size={48} className="text-primary mx-auto animate-bounce" />
                 <h2 className="text-xl font-black">أدخل رمز التحقق</h2>
                 <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup className="gap-3 justify-center">
                       {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} className="h-14 w-11 rounded-xl bg-muted" />)}
                    </InputOTPGroup>
                 </InputOTP>
                 <Button onClick={handleVerify} className="w-full h-14 rounded-2xl font-black text-lg">تفعيل</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// دالة مساعدة لتجنب أخطاء التصميم
function cn(...inputs: any) { return inputs.filter(Boolean).join(" "); }
