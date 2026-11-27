import { useMemo, useState } from 'react';
import { KeyRound, Search, Copy, ShieldCheck, Gavel, UserCog } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { StatTile } from '../../components/ui/StatTile.jsx';
import { formatRelative, titleCase } from '../../utils/format.js';

// Admin → Staff: jury, coordinators and admins with their login codes, so an
// admin can hand credentials over in person or by message. Read-only: codes
// are created by the seed script and never change here.

const ROLES = ['', 'ADMIN', 'COORDINATOR', 'JURY'];
const ROLE_TONE = { ADMIN: 'crit', COORDINATOR: 'warn', JURY: 'cyan' };

const Th = ({ children }) => (
  <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
    {children}
  </th>
);

export const AdminStaffPage = () => {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const { data, loading, error } = useApi(() => api.get('/api/admin/staff'), []);

  const staff = useMemo(() => data?.staff ?? [], [data]);
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return staff.filter((s) =>
      (!role || s.role === role) &&
      (!needle || [s.fullName, s.email, s.institution?.name].some((v) => v?.toLowerCase().includes(needle))));
  }, [staff, q, role]);

  const counts = useMemo(() => ({
    ADMIN: staff.filter((s) => s.role === 'ADMIN').length,
    COORDINATOR: staff.filter((s) => s.role === 'COORDINATOR').length,
    JURY: staff.filter((s) => s.role === 'JURY').length,
  }), [staff]);

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied.`);
    } catch {
      toast.warn('Copy failed — select and copy manually.');
    }
  };

  const loginUrl = `${window.location.origin}/login`;
  const handover = (s) => `Vortex login\n${loginUrl}\nEmail: ${s.email}\nPassword: ${s.password}`;

  return (
    <>
      <PageHeader
        kicker="Access"
        title="Staff"
        description="Login details for jury, coordinators and admins. Share each person's own details with them directly, and keep this page off shared screens."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile icon={ShieldCheck} label="Admins" value={counts.ADMIN} />
        <StatTile icon={UserCog} label="Coordinators" value={counts.COORDINATOR} />
        <StatTile icon={Gavel} label="Jury" value={counts.JURY} />
      </div>

      <div className="mb-8 grid gap-3 rounded-none border border-white/5 bg-[#050505] p-4 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            className="input-glass !h-11 !pl-10"
            placeholder="Search name, email or institution"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="select-glass !h-11" value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((r) => <option key={r || 'all'} value={r}>{r ? titleCase(r) : 'All roles'}</option>)}
        </select>
      </div>

      {loading && <CardSkeleton rows={4} />}

      {!loading && error && (
        <Empty icon={KeyRound} title="Could not load staff" description={error.message} />
      )}

      {!loading && !error && visible.length === 0 && (
        <Empty
          icon={KeyRound}
          title={staff.length ? 'No staff match these filters' : 'No staff accounts yet'}
          description={staff.length ? 'Clear the search or role filter.' : 'Staff accounts are created by the seed script from the staff list.'}
        />
      )}

      {!loading && visible.length > 0 && (
        <div className="overflow-hidden rounded-none border border-white/5 bg-black">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] md:min-w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <Th>Name</Th>
                  <Th>Role</Th>
                  <Th>Institution</Th>
                  <Th>Email</Th>
                  <Th>Password</Th>
                  <Th>Last login</Th>
                  <Th><span className="sr-only">Actions</span></Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 align-middle last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-sans text-[13px] text-text-primary">{s.fullName}</td>
                    <td className="px-4 py-3"><Badge tone={ROLE_TONE[s.role] ?? 'dim'}>{titleCase(s.role)}</Badge></td>
                    <td className="px-4 py-3 font-mono text-[11px] text-text-secondary">{s.institution?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-text-primary">{s.email}</td>
                    <td className="px-4 py-3 font-mono text-[13px] font-bold tracking-[0.12em] text-accent-cyan">
                      {s.password ?? <span className="font-normal tracking-normal text-white/30">not set</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-text-secondary">
                      {s.lastLoginAt ? formatRelative(s.lastLoginAt) : 'never'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.password && (
                        <div className="flex justify-end gap-2">
                          <button className="ghost-button inline-flex items-center gap-1.5 !px-3 !py-1.5 text-[11px]" onClick={() => copy(s.password, 'Password')}>
                            <Copy size={12} /> Password
                          </button>
                          <button className="ghost-button inline-flex items-center gap-1.5 !px-3 !py-1.5 text-[11px]" onClick={() => copy(handover(s), 'Login details')}>
                            <Copy size={12} /> Login details
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};
