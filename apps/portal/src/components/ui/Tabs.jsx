import { cn } from '../../utils/cn.js';

// Station-themed horizontal tab strip. Barlow Condensed uppercase labels,
// ink border bottom indicator on active tab.

export const Tabs = ({ value, onChange, items, className }) => (
  <div
    className={cn(
      'flex justify-start overflow-x-auto flex-nowrap gap-0 no-scrollbar',
      'border-b-2 border-[#151320]',
      className,
    )}
  >
    {items.map((item) => {
      const active = value === item.value;
      return (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            "relative flex items-center gap-2 px-5 py-3 transition-colors duration-150",
            "font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[14px] font-bold uppercase tracking-[0.12em]",
            active
              ? 'text-[#c8235f] bg-[#fffaf0]'
              : 'text-[#4a4458] bg-transparent hover:text-[#151320] hover:bg-[#f3e9d2]',
          )}
        >
          {item.icon && <item.icon size={15} />}
          <span>{item.label}</span>
          {item.badge != null && (
            <span
              className={cn(
                'px-1.5 py-0 font-mono text-[10px] font-bold border',
                active
                  ? 'bg-[#fce7ef] text-[#c8235f] border-[#c8235f]/40'
                  : 'bg-[#f3e9d2] text-[#4a4458] border-[#151320]/25',
              )}
            >
              {item.badge}
            </span>
          )}
          {active && (
            <span className="absolute inset-x-0 -bottom-[2px] h-[3px] bg-[#c8235f]" />
          )}
        </button>
      );
    })}
  </div>
);
