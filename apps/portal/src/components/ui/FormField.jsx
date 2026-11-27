import { cn } from '../../utils/cn.js';

// Station-themed labelled form field.
// Label: Barlow Condensed uppercase, ink colour.
// Error: red-ink. Hint: muted ink.

export const FormField = ({ label, hint, error, required, children, className, field }) => (
  <label
    className={cn('flex flex-col gap-2', className)}
    data-field={field}
    data-invalid={error ? 'true' : undefined}
  >
    <span
      className="flex min-h-[18px] items-center gap-1.5 font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[13px] font-bold uppercase tracking-[0.16em] text-[#151320]"
    >
      <span>{label}</span>
      {required && (
        <span
          aria-hidden="true"
          className="text-[14px] font-extrabold leading-none text-[#b8102a]"
        >
          *
        </span>
      )}
    </span>
    {children}
    {(error || hint) && (
      <span
        className={cn(
          'px-0.5 font-mono text-[11px] leading-relaxed',
          error ? 'text-[#b8102a]' : 'text-[#4a4458]',
        )}
      >
        {error ?? hint}
      </span>
    )}
  </label>
);
