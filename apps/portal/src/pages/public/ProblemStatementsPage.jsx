import { useMemo, useState } from 'react';
import { FileText, Search, ChevronDown, X } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { cn } from '../../utils/cn.js';
import { THEMES, OTHER, themeForDomain } from '../../lib/themes.js';

// Problem statements grouped into themes (lib/themes.js) instead of one
// section per domain (29 domains × 1 statement made the page endlessly long).

const themeOf = (ps) => themeForDomain(ps.domain?.name);

export const ProblemStatementsPage = () => {
  const { data, loading, error } = useApi(() => api.get('/api/taxonomy/problem-statements'), []);
  const [search, setSearch] = useState('');
  const [themeId, setThemeId] = useState('');
  const [domainId, setDomainId] = useState('');
  const [openedIds, setOpenedIds] = useState(() => new Set());
  const [closedWhileFiltering, setClosedWhileFiltering] = useState(() => new Set());

  const all = useMemo(() => data?.problemStatements ?? [], [data]);

  const domains = useMemo(() => {
    const map = new Map();
    for (const ps of all) if (ps.domain) map.set(ps.domain.id, ps.domain);
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);

  const themeCounts = useMemo(() => {
    const counts = new Map();
    for (const ps of all) counts.set(themeOf(ps).id, (counts.get(themeOf(ps).id) ?? 0) + 1);
    return counts;
  }, [all]);
  const themes = [...THEMES, OTHER].filter((t) => themeCounts.get(t.id));

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return all.filter((ps) =>
      (!themeId || themeOf(ps).id === themeId) &&
      (!domainId || ps.domain?.id === domainId) &&
      (!needle || [ps.title, ps.description, ps.domain?.name].filter(Boolean).some((v) => v.toLowerCase().includes(needle))),
    );
  }, [all, search, themeId, domainId]);

  const groups = useMemo(() => {
    const byTheme = new Map();
    for (const ps of filtered) {
      const t = themeOf(ps);
      if (!byTheme.has(t.id)) byTheme.set(t.id, { theme: t, items: [] });
      byTheme.get(t.id).items.push(ps);
    }
    return [...THEMES, OTHER]
      .filter((t) => byTheme.has(t.id))
      .map((t) => {
        const g = byTheme.get(t.id);
        g.items.sort((a, b) => (a.domain?.name ?? '').localeCompare(b.domain?.name ?? '') || a.title.localeCompare(b.title));
        return g;
      });
  }, [filtered]);

  const hasFilters = !!(search || themeId || domainId);
  const clearFilters = () => { setSearch(''); setThemeId(''); setDomainId(''); };
  const flip = (prev, id) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  };
  const isOpen = (id) => (hasFilters ? !closedWhileFiltering.has(id) : openedIds.has(id));
  const toggle = (id) => (hasFilters
    ? setClosedWhileFiltering((prev) => flip(prev, id))
    : setOpenedIds((prev) => flip(prev, id)));

  return (
    <section className="txp-station-app mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <PageHeader
        kicker="Challenge Catalogue"
        title="Problem Statements"
        description="Each team picks one problem statement from its domain when forming the team. Browse by theme, or search."
      />

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} rows={3} />)}
        </div>
      )}
      {error && <Empty icon={FileText} title="Couldn't load" description={error.message} />}

      {data && all.length === 0 && (
        <Empty icon={FileText} title="No problem statements" description="Organizers will publish them shortly." />
      )}

      {all.length > 0 && (
        <>
          {/* Theme chips */}
          <div className="mb-5 flex flex-wrap gap-2">
            <Chip active={!themeId} onClick={() => setThemeId('')} label="All themes" count={all.length} />
            {themes.map((t) => (
              <Chip
                key={t.id}
                icon={t.icon}
                active={themeId === t.id}
                onClick={() => setThemeId(themeId === t.id ? '' : t.id)}
                label={t.label}
                count={themeCounts.get(t.id)}
              />
            ))}
          </div>

          {/* Search + domain filter */}
          <div className="mb-6 grid gap-3 border-2 border-[#151320] bg-[#f3e9d2] p-4 shadow-[0_3px_0_#151320] md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4458]" />
              <input
                className="input-glass !pl-10"
                placeholder="Search titles, descriptions, domains…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="select-glass md:!w-64" value={domainId} onChange={(e) => setDomainId(e.target.value)}>
              <option value="">All domains</option>
              {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="mb-4 flex items-center justify-between font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[12px] font-bold uppercase tracking-[0.18em] text-[#4a4458]">
            <span>{filtered.length} of {all.length} statements · {groups.length} {groups.length === 1 ? 'theme' : 'themes'}</span>
            {hasFilters && (
              <button className="inline-flex items-center gap-1 text-[#a81f55] hover:text-[#151320]" onClick={clearFilters}>
                <X size={12} /> Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 && (
            <Empty
              icon={Search}
              title="No matches"
              description="No problem statement matches these filters."
              action={<button className="ghost-button" onClick={clearFilters}>Clear filters</button>}
            />
          )}

          <div className="space-y-5">
            {groups.map(({ theme, items }) => {
              const isCollapsed = !isOpen(theme.id);
              const Icon = theme.icon;
              const domainCount = new Set(items.map((ps) => ps.domain?.id)).size;
              return (
                <section key={theme.id} className="border-2 border-[#151320] bg-[#fffaf0] shadow-[0_3px_0_#151320]">
                  <button
                    type="button"
                    onClick={() => toggle(theme.id)}
                    aria-expanded={!isCollapsed}
                    className="flex w-full items-center justify-between gap-3 border-b-2 border-[#151320]/15 bg-[#f3e9d2] px-5 py-4 text-left transition-colors hover:bg-[#e6d5b0]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon size={16} className="shrink-0 text-[#c8235f]" />
                      <h2 className="truncate font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[18px] font-black uppercase tracking-[0.06em] text-[#151320]">
                        {theme.label}
                      </h2>
                      <Badge tone="dim">{items.length} {items.length === 1 ? 'statement' : 'statements'}</Badge>
                      <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[#4a4458] sm:inline">
                        {domainCount} {domainCount === 1 ? 'domain' : 'domains'}
                      </span>
                    </div>
                    <ChevronDown size={16} className={cn('shrink-0 text-[#151320] transition-transform', isCollapsed && '-rotate-90')} />
                  </button>
                  {!isCollapsed && (
                    <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                      {items.map((ps) => <StatementCard key={ps.id} ps={ps} />)}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};

const Chip = ({ active, onClick, label, count, icon: Icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-2 rounded-[3px] border-2 px-3.5 py-2 font-mono text-[11px] font-bold transition-all',
      active
        ? 'border-[#151320] bg-[#151320] text-[#f3e9d2] shadow-[0_2px_0_#000]'
        : 'border-[#151320]/40 bg-[#fffaf0] text-[#151320] hover:border-[#151320] hover:bg-[#f3e9d2]',
    )}
  >
    {Icon && <Icon size={12} />}
    <span>{label}</span>
    <span className={cn('rounded-sm px-1.5 text-[10px] font-bold', active ? 'bg-[#f5b800] text-[#151320]' : 'bg-[#e6d5b0] text-[#151320]')}>
      {count}
    </span>
  </button>
);

const StatementCard = ({ ps }) => {
  const [expanded, setExpanded] = useState(false);
  const long = (ps.description?.length ?? 0) > 160;
  return (
    <article className="flex flex-col gap-2.5 border-2 border-[#151320] bg-[#fffaf0] p-4 shadow-[0_2px_0_#151320] transition-colors hover:bg-white">
      <Badge tone="cyan" className="self-start">
        {ps.domain?.name ?? 'Unassigned'}
      </Badge>
      <h3 className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[16px] font-black uppercase leading-snug text-[#151320]">
        {ps.title}
      </h3>
      {ps.description && (
        <p className={cn('font-mono text-[12px] leading-relaxed text-[#4a4458]', !expanded && 'line-clamp-4')}>
          {ps.description}
        </p>
      )}
      {long && (
        <button
          className="self-start font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[12px] font-bold uppercase tracking-[0.1em] text-[#a81f55] hover:text-[#151320]"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </article>
  );
};
