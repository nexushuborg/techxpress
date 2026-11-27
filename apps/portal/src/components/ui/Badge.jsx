import { cn } from '../../utils/cn.js';

// Tonal pill for statuses — station paper-theatre aesthetic.
// Each tone maps to an ink/paper/status colour on the parchment surface.
// Use `dot` to render a small leading status dot.

const TONE = {
  cyan: 'border-[#c8235f]/50 text-[#c8235f] bg-[#fce7ef]',          // pink = primary signal
  live: 'border-[#0b6e43]/40 text-[#0b6e43] bg-[#e6f4ee]',         // green = live / good
  warn: 'border-[#b45309]/40 text-[#b45309] bg-[#fef3e2]',         // amber = warning
  crit: 'border-[#b8102a]/40 text-[#b8102a] bg-[#fde8ea]',         // red = critical
  dim:  'border-[#151320]/30 text-[#4a4458] bg-[#f3e9d2]',         // parchment dim
};

const DOT = {
  cyan: 'bg-[#c8235f]',
  live: 'bg-[#0b6e43]',
  warn: 'bg-[#b45309]',
  crit: 'bg-[#b8102a]',
  dim:  'bg-[#4a4458]',
};

export const Badge = ({ tone = 'dim', dot, children, className }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 border-2 px-2 py-0.5",
      "font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[11px] font-bold uppercase tracking-[0.16em]",
      TONE[tone],
      className,
    )}
  >
    {dot && <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', DOT[tone])} />}
    {children}
  </span>
);
