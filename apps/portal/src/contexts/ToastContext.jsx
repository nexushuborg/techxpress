import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../utils/cn.js';

const ToastContext = createContext(null);

let nextId = 1;

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  warn:    AlertTriangle,
  info:    Info,
};

// Station theme: left border accent strip, paper background, ink text.
const TONE = {
  success: { border: 'border-l-4 border-l-[#0b6e43] border-[#0b6e43]/30', icon: 'text-[#0b6e43]' },
  error:   { border: 'border-l-4 border-l-[#b8102a] border-[#b8102a]/30', icon: 'text-[#b8102a]' },
  warn:    { border: 'border-l-4 border-l-[#b45309] border-[#b45309]/30', icon: 'text-[#b45309]' },
  info:    { border: 'border-l-4 border-l-[#c8235f] border-[#c8235f]/30', icon: 'text-[#c8235f]' },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const push = useCallback((tone, message, opts = {}) => {
    const id = nextId++;
    const ttl = opts.ttl ?? (tone === 'error' ? 6500 : 4000);
    setToasts((t) => [...t, { id, tone, message, title: opts.title }]);
    timers.current.set(id, setTimeout(() => dismiss(id), ttl));
    return id;
  }, [dismiss]);

  useEffect(() => () => { for (const t of timers.current.values()) clearTimeout(t); }, []);

  const value = {
    success: (msg, opts) => push('success', msg, opts),
    error:   (msg, opts) => push('error',   msg, opts),
    warn:    (msg, opts) => push('warn',    msg, opts),
    info:    (msg, opts) => push('info',    msg, opts),
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[1000] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICONS[t.tone];
          const toneStyle = TONE[t.tone];
          return (
            <div
              key={t.id}
              className={cn(
                'fade-in flex items-start gap-3 border-2 bg-[#fffaf0] p-3 pr-2',
                'shadow-[0_3px_0_#151320]',
                toneStyle.border,
              )}
              role="status"
            >
              <Icon size={18} className={cn('mt-0.5 shrink-0', toneStyle.icon)} />
              <div className="flex-1 text-[#151320]">
                {t.title && (
                  <div
                    className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[11px] uppercase tracking-[0.18em] text-[#4a4458] mb-0.5"
                  >
                    {t.title}
                  </div>
                )}
                <div className="font-mono text-[13px] leading-snug text-[#151320]">{t.message}</div>
              </div>
              <button
                aria-label="Dismiss"
                onClick={() => dismiss(t.id)}
                className="rounded p-1 text-[#4a4458] hover:text-[#151320] hover:bg-[#f3e9d2]"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast outside ToastProvider');
  return ctx;
};
