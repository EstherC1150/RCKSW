'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
} from 'lucide-react';
import { useAlertStore, AlertType } from '@/app/stores/alertStore';

const iconMap: Record<AlertType, React.ReactNode> = {
  success: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
  error: <XCircle className="w-8 h-8 text-rose-400" />,
  warning: <AlertTriangle className="w-8 h-8 text-amber-400" />,
  info: <Info className="w-8 h-8 text-sky-400" />,
};

const toastIconMap: Record<AlertType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
  error: <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />,
  info: <Info className="w-5 h-5 text-sky-400 flex-shrink-0" />,
};

const headerBgMap: Record<AlertType, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  error: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  info: 'bg-sky-500/15 text-sky-400 border border-sky-500/20',
};

export const CustomAlertModal: React.FC = () => {
  const {
    isOpen,
    mode,
    type,
    title,
    message,
    confirmText,
    cancelText,
    closeModal,
    toasts,
    removeToast,
  } = useAlertStore();

  // 기존 브라우저 window.alert()을 커스텀 모달로 자동 대체
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalAlert = window.alert;

    window.alert = (msg?: any) => {
      useAlertStore.getState().showAlert(String(msg ?? ''), {
        title: '알림',
        type: 'info',
      });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  return (
    <>
      {/* 1. 커스텀 Alert / Confirm 모달 */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop Layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => closeModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Dialog (다크 글래스모피즘 테마) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              className="relative w-full max-w-sm overflow-hidden bg-[#0f172a]/95 backdrop-blur-xl rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border border-slate-700/60 text-slate-100"
            >
              {/* Header Icon & Title */}
              <div className="p-6 text-center">
                <div
                  className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner ${headerBgMap[type]}`}
                >
                  {iconMap[type]}
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {title}
                </h3>
                <p className="mt-2.5 text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 p-4 bg-slate-900/60 border-t border-slate-800/80">
                {mode === 'confirm' && (
                  <button
                    type="button"
                    onClick={() => closeModal(false)}
                    className="w-full px-4 py-2.5 text-sm font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all focus:outline-none"
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => closeModal(true)}
                  className={`w-full px-4 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 focus:outline-none ${
                    type === 'error'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30'
                      : type === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/30'
                      : type === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                      : 'bg-sky-600 hover:bg-sky-500 shadow-sky-900/30'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Toast 메시지 (화면 우측 상단) */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-xs w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-center gap-3 p-3.5 bg-[#0f172a]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700/60 text-sm text-slate-200"
            >
              {toastIconMap[t.type]}
              <span className="flex-1 font-medium leading-snug">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};
