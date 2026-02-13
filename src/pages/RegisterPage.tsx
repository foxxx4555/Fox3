import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Truck, Package, MailCheck, RefreshCcw, ArrowRight, User, Phone, Lock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>('shipper');
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
    if (form.password !== form.confirmPassword) return toast.error('كلمة المرور غير متطابقة');
    setLoading(true);
    try {
      await api.registerUser(form.email, form.password, { full_name: form.full_name, phone: form.phone, role });
      toast.success('تم إرسال رمز التحقق بريدياً');
      setShowOtp(true);
      setTimer(60);
    } catch (err: any) { toast.error(err.message || t('error')); }
    finally { setLoading(false); }
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

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      await api.resendOtp(form.email);
      setTimer(60);
      toast.success('تم إعادة إرسال الرمز');
    } catch (err: any) { toast.error('فشل في إعادة الإرسال'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 relative overflow-hidden p-6 py-12">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xl mb-6">
            <img src="/logo.png" alt="SAS" className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">{showOtp ? 'تأكيد الهوية' : t('register')}</h1>
          <p className="text-muted-foreground font-medium mt-2">انضم إلى شبكة النقل الأكثر تطوراً في المملكة</p>
        </div>

        <Card className="shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)] border-white/50 bg-white/70 backdrop-blur-2xl rounded-[3rem] overflow-hidden">
          <CardContent className="p-8 md:p-12">
            {!showOtp ? (
              <>
                <div className="mb-10">
                  <Label className="mb-4 block text-center text-sm font-black uppercase tracking-widest text-muted-foreground">{t('register_as')}</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole('driver')}
                      className={cn(
                        "group flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all duration-300 relative overflow-hidden",
                        role === 'driver' ? "border-primary bg-primary text-white shadow-xl shadow-primary/20" : "border-muted-foreground/10 bg-white/50 hover:border-primary/50 text-muted-foreground"
                      )}
                    >
                      <Truck size={32} className={cn("transition-transform group-hover:scale-110", role === 'driver' ? 'text-white' : 'text-primary')} />
                      <span className="text-sm font-bold">{t('driver')}</span>
                      {role === 'driver' && <motion.div layoutId="activeRole" className="absolute bottom-0 left-0 right-0 h-1 bg-white/30" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('shipper')}
                      className={cn(
                        "group flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all duration-300 relative overflow-hidden",
                        role === 'shipper' ? "border-secondary bg-secondary text-white shadow-xl shadow-secondary/20" : "border-muted-foreground/10 bg-white/50 hover:border-primary/50 text-muted-foreground"
                      )}
                    >
                      <Package size={32} className={cn("transition-transform group-hover:scale-110", role === 'shipper' ? 'text-white' : 'text-secondary')} />
                      <span className="text-sm font-bold">{t('shipper')}</span>
                      {role === 'shipper' && <motion.div layoutId="activeRole" className="absolute bottom-0 left-0 right-0 h-1 bg-white/30" />}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase ms-2 text-muted-foreground">{t('full_name')}</Label>
                      <div className="relative group">
                        <User className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} />
                        <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} required className="ps-12 h-14 rounded-2xl border-transparent bg-muted/50 focus:bg-white focus:border-primary transition-all font-bold" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase ms-2 text-muted-foreground">{t('phone')}</Label>
                      <div className="relative group">
                        <Phone className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} />
                        <Input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} dir="ltr" className="ps-12 h-14 rounded-2xl border-transparent bg-muted/50 focus:bg-white focus:border-primary transition-all font-bold" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase ms-2 text-muted-foreground">{t('email')}</Label>
                    <div className="relative group">
                      <MailCheck className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} />
                      <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required dir="ltr" className="ps-12 h-14 rounded-2xl border-transparent bg-muted/50 focus:bg-white focus:border-primary transition-all font-bold" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase ms-2 text-muted-foreground">{t('password')}</Label>
                      <div className="relative group">
                        <Lock className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} />
                        <Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required dir="ltr" className="ps-12 h-14 rounded-2xl border-transparent bg-muted/50 focus:bg-white focus:border-primary transition-all font-bold" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase ms-2 text-muted-foreground">{t('confirm_password')}</Label>
                      <div className="relative group">
                        <Lock className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} />
                        <Input type="password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} required dir="ltr" className="ps-12 h-14 rounded-2xl border-transparent bg-muted/50 focus:bg-white focus:border-primary transition-all font-bold" />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-16 rounded-[1.5rem] mt-4 text-lg font-black bg-primary hover:bg-primary/95 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : t('register')}
                  </Button>

                  <p className="text-sm font-bold text-center text-muted-foreground mt-6">
                    {t('have_account')} <Link to="/login" className="text-primary hover:underline underline-offset-4 font-black">{t('login')}</Link>
                  </p>
                </form>
              </>
            ) : (
              <form onSubmit={handleVerify} className="space-y-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary animate-bounce">
                      <MailCheck size={48} />
                    </div>
                    <div className="absolute -inset-4 bg-primary/5 blur-2xl -z-10 rounded-full" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black">تحقق من بريدك</h2>
                  <p className="text-muted-foreground font-medium px-4">أرسلنا رمزاً مكوناً من 6 أرقام إلى العنوان:</p>
                  <p className="font-black text-primary dir-ltr text-lg">{form.email}</p>
                </div>

                <div className="flex justify-center py-4" dir="ltr">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup className="gap-3">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="h-16 w-12 text-2xl font-black rounded-2xl border-2 bg-muted/30 focus-within:border-primary focus-within:ring-0 transition-all border-transparent"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button type="submit" className="w-full h-16 rounded-[1.5rem] text-lg font-black shadow-xl shadow-primary/10" disabled={loading || otpCode.length < 6}>
                  {loading ? <Loader2 className="animate-spin mr-2" /> : "تفعيل الحساب"}
                </Button>

                <div className="flex flex-col gap-4 mt-8 pt-8 border-t border-border/50">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-sm font-bold gap-2 h-12 rounded-xl"
                    onClick={handleResendOtp}
                    disabled={loading || timer > 0}
                  >
                    {timer > 0 ? (
                      <span className="text-muted-foreground flex items-center gap-2">
                        <RefreshCcw size={16} className="animate-spin-slow" /> إعادة الإرسال بعد {timer} ثانية
                      </span>
                    ) : (
                      <><RefreshCcw size={18} /><span>إعادة إرسال الرمز</span></>
                    )}
                  </Button>
                  <Button type="button" variant="ghost" className="text-sm font-bold text-muted-foreground hover:text-primary gap-2" onClick={() => setShowOtp(false)}>
                    البحث عن خطأ؟ العودة للتعديل <ChevronRight size={18} />
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
