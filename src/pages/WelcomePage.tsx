import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Truck, Shield, zap, Globe } from 'lucide-react';

export default function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0c10] flex flex-col items-center justify-center p-6">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.15),transparent_50%)]" />
      <div className="absolute -top-24 -start-24 w-96 h-96 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute -bottom-24 -end-24 w-96 h-96 bg-accent/20 blur-[120px] rounded-full animate-pulse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-center z-10 max-w-4xl relative"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-blue-600 rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-8 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Truck className="text-white w-12 h-12" />
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight">
            SAS <span className="text-primary">Transport</span>
          </h1>

          <p className="text-2xl md:text-3xl font-bold text-slate-300 mb-4 px-4">
            {t('welcome_subtitle')}
          </p>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            {t('welcome_desc')}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {[
            { icon: <Shield className="text-primary" />, text: "آمن وموثوق" },
            { icon: <zap className="text-amber-400" />, text: "سرعة فائقة" },
            { icon: <Globe className="text-emerald-400" />, text: "تغطية شاملة" },
            { icon: <Truck className="text-primary" />, text: "أسطول ضخم" },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-3xl flex flex-col items-center gap-2">
              <div className="p-2 bg-white/5 rounded-xl">{item.icon}</div>
              <span className="text-sm font-bold text-slate-300">{item.text}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto"
        >
          <Button
            onClick={() => navigate('/login')}
            className="w-full sm:flex-1 h-16 text-xl font-black bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {t('login')}
          </Button>
          <Button
            onClick={() => navigate('/register')}
            variant="outline"
            className="w-full sm:flex-1 h-16 text-xl font-bold border-2 border-white/10 text-white bg-white/5 hover:bg-white/10 rounded-[1.5rem] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {t('register')}
          </Button>
        </motion.div>
      </motion.div>

      {/* Footer Branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        className="absolute bottom-10 text-slate-500 font-bold tracking-widest uppercase text-xs"
      >
        World Class Logistics Platform
      </motion.div>
    </div>
  );
}
