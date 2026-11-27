import { cn } from '../../utils/cn.js';

// Station-themed empty state — ink border, paper surface, condensed heading.

export const Empty = ({ icon: Icon, title, description, action, className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center gap-5 px-6 py-16 text-center',
      'border-2 border-dashed border-[#151320]/40 bg-[#fffaf0] fade-in',
      className,
    )}
  >
    {Icon && (
      <div className="border-2 border-[#151320]/30 bg-[#f3e9d2] p-4 text-[#4a4458]">
        <Icon size={26} strokeWidth={1.5} />
      </div>
    )}
    <div className="max-w-sm space-y-2">
      <div
        className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[18px] font-black uppercase tracking-[0.06em] text-[#151320]"
      >
        {title}
      </div>
      {description && (
        <p className="text-[13px] leading-relaxed text-[#4a4458]">{description}</p>
      )}
    </div>
    {action && <div className="mt-2">{action}</div>}
  </div>
);
