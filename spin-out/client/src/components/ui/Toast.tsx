import { useEffect } from 'react';
import type { ToastItem } from '../../store/uiStore';

const colors = {
  success: 'border-emerald-400/40 bg-emerald-500/15',
  error: 'border-red-400/40 bg-red-500/15',
  info: 'border-sky-400/40 bg-sky-500/15'
};

const Toast = ({ toast, onClose }: { toast: ToastItem; onClose: () => void }) => {
  useEffect(() => {
    const timeout = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timeout);
  }, [onClose]);

  return (
    <div className={`glass-card flex items-center justify-between rounded-2xl border px-4 py-3 ${colors[toast.type]}`}>
      <span>{toast.message}</span>
      <button onClick={onClose}>✕</button>
    </div>
  );
};

export default Toast;
