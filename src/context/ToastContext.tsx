import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const styles = {
              success: {
                wrap: 'bg-slate-900/95 text-white border-emerald-500/40 shadow-[0_12px_32px_-8px_rgba(16,185,129,0.28)]',
                iconColor: 'text-emerald-400',
                Icon: CheckCircle2,
              },
              error: {
                wrap: 'bg-rose-950/95 text-white border-rose-500/40 shadow-[0_12px_32px_-8px_rgba(244,63,94,0.32)]',
                iconColor: 'text-rose-400',
                Icon: AlertCircle,
              },
              warning: {
                wrap: 'bg-amber-950/95 text-white border-amber-500/40 shadow-[0_12px_32px_-8px_rgba(245,158,11,0.28)]',
                iconColor: 'text-amber-400',
                Icon: AlertTriangle,
              },
              info: {
                wrap: 'bg-slate-900/95 text-white border-indigo-500/40 shadow-[0_12px_32px_-8px_rgba(79,70,229,0.28)]',
                iconColor: 'text-indigo-400',
                Icon: Info,
              },
            }[toast.type];

            const IconComp = styles.Icon;

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                role="status"
                className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl border backdrop-blur-md text-xs font-medium transition-all ${styles.wrap}`}
              >
                <IconComp className={`w-4 h-4 shrink-0 mt-0.5 ${styles.iconColor}`} />
                <span className="flex-1 leading-relaxed">{toast.message}</span>
                <button
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="text-slate-400 hover:text-white transition-colors rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
