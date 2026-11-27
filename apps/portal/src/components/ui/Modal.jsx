import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

// Station-themed modal — paper surface, ink borders, 3-D box-shadow.
// Backdrop click + Escape to dismiss. Renders into document.body.

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal = ({ open, onClose, title, children, size = 'md', footer }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center px-4 py-8 backdrop-blur-sm fade-in"
      style={{ backgroundColor: 'rgba(21,19,32,0.55)' }}
      onClick={onClose}
    >
      <div
        className={cn(
          'relative flex w-full max-h-[88vh] flex-col',
          'bg-[#fffaf0] border-2 border-[#151320] shadow-[0_6px_0_#151320,0_18px_40px_rgba(21,19,32,0.35)]',
          SIZES[size],
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .35 0 0 0 0 .25 0 0 0 0 .1 0 0 0 .09 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")`,
          animation: 'fadeIn 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#151320] px-6 py-4 bg-[#f3e9d2]">
          <h3
            className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[18px] font-black uppercase tracking-[0.06em] text-[#151320]"
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-[#4a4458] hover:text-[#151320] hover:bg-[#e6d5b0] transition-colors duration-150"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 text-[#151320]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t-2 border-[#151320] px-6 py-4 bg-[#f3e9d2]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
