import { useMemo } from 'react';
import { cn } from '../../utils/cn.js';

// Registration "Preferred Domain" picker, styled like the Contribution Areas
// pills: one wrapping row, alphabetical. Picked pills show their order (#1 is
// the primary domain); after `max` picks the rest are disabled.
//
// Props: domains [{ id, name }], value [domainId] (ordered), max, onToggle(id), variant ('dark' | 'station')
export const DomainPicker = ({ domains, value, max = 4, onToggle, variant = 'dark' }) => {
  const sorted = useMemo(() => [...domains].sort((a, b) => a.name.localeCompare(b.name)), [domains]);
  const full = value.length >= max;

  if (variant === 'station') {
    return (
      <div className="reg-pill-grid">
        {sorted.map((d) => {
          const rank = value.indexOf(d.id);
          const active = rank !== -1;
          const disabled = !active && full;
          return (
            <button
              key={d.id}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onToggle(d.id)}
              title={disabled ? `You've picked ${max}. Remove one to choose another.` : undefined}
              className={`reg-pill${active ? ' active' : ''}`}
            >
              <span>{d.name}</span>
              {active ? <span className="pill-rank">#{rank + 1}</span> : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2.5 md:gap-3">
      {sorted.map((d) => {
        const rank = value.indexOf(d.id);
        const active = rank !== -1;
        const disabled = !active && full;
        return (
          <button
            key={d.id}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onToggle(d.id)}
            title={disabled ? `You've picked ${max}. Remove one to choose another.` : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-left font-mono text-[11px] leading-none transition-all',
              'disabled:cursor-not-allowed disabled:opacity-40',
              active
                ? 'border-white bg-white text-black shadow-[0_0_0_1px_rgba(255,255,255,0.12)]'
                : 'border-white/12 bg-white/[0.03] text-white/78 hover:border-white/30 hover:bg-white/[0.05]',
            )}
          >
            <span>{d.name}</span>
            {active ? (
              <span className="shrink-0 rounded-full bg-black/10 px-1.5 py-0.5 text-[9px] font-bold text-black/70">#{rank + 1}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};
