import { useMemo, useState } from 'react';
import {
  Users, Plus, UserPlus, Send, ShieldCheck, AlertTriangle, LogOut,
  UserMinus, Crown, Search, CheckCircle2, XCircle, ListChecks,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { confirm } from '../../components/ui/Confirm.jsx';
import { issueLabel, formatRelative } from '../../utils/format.js';
import { TeamChat } from '../../components/team/TeamChat.jsx';
import { normalizeRegistrationNo } from '../../utils/registrationNo.js';

// ── Shared style tokens ───────────────────────────────────────────────────

const CARD = 'bg-[#fffaf0] border-2 border-[#151320] shadow-[0_3px_0_#151320] p-5';
const CARD_FLAT = 'bg-[#fffaf0] border-2 border-[#151320] p-4';
const COMPACT_BTN = 'inline-flex items-center gap-1.5 !px-3 !py-1.5 !text-[12px] disabled:opacity-60';
const SECTION_LABEL = "font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[12px] font-black uppercase tracking-[0.2em] text-[#4a4458]";

// ── Status banner ─────────────────────────────────────────────────────────

const StatusBanner = ({ status, issues }) => {
  if (status === 'DISQUALIFIED') {
    return (
      <div className="flex items-center gap-3 border-2 border-[#b8102a] bg-[#fde8ea] px-4 py-3">
        <XCircle size={16} className="text-[#b8102a] shrink-0" />
        <div className="font-mono text-[12px] text-[#b8102a]">
          This team has been disqualified by the organizers. Contact them if you think this is a mistake.
        </div>
      </div>
    );
  }
  if (status === 'FINALIZED') {
    return (
      <div className="flex items-center gap-3 border-2 border-[#0b6e43] bg-[#e6f4ee] px-4 py-3">
        <ShieldCheck size={16} className="text-[#0b6e43] shrink-0" />
        <div className="font-mono text-[12px] text-[#0b6e43]">Team finalized — no further changes.</div>
      </div>
    );
  }
  if (status === 'QUALIFIED') {
    return (
      <div className="flex items-center gap-3 border-2 border-[#0b6e43] bg-[#e6f4ee] px-4 py-3">
        <CheckCircle2 size={16} className="text-[#0b6e43] shrink-0" />
        <div className="font-mono text-[12px] text-[#0b6e43]">All rules met — leader can finalize.</div>
      </div>
    );
  }
  // FORMING or any other
  return (
    <div className="border-2 border-[#b45309]/50 bg-[#fef3e2] px-4 py-3 space-y-2">
      <div className="flex items-center gap-3">
        <AlertTriangle size={16} className="text-[#b45309] shrink-0" />
        <div className="font-mono text-[12px] text-[#b45309]">Not yet qualified.</div>
      </div>
      <div className="flex flex-wrap gap-2 pl-7">
        {issues.map((i) => (
          <Badge key={i.code} tone="warn">{issueLabel(i.code)} ({i.have}/{i.need})</Badge>
        ))}
      </div>
    </div>
  );
};

// ── Create team form ──────────────────────────────────────────────────────

const CreateTeamForm = ({ onCreated }) => {
  const toast = useToast();
  const [name, setName] = useState('');
  const [domainId, setDomainId] = useState('');
  const [psId, setPsId] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: domData } = useApi(() => api.get('/api/taxonomy/domains'), []);
  const { data: psData } = useApi(
    () => domainId
      ? api.get('/api/taxonomy/problem-statements', { query: { domainId } })
      : Promise.resolve({ problemStatements: [] }),
    [domainId],
  );

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { team } = await api.post('/api/teams', { name, domainId, psId: psId || undefined });
      toast.success(`Team "${team.name}" created. You're the leader.`);
      onCreated?.();
    } catch (err) {
      toast.error(err.message);
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className={`${CARD} space-y-5`}>
      {/* Section header */}
      <div className="flex items-center gap-3 border-b-2 border-[#151320]/15 pb-4">
        <div className="grid h-8 w-8 place-items-center bg-[#c8235f] text-white">
          <Plus size={16} />
        </div>
        <h2 className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[18px] font-black uppercase tracking-[0.08em] text-[#151320]">
          Create a team
        </h2>
      </div>

      <FormField label="Team name" required hint="Visible to the whole event. 2–60 chars.">
        <input
          className="input-glass"
          minLength={2}
          maxLength={60}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Domain" required>
          <select
            className="select-glass"
            required
            value={domainId}
            onChange={(e) => { setDomainId(e.target.value); setPsId(''); }}
          >
            <option value="">Select…</option>
            {domData?.domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </FormField>

        <FormField
          label="Problem statement"
          hint={!domainId ? 'Pick a domain first' : 'Optional, can be set later by admins.'}
        >
          <select
            className="select-glass"
            disabled={!domainId}
            value={psId}
            onChange={(e) => setPsId(e.target.value)}
          >
            <option value="">— None —</option>
            {psData?.problemStatements?.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </FormField>
      </div>

      <button type="submit" disabled={busy} className="glow-button inline-flex items-center gap-2">
        {busy ? <Spinner size={14} /> : <Plus size={14} />}
        {busy ? 'Creating…' : 'Create team'}
      </button>
    </form>
  );
};

// ── Joinable list ─────────────────────────────────────────────────────────

const JoinableList = () => {
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const [busyTeamId, setBusyTeamId] = useState('');
  const { data, loading, refetch } = useApi(() => api.get('/api/teams/joinable'), []);
  const outgoing = useApi(() => api.get('/api/join-requests/me'), []);

  const teams = useMemo(
    () => (data?.teams ?? []).filter((t) => t.name.toLowerCase().includes(filter.toLowerCase())),
    [data, filter],
  );

  const pendingByTeam = useMemo(
    () => new Map((outgoing.data?.requests ?? []).map((r) => [r.team.id, r.id])),
    [outgoing.data],
  );

  const requestJoin = async (teamId) => {
    setBusyTeamId(teamId);
    try {
      await api.post(`/api/teams/${teamId}/join-requests`);
      toast.success('Join request sent.');
      refetch();
    } catch (err) { toast.error(err.message); }
    finally {
      await outgoing.refetch();
      setBusyTeamId('');
    }
  };

  const cancelRequest = async (teamId) => {
    const requestId = pendingByTeam.get(teamId);
    if (!requestId) return;
    setBusyTeamId(teamId);
    try {
      await api.post(`/api/join-requests/${requestId}/cancel`);
      toast.info('Join request cancelled.');
    } catch (err) { toast.error(err.message); }
    finally {
      await outgoing.refetch();
      setBusyTeamId('');
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className={SECTION_LABEL}>Open teams</h2>
        <div className="relative w-full max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4458]" />
          <input
            className="input-glass !pl-10"
            placeholder="Filter by name…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {loading && <CardSkeleton rows={2} />}
      {!loading && teams.length === 0 && (
        <Empty
          icon={Users}
          title="No teams to join"
          description="Either none have been created yet, or your filter excludes them all."
        />
      )}

      <div className="grid gap-4 md:grid-cols-1">
        {teams.map((t) => (
          <article key={t.id} className={`${CARD_FLAT} space-y-3`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[16px] font-black uppercase tracking-[0.04em] text-[#151320]">
                  {t.name}
                </div>
                <div className="font-mono text-[12px] text-[#4a4458]">
                  {t.domain?.name} · led by {t.leader?.fullName}
                </div>
              </div>
              <Badge tone="dim">{t.memberCount} member{t.memberCount !== 1 && 's'}</Badge>
            </div>

            {t.missing?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {t.missing.map((m) => (
                  <Badge key={m.code} tone="warn">{issueLabel(m.code)}</Badge>
                ))}
              </div>
            )}

            {pendingByTeam.has(t.id) ? (
              <div className="flex flex-wrap items-center gap-2">
                <button className="ghost-button inline-flex cursor-default items-center gap-2 opacity-70" disabled>
                  <CheckCircle2 size={12} className="text-[#0b6e43]" /> Request sent
                </button>
                <button
                  className="ghost-button inline-flex items-center gap-1 text-[11px]"
                  disabled={busyTeamId === t.id}
                  onClick={() => cancelRequest(t.id)}
                >
                  {busyTeamId === t.id ? <Spinner size={12} /> : <XCircle size={12} />} Cancel
                </button>
              </div>
            ) : (
              <button
                className="glow-button inline-flex items-center gap-2"
                disabled={busyTeamId === t.id}
                onClick={() => requestJoin(t.id)}
              >
                {busyTeamId === t.id ? <Spinner size={12} /> : <Send size={12} />}
                {busyTeamId === t.id ? 'Sending…' : 'Request to join'}
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

// ── Problem statement modal ───────────────────────────────────────────────

const ProblemStatementModal = ({ open, onClose, current, onSave }) => {
  const list = useApi(
    () => open ? api.get('/api/taxonomy/problem-statements') : Promise.resolve({ problemStatements: [] }),
    [open],
    { refetchOnFocus: false },
  );
  const [psId, setPsId] = useState(current);
  const [busy, setBusy] = useState(false);
  const [seen, setSeen] = useState(open);
  if (open !== seen) { setSeen(open); if (open) setPsId(current); }

  const groups = useMemo(() => {
    const byDomain = new Map();
    for (const ps of list.data?.problemStatements ?? []) {
      const key = ps.domain?.name ?? 'Other';
      if (!byDomain.has(key)) byDomain.set(key, []);
      byDomain.get(key).push(ps);
    }
    return [...byDomain.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [list.data]);

  const save = async () => {
    setBusy(true);
    try { await onSave(psId); onClose(); } finally { setBusy(false); }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Problem statement"
      size="md"
      footer={(
        <>
          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="glow-button inline-flex items-center gap-2 disabled:opacity-60"
            disabled={busy || psId === current}
            onClick={save}
          >
            {busy && <Spinner size={12} />} Save
          </button>
        </>
      )}
    >
      <p className="mb-4 font-mono text-[12px] text-[#4a4458]">
        You can change this until the team is finalized. The team&apos;s domain follows the problem statement.
      </p>
      {list.loading ? <Spinner /> : (
        <select className="select-glass w-full" value={psId} onChange={(e) => setPsId(e.target.value)}>
          <option value="">No problem statement yet</option>
          {groups.map(([domain, items]) => (
            <optgroup key={domain} label={domain}>
              {items.map((ps) => <option key={ps.id} value={ps.id}>{ps.title}</option>)}
            </optgroup>
          ))}
        </select>
      )}
    </Modal>
  );
};

// ── Invite modal ──────────────────────────────────────────────────────────

const InviteModal = ({ open, onClose, teamId, onSent }) => {
  const toast = useToast();
  const [registrationNo, setRegistrationNo] = useState('');
  const [busyId, setBusyId] = useState('');

  const close = () => { setRegistrationNo(''); setBusyId(''); onClose(); };

  const lookup = useApi(
    () => registrationNo.trim()
      ? api.get('/api/teams/explore/members', { query: { search: registrationNo.trim() } })
      : Promise.resolve({ users: [] }),
    [registrationNo],
    { refetchOnFocus: false },
  );

  const candidates = useMemo(() => {
    const needle = normalizeRegistrationNo(registrationNo);
    if (!needle) return [];
    const users = lookup.data?.users ?? [];
    const exact = users.filter((u) => u.registrationNo === needle);
    if (exact.length) return exact;
    return users.filter((u) => (u.registrationNo ?? '').includes(needle));
  }, [lookup.data, registrationNo]);

  const sendInvite = async (inviteeId) => {
    setBusyId(inviteeId);
    try {
      await api.post(`/api/teams/${teamId}/invites`, { inviteeId });
      toast.success('Invite sent.');
      onSent?.();
      close();
    } catch (err) {
      toast.error(err.message);
    } finally { setBusyId(''); }
  };

  return (
    <Modal open={open} onClose={close} title="Invite a member" size="sm">
      <div className="space-y-4">
        <FormField label="Registration ID" required hint="Search by registration number to find the matching candidate.">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4458]" />
            <input
              className="input-glass !pl-10"
              required
              value={registrationNo}
              onChange={(e) => setRegistrationNo(e.target.value)}
              placeholder="Registration number..."
            />
          </div>
        </FormField>

        {!registrationNo.trim() && (
          <Empty
            icon={Search}
            title="Search by registration ID"
            description="Enter a registration number and the matching candidate will appear here."
            className="border-dashed py-8"
          />
        )}

        {registrationNo.trim() && lookup.loading && <CardSkeleton rows={1} />}

        {registrationNo.trim() && !lookup.loading && candidates.length === 0 && (
          <Empty
            icon={Users}
            title="No matching candidate"
            description="No student matched that registration number."
            className="border-dashed py-8"
          />
        )}

        <div className="space-y-3">
          {candidates.map((candidate) => {
            const blockedReason = candidate.membership?.team
              ? `${candidate.fullName} is already in ${candidate.membership.team.name}.`
              : candidate.verificationStatus !== 'VERIFIED'
                ? 'This student must be verified before they can be invited.'
                : null;

            return (
              <article key={candidate.id} className={`${CARD_FLAT} space-y-3`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[15px] font-black uppercase text-[#151320]">
                      {candidate.fullName}
                    </div>
                    {candidate.email && (
                      <div className="font-mono text-[11px] text-[#4a4458]">{candidate.email}</div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="dim">{candidate.domain?.name ?? 'No domain'}</Badge>
                    {blockedReason && <Badge tone="warn">Unavailable</Badge>}
                  </div>
                </div>

                <div className="font-mono text-[11px] text-[#4a4458]">
                  Reg #: {candidate.registrationNo ?? '—'}
                  {candidate.institution?.name ? ` · ${candidate.institution.name}` : ''}
                </div>

                {blockedReason && (
                  <div className="font-mono text-[11px] text-[#b8102a]">{blockedReason}</div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="glow-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={Boolean(blockedReason) || busyId === candidate.id}
                    onClick={() => sendInvite(candidate.id)}
                  >
                    {busyId === candidate.id ? <Spinner size={14} /> : <UserPlus size={14} />}
                    {busyId === candidate.id ? 'Sending...' : 'Send invite'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button type="button" className="ghost-button" onClick={close}>Close</button>
        </div>
      </div>
    </Modal>
  );
};

// ── Queue panel (leader's pending requests / invites) ─────────────────────

const QueuePanel = ({ title, icon: Icon, count, loading, emptyText, children }) => (
  <section className="border-2 border-[#151320] bg-[#f3e9d2]">
    <header className="flex items-center justify-between border-b-2 border-[#151320] bg-[#e6d5b0] px-4 py-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-[#4a4458]" />}
        <h3 className={SECTION_LABEL}>{title}</h3>
      </div>
      <Badge tone={count ? 'warn' : 'dim'}>{count}</Badge>
    </header>
    {loading ? (
      <div className="p-4"><CardSkeleton rows={1} /></div>
    ) : count === 0 ? (
      <p className="px-4 py-5 text-center font-mono text-[12px] text-[#5c556c]">{emptyText}</p>
    ) : (
      <div className="divide-y-2 divide-[#151320]/15">{children}</div>
    )}
  </section>
);

// One person per row: avatar initials, name + subline, badges, actions
const QueueRow = ({ name, sub, badges, actions }) => (
  <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center border-2 border-[#151320] bg-[#151320] font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[12px] font-bold text-[#f3e9d2]">
        {(name ?? '?').slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0">
        <div className="truncate font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[14px] font-black uppercase text-[#151320]">
          {name}
        </div>
        {sub && <div className="truncate font-mono text-[11px] text-[#4a4458]">{sub}</div>}
        {badges && <div className="mt-1.5 flex flex-wrap gap-1">{badges}</div>}
      </div>
    </div>
    <div className="flex shrink-0 justify-end gap-2">{actions}</div>
  </div>
);

// ── Stat tile (members / female / experts) ────────────────────────────────

const Stat = ({ label, value }) => (
  <div>
    <div className={SECTION_LABEL}>{label}</div>
    <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[28px] font-black text-[#151320]">
      {value}
    </div>
  </div>
);

// ── My team view ──────────────────────────────────────────────────────────

const MyTeamView = ({ team, evaluation, onMutate }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [psOpen, setPsOpen] = useState(false);

  const isLeader = team.leader.id === user.id;
  const isFinalized = team.status === 'FINALIZED';
  const dissolveBlockedReason = team.status === 'FINALIZED'
    ? 'Finalized teams cannot be dissolved.'
    : team.status === 'DISQUALIFIED'
      ? 'Disqualified teams cannot be dissolved.'
      : null;

  const invites  = useApi(() => api.get(`/api/teams/${team.id}/invites`), [team.id]);
  const requests = useApi(() => api.get(`/api/teams/${team.id}/join-requests`), [team.id]);

  const myChanges = useApi(
    () => api.get('/api/membership-changes/initiated-me'),
    [],
    { pollMs: 5000 },
  );
  const initiatedChanges = myChanges.data?.changes ?? [];
  const myPendingLeave = initiatedChanges.find((c) => c.team?.id === team.id && c.kind === 'LEAVE');
  const myDisbandChanges = initiatedChanges.filter((c) => c.team?.id === team.id && c.kind === 'DISBAND');
  const teamDisbandPending = myDisbandChanges.length > 0;
  const disbandApprovedCount = myDisbandChanges.filter((c) => c.status === 'APPROVED').length;
  const disbandPendingCount = myDisbandChanges.filter((c) => c.status === 'PENDING').length;

  const awaitingMe = useApi(
    () => api.get('/api/membership-changes/awaiting-me'),
    [],
    { pollMs: 5000 },
  );
  const myApprovalChanges = awaitingMe.data?.changes ?? [];
  const myDisbandApproval = myApprovalChanges.find((c) => c.team?.id === team.id && c.kind === 'DISBAND');
  const teamPendingForMe = myApprovalChanges.filter((c) => c.team?.id === team.id && c.kind !== 'DISBAND');

  const [busyId, setBusyId] = useState('');
  const pendingInvites  = (invites.data?.invites  ?? []).filter((i) => i.status === 'PENDING');
  const pendingRequests = (requests.data?.requests ?? []).filter((r) => r.status === 'PENDING');

  const action = async (label, fn, id = '') => {
    setBusyId(id);
    try { await fn(); toast.success(label); }
    catch (err) { toast.error(err.message); }
    finally { invites.refetch(); requests.refetch(); onMutate(); setBusyId(''); }
  };

  const finalize       = () => action('Team finalized.', () => api.post(`/api/teams/${team.id}/finalize`));
  const cancelInvite   = (id) => action('Invite cancelled.', () => api.post(`/api/invites/${id}/cancel`), id);
  const approveRequest = (id) => action('Request approved — member added.', () => api.post(`/api/join-requests/${id}/approve`), id);
  const denyRequest    = (id) => action('Request denied.', () => api.post(`/api/join-requests/${id}/deny`), id);

  const approveChange = async (id, kind) => {
    try {
      const res = await api.post(`/api/membership-changes/${id}/approve`);
      if (kind === 'DISBAND') {
        toast.success(res.disbanded ? 'Team dissolved.' : 'Dissolution approval recorded.');
      } else {
        toast.success(kind === 'LEAVE' ? 'Member removed.' : 'Dismissal acknowledged.');
      }
      myChanges.refetch(); awaitingMe.refetch(); onMutate();
    } catch (err) { toast.error(err.message); }
  };

  const denyChange = async (id, kind) => {
    try {
      await api.post(`/api/membership-changes/${id}/deny`);
      toast.success(kind === 'DISBAND' ? 'Dissolution request denied.' : 'Request denied.');
      myChanges.refetch(); awaitingMe.refetch(); onMutate();
    } catch (err) { toast.error(err.message); }
  };

  const requestLeave = async () => {
    const ok = await confirm({
      title: 'Leave the team?',
      message: "Your leader must approve this. You'll stay a member until then.",
      confirmLabel: 'Submit request',
    });
    if (!ok) return;
    try {
      await api.post(`/api/teams/${team.id}/leave`, {});
      toast.success('Leave request submitted.');
      myChanges.refetch(); onMutate();
    } catch (err) {
      toast.error(err.message);
      myChanges.refetch();
    }
  };

  const cancelLeaveRequest = async () => {
    if (!myPendingLeave) return;
    const ok = await confirm({
      title: 'Cancel leave request?',
      message: "You'll stay a member of the team. You can submit another request later.",
      confirmLabel: 'Cancel request',
    });
    if (!ok) return;
    try {
      await api.post(`/api/membership-changes/${myPendingLeave.id}/cancel`);
      toast.success('Leave request withdrawn.');
      myChanges.refetch(); onMutate();
    } catch (err) { toast.error(err.message); }
  };

  const dismissMember = async (memberId, name) => {
    const ok = await confirm({
      title: `Dismiss ${name}?`,
      message: "They must acknowledge the dismissal before they're removed.",
      tone: 'crit', confirmLabel: 'Send dismissal',
    });
    if (!ok) return;
    action('Dismissal sent.', () => api.post(`/api/teams/${team.id}/dismiss`, { targetUserId: memberId }));
  };

  const transferLeader = async (newLeaderId, name) => {
    const ok = await confirm({
      title: `Transfer leadership to ${name}?`,
      message: "You'll become a regular member. The new leader can manage invites and finalization.",
      confirmLabel: 'Transfer',
    });
    if (!ok) return;
    action('Leadership transferred.', () => api.post(`/api/teams/${team.id}/transfer-leadership`, { newLeaderId }));
  };

  const dissolveTeam = async () => {
    if (dissolveBlockedReason) return;
    if (teamDisbandPending) {
      const ok = await confirm({
        title: 'Cancel dissolve request?',
        message: "This keeps the team intact and clears every pending member approval for dissolution.",
        confirmLabel: 'Cancel request',
      });
      if (!ok) return;
      try {
        await api.post(`/api/membership-changes/${myDisbandChanges[0].id}/cancel`);
        toast.success('Dissolution request cancelled.');
        myChanges.refetch(); awaitingMe.refetch(); onMutate();
      } catch (err) { toast.error(err.message); }
      return;
    }

    const ok = await confirm({
      title: `Dissolve ${team.name}?`,
      message: 'Each non-leader member will receive an approval request. The team will dissolve only after every member approves.',
      tone: 'crit', confirmLabel: 'Send requests',
    });
    if (!ok) return;

    try {
      const res = await api.delete(`/api/teams/${team.id}`);
      if (res.disbanded) {
        toast.success('Team dissolved.');
      } else {
        const count = res.pendingApprovals ?? 0;
        toast.success(`Dissolution request sent to ${count} member${count === 1 ? '' : 's'}.`);
      }
      myChanges.refetch(); awaitingMe.refetch(); onMutate();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      {/* Action-needed banner (membership changes waiting on viewer) */}
      {!isFinalized && !teamDisbandPending && teamPendingForMe.length > 0 && (
        <section className="border-2 border-[#b45309] bg-[#fef3e2]">
          <header className="flex items-center justify-between gap-3 border-b-2 border-[#b45309]/50 bg-[#fef3e2] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#b45309] opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#b45309]" />
              </span>
              <AlertTriangle size={15} className="text-[#b45309]" />
              <h3 className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[14px] font-black uppercase tracking-[0.14em] text-[#b45309]">
                Action needed
              </h3>
            </div>
            <Badge tone="warn">{teamPendingForMe.length}</Badge>
          </header>
          <div className="divide-y-2 divide-[#b45309]/20">
            {teamPendingForMe.map((c) => {
              const isLeave = c.kind === 'LEAVE';
              return (
                <div key={c.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[14px] font-bold uppercase text-[#151320]">
                      {isLeave
                        ? <>{c.target?.fullName} wants to leave the team</>
                        : <>Your team leader wants to remove you from {team.name}</>}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-[#4a4458]">
                      {isLeave
                        ? 'Approve to remove them now, or deny to keep them in the team.'
                        : 'Accept to leave the team, or decline to stay.'}
                      {' · '}{formatRelative(c.createdAt)}
                    </div>
                    {c.reason && <div className="mt-1.5 font-mono text-[12px] text-[#151320]">"{c.reason}"</div>}
                  </div>
                  <div className="flex shrink-0 justify-end gap-2">
                    <button className={`ghost-button ${COMPACT_BTN}`} onClick={() => denyChange(c.id, c.kind)}>
                      <XCircle size={12} /> {isLeave ? 'Keep in team' : 'Decline'}
                    </button>
                    <button className={`danger-button ${COMPACT_BTN}`} onClick={() => approveChange(c.id, c.kind)}>
                      <CheckCircle2 size={12} /> {isLeave ? 'Approve leave' : 'Accept removal'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Team header card */}
      <header className={`${CARD} space-y-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[12px] font-bold uppercase tracking-[0.2em] text-[#a81f55] mb-1">
              {team.domain?.name}{team.problemStatement && ` · ${team.problemStatement.title}`}
            </div>
            <h2 className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[32px] font-black uppercase leading-[1] text-[#151320]">
              {team.name}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={team.status === 'FINALIZED' ? 'live' : team.status === 'QUALIFIED' ? 'live' : 'warn'}
              dot
            >
              {team.status}
            </Badge>
            {isLeader && (
              <Badge tone="cyan">
                <Crown size={10} className="mr-0.5" /> Leader
              </Badge>
            )}
            {team.adminOverride && <Badge tone="warn">Admin override</Badge>}
          </div>
        </div>

        <StatusBanner status={team.status} issues={evaluation?.issues ?? []} />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 border-t-2 border-[#151320]/20 pt-5">
          <Stat label="Members" value={`${team.memberCount}`} />
          <Stat label="Female"  value={`${team.femaleCount}`} />
          <Stat label="Experts" value={`${team.domainExpertCount}`} />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 border-t-2 border-[#151320]/20 pt-4">
          {isLeader && !isFinalized && !teamDisbandPending && (
            <button
              className="glow-button inline-flex items-center gap-2"
              onClick={finalize}
              disabled={team.status !== 'QUALIFIED'}
            >
              <ShieldCheck size={14} /> Finalize team
            </button>
          )}
          {isLeader && !isFinalized && !teamDisbandPending && (
            <button
              className="ghost-button inline-flex items-center gap-2"
              onClick={() => setPsOpen(true)}
              disabled={team.status !== 'FORMING'}
            >
              <ListChecks size={12} />
              {team.problemStatement ? 'Change problem statement' : 'Choose problem statement'}
            </button>
          )}
          {isLeader && !isFinalized && !teamDisbandPending && (
            <button className="ghost-button inline-flex items-center gap-2" onClick={() => setInviteOpen(true)}>
              <UserPlus size={12} /> Invite member
            </button>
          )}
          {isLeader && (
            <button
              className="danger-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={dissolveTeam}
              disabled={Boolean(dissolveBlockedReason)}
              title={dissolveBlockedReason ?? (teamDisbandPending ? 'Cancel team dissolution request' : 'Dissolve this team')}
            >
              <XCircle size={12} />
              {teamDisbandPending ? 'Cancel dissolve request' : 'Dissolve team'}
            </button>
          )}
          {!isLeader && !isFinalized && !myDisbandApproval && (
            myPendingLeave ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="warn" dot>Leave request pending leader approval</Badge>
                <button className="ghost-button inline-flex items-center gap-2" onClick={cancelLeaveRequest}>
                  <XCircle size={12} /> Cancel request
                </button>
              </div>
            ) : (
              <button className="danger-button inline-flex items-center gap-2" onClick={requestLeave}>
                <LogOut size={12} /> Request to leave
              </button>
            )
          )}
        </div>

        {isLeader && dissolveBlockedReason && (
          <div className="font-mono text-[11px] text-[#5c556c]">{dissolveBlockedReason}</div>
        )}
      </header>

      {/* Disband pending — leader side */}
      {isLeader && teamDisbandPending && (
        <section className={`${CARD_FLAT} space-y-3`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className={SECTION_LABEL}>Team dissolution pending</h3>
              <div className="font-mono text-[11px] text-[#4a4458]">
                The team will dissolve automatically after every non-leader member approves.
              </div>
            </div>
            <Badge tone="warn">{disbandApprovedCount}/{myDisbandChanges.length} approved</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {myDisbandChanges.map((c) => (
              <div key={c.id} className="border-2 border-[#151320]/20 bg-[#f3e9d2] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[14px] font-bold uppercase text-[#151320]">
                    {c.target?.fullName}
                  </div>
                  <Badge tone={c.status === 'APPROVED' ? 'live' : 'warn'}>{c.status}</Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="font-mono text-[11px] text-[#5c556c]">
            {disbandPendingCount} approval{disbandPendingCount === 1 ? '' : 's'} still pending.
          </div>
        </section>
      )}

      {/* Disband approval — member side */}
      {!isLeader && myDisbandApproval && (
        <section className={`${CARD_FLAT} space-y-3`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className={SECTION_LABEL}>Team dissolution request</h3>
              <div className="font-mono text-[11px] text-[#4a4458]">
                {myDisbandApproval.status === 'PENDING'
                  ? 'The leader has requested to dissolve this team. It will be removed only if every non-leader member approves.'
                  : 'You approved dissolution. Waiting for the remaining approvals.'}
              </div>
              {myDisbandApproval.reason && (
                <div className="mt-1 font-mono text-[11px] text-[#5c556c]">"{myDisbandApproval.reason}"</div>
              )}
            </div>
            <Badge tone={myDisbandApproval.status === 'APPROVED' ? 'live' : 'warn'}>
              {myDisbandApproval.status === 'APPROVED' ? 'Approved' : 'Approval required'}
            </Badge>
          </div>

          {myDisbandApproval.status === 'PENDING' && (
            <div className="flex justify-end gap-2">
              <button className={`ghost-button ${COMPACT_BTN}`} onClick={() => denyChange(myDisbandApproval.id, 'DISBAND')}>
                <XCircle size={12} /> Deny
              </button>
              <button className={`danger-button ${COMPACT_BTN}`} onClick={() => approveChange(myDisbandApproval.id, 'DISBAND')}>
                <CheckCircle2 size={12} /> Approve
              </button>
            </div>
          )}
        </section>
      )}

      {/* Members list */}
      <section className="space-y-3">
        <h3 className={SECTION_LABEL}>Members</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {team.members.map((m) => {
            const isMe = m.user.id === user.id;
            const isThisLeader = m.role === 'LEADER';
            const memberHasOpenChange = teamPendingForMe.some((c) => c.target?.id === m.user.id);
            return (
              <article key={m.user.id} className={`${CARD_FLAT} flex items-center justify-between gap-3`}>
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="grid h-10 w-10 place-items-center border-2 border-[#151320] bg-[#151320] font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[13px] font-bold text-[#f3e9d2]">
                    {(m.user.fullName ?? '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[14px] font-bold uppercase text-[#151320]">
                      {m.user.fullName} {isMe && <Badge tone="dim">you</Badge>}
                    </div>
                    <div className="font-mono text-[11px] text-[#4a4458]">{m.user.email}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone={isThisLeader ? 'cyan' : 'dim'}>{m.role}</Badge>
                  {isLeader && !isThisLeader && !isFinalized && !teamDisbandPending && (
                    memberHasOpenChange ? (
                      <Badge tone="warn">Awaiting your decision ↑</Badge>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          className="ghost-button text-[10px]"
                          onClick={() => transferLeader(m.user.id, m.user.fullName)}
                        >
                          Make leader
                        </button>
                        <button
                          className="danger-button text-[10px]"
                          onClick={() => dismissMember(m.user.id, m.user.fullName)}
                        >
                          Dismiss
                        </button>
                      </div>
                    )
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Leader queues */}
      {isLeader && !isFinalized && !teamDisbandPending && (pendingRequests.length > 0 || pendingInvites.length > 0) && (
        <div className={`grid gap-6 ${pendingRequests.length > 0 && pendingInvites.length > 0 ? 'lg:grid-cols-2' : ''}`}>
          {pendingRequests.length > 0 && (
            <QueuePanel
              title="Join requests"
              icon={UserMinus}
              count={pendingRequests.length}
              loading={requests.loading}
              emptyText="No one has asked to join yet."
            >
              {pendingRequests.map((r) => (
                <QueueRow
                  key={r.id}
                  name={r.requester.fullName}
                  sub={r.requester.email}
                  badges={(
                    <>
                      {r.requester.domain?.name && <Badge tone="dim">{r.requester.domain.name}</Badge>}
                      {r.requester.gender === 'FEMALE' && <Badge tone="live">Female</Badge>}
                      {r.requester.isDomainExpert && <Badge tone="cyan">Expert</Badge>}
                    </>
                  )}
                  actions={(
                    <>
                      <button className={`ghost-button ${COMPACT_BTN}`} disabled={busyId === r.id} onClick={() => denyRequest(r.id)}>
                        <XCircle size={12} /> Deny
                      </button>
                      <button className={`glow-button ${COMPACT_BTN}`} disabled={busyId === r.id} onClick={() => approveRequest(r.id)}>
                        {busyId === r.id ? <Spinner size={12} /> : <CheckCircle2 size={12} />} Approve
                      </button>
                    </>
                  )}
                />
              ))}
            </QueuePanel>
          )}

          {pendingInvites.length > 0 && (
            <QueuePanel
              title="Pending invites"
              icon={UserPlus}
              count={pendingInvites.length}
              loading={invites.loading}
              emptyText="No invites waiting for a reply."
            >
              {pendingInvites.map((i) => (
                <QueueRow
                  key={i.id}
                  name={i.invitee.fullName}
                  sub={i.invitee.email}
                  badges={<Badge tone="warn" dot>Awaiting reply</Badge>}
                  actions={(
                    <button className={`ghost-button ${COMPACT_BTN}`} disabled={busyId === i.id} onClick={() => cancelInvite(i.id)}>
                      {busyId === i.id ? <Spinner size={12} /> : <XCircle size={12} />} Cancel
                    </button>
                  )}
                />
              ))}
            </QueuePanel>
          )}
        </div>
      )}

      <TeamChat key={team.id} teamId={team.id} />

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} teamId={team.id} onSent={onMutate} />
      <ProblemStatementModal
        open={psOpen}
        onClose={() => setPsOpen(false)}
        current={team.problemStatement?.id ?? ''}
        onSave={(psId) =>
          action(
            psId ? 'Problem statement updated.' : 'Problem statement cleared.',
            () => api.patch(`/api/teams/${team.id}/problem-statement`, { psId: psId || null }),
          )
        }
      />
    </div>
  );
};

// ── Page entry ────────────────────────────────────────────────────────────

export const TeamFormationPage = () => {
  const myTeam = useApi(() => api.get('/api/teams/mine'), [], { pollMs: 5000 });

  const detail = useApi(
    () => myTeam.data?.team ? api.get(`/api/teams/${myTeam.data.team.id}`) : Promise.resolve(null),
    [myTeam.data?.team?.id],
  );
  const evaluation = useApi(
    () => myTeam.data?.team ? api.get(`/api/teams/${myTeam.data.team.id}/evaluation`) : Promise.resolve(null),
    [myTeam.data?.team?.id],
  );

  useSocketEvent('invite:received', () => { myTeam.refetch(); }, []);

  const refresh = () => { myTeam.refetch(); detail.refetch(); evaluation.refetch(); };

  return (
    <section className="txp-station-app mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
      <PageHeader
        kicker="Team Hub"
        title="Squad Formation"
        description="Create a team, send invites, request to join, transfer leadership, and finalize when ready."
      />

      {myTeam.loading && <CardSkeleton rows={3} />}

      {!myTeam.loading && !myTeam.data?.team && (
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <CreateTeamForm onCreated={refresh} />
          <JoinableList />
        </div>
      )}

      {detail.data?.team && (
        <MyTeamView
          team={detail.data.team}
          evaluation={evaluation.data}
          onMutate={refresh}
        />
      )}
    </section>
  );
};
