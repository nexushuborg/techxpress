import { cn } from '../../utils/cn.js';

// Station-themed page title header.
// Kicker: Barlow Condensed uppercase, pink-ink colour.
// Title: Barlow Condensed large, ink colour.
// Description: system-ui body text, muted ink.

export const PageHeader = ({ kicker, title, description, actions, className }) => (
  <header
    className={cn(
      'mb-10 flex flex-col gap-5 border-b-2 border-[#151320] pb-7',
      'md:flex-row md:items-end md:justify-between fade-in',
      className,
    )}
  >
    <div className="flex-1 min-w-0 space-y-2">
      {kicker && (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-[#c8235f] rounded-full" />
          <span
            className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[12px] font-bold uppercase tracking-[0.22em] text-[#a81f55]"
          >
            {kicker}
          </span>
        </div>
      )}
      <h1
        className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[36px] md:text-[48px] font-black leading-[1] tracking-[0.02em] uppercase text-[#151320]"
      >
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-[14px] leading-relaxed text-[#4a4458]">
          {description}
        </p>
      )}
    </div>
    {actions && (
      <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">{actions}</div>
    )}
  </header>
);
