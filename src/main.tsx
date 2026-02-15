import { createRoot } from "react-dom/client";
import '@/i18n';
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('✅ تم تفعيل نظام العمل في الخلفية', reg);
    }).catch(err => {
      console.log('❌ فشل تفعيل نظام الخلفية', err);
    });
  });
}
