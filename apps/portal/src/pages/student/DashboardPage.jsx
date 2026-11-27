import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Users, Mail, ArrowRight, Inbox, Megaphone, ExternalLink,
  Github, Linkedin, IdCard, GraduationCap, Layers, Search, UserPlus, Send,
  Briefcase, FileText, Award, BookOpen, Globe, Shirt,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useInfiniteList } from '../../hooks/useInfiniteList.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useBroadcasts } from '../../contexts/BroadcastContext.jsx';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { formatRelative, titleCase } from '../../utils/format.js';
import { DomainPicker, DOMAINS_SAVED_EVENT } from '../../components/student/DomainPicker.jsx';
import { TshirtSizePicker } from '../../components/student/TshirtSizePicker.jsx';

// Role → badge tone mapping
const ROLE_TONE = { ADMIN: 'crit', JURY: 'cyan', COORDINATOR: 'warn', STUDENT: 'live' };
const joinList = (values) => values?.length ? values.join(', ') : '—';

// ── Shared micro-components ───────────────────────────────────────────────

// A labelled data field (label + value pair in profile cards)
const Field = ({ icon: Icon, label, value }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-1.5 font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[11px] font-bold uppercase tracking-[0.2em] text-[#4a4458]">
      <Icon size={11} /> {label}
    </div>
    <div className="font-mono text-[13px] font-semibold text-[#151320]">{value}</div>
  </div>
);

// A freeform text section with ink divider
const ProfileCopySection = ({ title, value }) => {
  if (!value) return null;
  return (
    <div className="mt-7 border-t-2 border-[#151320]/15 pt-5">
      <div className="mb-2 font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[11px] font-bold uppercase tracking-[0.22em] text-[#4a4458]">
        {title}
      </div>
      <p className="font-mono text-[13px] leading-relaxed text-[#151320]/80">{value}</p>
    </div>
  );
};

// External links row
const ProfileLinks = ({ user }) => {
  const links = [
    { href: user.linkedinUrl, label: 'LinkedIn', icon: Linkedin },
    { href: user.githubUrl, label: 'GitHub', icon: Github },
    { href: user.portfolioUrl, label: 'Portfolio', icon: Globe },
    { href: user.resumeDriveLink, label: 'Resume', icon: FileText },
    { href: user.researchPublicationUrl, label: 'Publication', icon: BookOpen },
  ].filter((item) => item.href);

  if (!links.length) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t-2 border-[#151320]/15 pt-4">
      {links.map(({ href, label, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="ghost-button inline-flex items-center gap-2"
        >
          <Icon size={12} /> {label}
        </a>
      ))}
    </div>
  );
};

// ── Profile tab ───────────────────────────────────────────────────────────

const ProfileTab = ({ user, myTeam }) => {
  const [editDomains, setEditDomains] = useState(false);
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Main profile card */}
      <section className="md:col-span-2 bg-[#fffaf0] border-2 border-[#151320] shadow-[0_3px_0_#151320] p-6">
        <div className="mb-5 flex items-center gap-3 border-b-2 border-[#151320]/15 pb-4">
          <div className="grid h-8 w-8 place-items-center bg-[#151320] text-[#f3e9d2]">
            <User size={15} />
          </div>
          <h2 className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[16px] font-black uppercase tracking-[0.14em] text-[#151320]">
            Profile Identity
          </h2>
        </div>

        <dl className="grid grid-cols-1 gap-y-4 sm:grid-cols-2">
          <Field icon={User} label="Name" value={user.fullName} />
          <Field icon={Mail} label="Email" value={user.email} />
          <Field icon={IdCard} label="Passenger ref" value={user.publicId ?? '—'} />
          <Field icon={IdCard} label="Registration #" value={user.registrationNo ?? '—'} />
          <Field icon={GraduationCap} label="Institution" value={user.institution?.name ?? '—'} />
          <Field icon={Layers} label="Preferred Domain" value={user.domain?.name ?? '—'} />
          <Field icon={GraduationCap} label="Degree" value={user.degree ?? '—'} />
          {user.branch ? <Field icon={GraduationCap} label="Branch" value={user.branch} /> : null}
          <Field icon={BookOpen} label="Year / Semester" value={user.yearSemester ?? '—'} />
          <Field icon={Mail} label="Phone" value={user.phone ?? '—'} />
          {user.role === 'STUDENT' ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[11px] font-bold uppercase tracking-[0.2em] text-[#4a4458]">
                <Shirt size={11} /> T-shirt size
              </div>
              <TshirtSizePicker key={user.tshirtSize ?? ''} current={user.tshirtSize ?? ''} compact />
            </div>
          ) : (
            <Field icon={Shirt} label="T-shirt size" value={user.tshirtSize ?? '—'} />
          )}
          <Field icon={Briefcase} label="Preferred Team Role" value={user.preferredTeamRole ?? '—'} />
          <Field icon={Award} label="Contribution Areas" value={joinList(user.contributionAreas)} />
        </dl>

        <ProfileCopySection title="Bio" value={user.bio} />

        {user.role === 'STUDENT' || user.preferredDomainDetails?.length ? (
          <div className="mt-7 border-t-2 border-[#151320]/15 pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[11px] font-bold uppercase tracking-[0.22em] text-[#4a4458]">
                Preferred domains
              </div>
              {user.role === 'STUDENT' && (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setEditDomains(true)}
                >
                  Edit domains
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {user.preferredDomainDetails?.length
                ? user.preferredDomainDetails.map((domain) => (
                    <Badge key={domain.id} tone="dim">{domain.name}</Badge>
                  ))
                : (
                  <span className="font-mono text-[12px] text-[#b45309]">No domains chosen yet.</span>
                )}
            </div>
            <DomainPicker
              open={editDomains}
              onClose={() => setEditDomains(false)}
              initial={user.preferredDomains ?? []}
            />
          </div>
        ) : null}

        <ProfileCopySection title="Technical Skills" value={user.technicalSkills} />
        <ProfileCopySection title="Non-Technical Skills" value={user.nonTechnicalSkills} />
        <ProfileCopySection title="Achievements" value={user.achievements} />
        <ProfileCopySection title="Hackathon Experience" value={user.hackathonExperience} />
        <ProfileCopySection title="Certifications / Achievements" value={user.certificationsAchievements} />
        <ProfileCopySection title="Project / Startup / Initiative" value={user.projectInitiative} />
        <ProfileCopySection title="Participation Experience" value={user.participationExperience} />

        <ProfileLinks user={user} />
      </section>

      {/* Profile sidebar */}
      <aside className="bg-[#fffaf0] border-2 border-[#151320] shadow-[0_3px_0_#151320] p-6 space-y-5 h-fit">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center border-2 border-[#151320] bg-[#151320] font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[18px] font-black text-[#f3e9d2] shadow-[0_2px_0_#000]">
            {(user.fullName ?? '?').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[16px] font-black uppercase tracking-[0.04em] text-[#151320]">
              {user.fullName}
            </div>
            <Badge tone={ROLE_TONE[user.role]}>{user.role}</Badge>
          </div>
        </div>

        {/* Status */}
        <div className="border-t-2 border-[#151320]/15 pt-4">
          <div className="mb-2 font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[10px] font-bold uppercase tracking-[0.28em] text-[#4a4458]">
            Status
          </div>
          <Badge tone={user.verificationStatus === 'VERIFIED' ? 'live' : 'warn'}>
            {titleCase(user.verificationStatus)}
          </Badge>
        </div>

        {/* Team */}
        {user.role === 'STUDENT' && (
          <div className="border-t-2 border-[#151320]/15 pt-4">
            <div className="mb-2 font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[10px] font-bold uppercase tracking-[0.28em] text-[#4a4458]">
              Team
            </div>
            {myTeam ? (
              <div className="space-y-0.5">
                <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[15px] font-black uppercase text-[#151320]">
                  {myTeam.name}
                </div>
                <div className="font-mono text-[11px] text-[#4a4458]">
                  {myTeam.domain?.name ?? 'No domain'}
                </div>
              </div>
            ) : (
              <span className="font-mono text-[12px] text-[#4a4458]">Not in a team</span>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="border-t-2 border-[#151320]/15 pt-4">
          <Link
            to="/teams"
            className="glow-button inline-flex w-full items-center justify-center gap-2"
          >
            Team Hub <ArrowRight size={14} />
          </Link>
        </div>
      </aside>
    </div>
  );
};

// ── Inbox tab ─────────────────────────────────────────────────────────────

const InboxTab = ({ onTeamChanged }) => {
  const toast = useToast();
  const [busyId, setBusyId] = useState('');
  const invites = useApi(() => api.get('/api/invites/me'), []);
  const requests = useApi(() => api.get('/api/join-requests/me'), []);

  useSocketEvent('invite:received', () => invites.refetch(), [invites.refetch]);

  const accept = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/api/invites/${id}/accept`);
      toast.success('Joined the team.');
      invites.refetch();
      requests.refetch();
      onTeamChanged?.();
    } catch (e) { toast.error(e.message); }
    finally { setBusyId(''); }
  };

  const decline = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/api/invites/${id}/decline`);
      toast.info('Invite declined.');
      invites.refetch();
    } catch (e) { toast.error(e.message); }
    finally { setBusyId(''); }
  };

  const cancel = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/api/join-requests/${id}/cancel`);
      toast.info('Request cancelled.');
      requests.refetch();
    } catch (e) { toast.error(e.message); }
    finally { setBusyId(''); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Pending invites */}
      <section className="space-y-4">
        <h2 className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[13px] font-black uppercase tracking-[0.22em] text-[#4a4458]">
          Pending invites
        </h2>
        {invites.loading && <CardSkeleton rows={2} />}
        {invites.data?.invites.length === 0 && (
          <Empty
            icon={Inbox}
            title="No pending invites"
            description="Leaders can send you invites from the Teams page."
          />
        )}
        {invites.data?.invites.map((inv) => (
          <article
            key={inv.id}
            className="bg-[#fffaf0] border-2 border-[#151320] shadow-[0_3px_0_#151320] p-5 space-y-4"
          >
            <div>
              <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[18px] font-black uppercase tracking-[0.04em] text-[#151320]">
                {inv.team.name}
              </div>
              <div className="font-mono text-[12px] text-[#4a4458] mt-1">
                {inv.team.domain?.name} · led by {inv.team.leader?.fullName}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-[#5c556c]">{formatRelative(inv.createdAt)}</span>
              <div className="flex gap-2">
                <button
                  className="ghost-button"
                  disabled={busyId === inv.id}
                  onClick={() => decline(inv.id)}
                >
                  Decline
                </button>
                <button
                  className="glow-button inline-flex items-center gap-1.5"
                  disabled={busyId === inv.id}
                  onClick={() => accept(inv.id)}
                >
                  {busyId === inv.id && <Spinner size={12} />}
                  Accept
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Outgoing requests */}
      <section className="space-y-3">
        <h2 className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[13px] font-black uppercase tracking-[0.22em] text-[#4a4458]">
          My outgoing requests
        </h2>
        {requests.loading && <CardSkeleton rows={2} />}
        {requests.data?.requests.length === 0 && (
          <Empty
            icon={Inbox}
            title="No outgoing requests"
            description="Find a team on the Explore tab and request to join."
          />
        )}
        {requests.data?.requests.map((r) => (
          <article
            key={r.id}
            className="bg-[#fffaf0] border-2 border-[#151320] shadow-[0_3px_0_#151320] p-4 flex items-center justify-between gap-3"
          >
            <div>
              <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[15px] font-bold uppercase text-[#151320]">
                {r.team.name}
              </div>
              <div className="font-mono text-[12px] text-[#4a4458]">{r.team.domain?.name}</div>
            </div>
            <button
              className="ghost-button inline-flex items-center gap-1.5"
              disabled={busyId === r.id}
              onClick={() => cancel(r.id)}
            >
              {busyId === r.id && <Spinner size={12} />}
              Cancel
            </button>
          </article>
        ))}
      </section>
    </div>
  );
};

// ── Broadcasts tab ────────────────────────────────────────────────────────

const BroadcastsTab = () => {
  const { latest } = useBroadcasts();
  if (latest.length === 0) {
    return (
      <Empty
        icon={Megaphone}
        title="No broadcasts yet"
        description="Organizer announcements appear here in real time."
      />
    );
  }
  return (
    <div className="space-y-4">
      {latest.map((b) => (
        <article
          key={b.id}
          className="bg-[#fffaf0] border-2 border-[#151320] shadow-[0_3px_0_#151320] p-5 space-y-3"
        >
          {/* Yellow top accent strip */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 bg-[#f5b800] border border-[#151320]" />
              <Badge tone="live">Signal broadcast</Badge>
            </div>
            <span className="font-mono text-[11px] text-[#5c556c]">{formatRelative(b.createdAt)}</span>
          </div>
          <p className="font-mono text-[13px] leading-relaxed text-[#151320]">{b.message}</p>
          <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[11px] uppercase tracking-[0.2em] text-[#4a4458]">
            — {b.sender?.fullName}
          </div>
        </article>
      ))}
    </div>
  );
};

// ── Member details modal ──────────────────────────────────────────────────

const MemberDetailsModal = ({ member, action, busy, onInvite, onClose }) => {
  if (!member) return null;
  return (
    <Modal
      open={Boolean(member)}
      onClose={onClose}
      title="Member details"
      size="lg"
      footer={(
        <>
          <button className="ghost-button" onClick={onClose}>Close</button>
          <button
            className="glow-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={action.disabled || busy}
            onClick={() => onInvite(member.id)}
            title={action.reason}
          >
            {busy ? <Spinner size={12} /> : <UserPlus size={12} />}
            {busy ? 'Sending...' : action.label}
          </button>
        </>
      )}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[22px] font-black uppercase text-[#151320]">
              {member.fullName}
            </div>
            <div className="font-mono text-[12px] text-[#4a4458]">
              {member.institution?.name ?? 'No institution'}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="cyan">{member.domain?.name ?? 'No domain'}</Badge>
            {member.gender === 'FEMALE' && <Badge tone="live">Female</Badge>}
            {member.isDomainExpert && <Badge tone="warn">Expert</Badge>}
            <Badge tone={member.verificationStatus === 'VERIFIED' ? 'live' : 'warn'}>
              {titleCase(member.verificationStatus)}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field icon={Layers} label="Preferred Domain" value={member.domain?.name ?? '—'} />
          <Field icon={GraduationCap} label="Institution" value={member.institution?.name ?? '—'} />
          <Field icon={GraduationCap} label="Degree" value={member.degree ?? '—'} />
          <Field icon={BookOpen} label="Year / Semester" value={member.yearSemester ?? '—'} />
          <Field icon={Briefcase} label="Preferred Team Role" value={member.preferredTeamRole ?? '—'} />
          <Field icon={Award} label="Contribution Areas" value={joinList(member.contributionAreas)} />
          <Field icon={Layers} label="Match Score" value={String(member.matchScore ?? 0)} />
          <Field
            icon={Users}
            label="Team"
            value={member.membership?.team
              ? `${member.membership.team.name} (${member.membership.team.status})`
              : 'No team yet'}
          />
        </div>

        {member.preferredDomainDetails?.length ? (
          <div className="border-t-2 border-[#151320]/15 pt-4">
            <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[11px] font-bold uppercase tracking-[0.2em] text-[#4a4458] mb-2">
              Preferred domains
            </div>
            <div className="flex flex-wrap gap-1.5">
              {member.preferredDomainDetails.map((domain) => (
                <Badge
                  key={domain.id}
                  tone={member.sharedPreferredDomains?.some((s) => s.id === domain.id) ? 'live' : 'dim'}
                >
                  {domain.name}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <ProfileCopySection title="Technical Skills" value={member.technicalSkills} />
        <ProfileCopySection title="Non-Technical Skills" value={member.nonTechnicalSkills} />
        <ProfileLinks user={member} />

        <div className="border-t-2 border-[#151320]/15 pt-4 font-mono text-[11px] text-[#5c556c]">
          {action.reason}
        </div>
      </div>
    </Modal>
  );
};

// ── Team details modal ────────────────────────────────────────────────────

const TeamDetailsModal = ({ team, action, busy, onRequest, onClose }) => {
  const detail = useApi(
    () => team ? api.get(`/api/teams/${team.id}`) : Promise.resolve(null),
    [team?.id],
  );
  const fullTeam = detail.data?.team ?? team;

  return (
    <Modal
      open={Boolean(team)}
      onClose={onClose}
      title="Team details"
      size="xl"
      footer={(
        <>
          <button className="ghost-button" onClick={onClose}>Close</button>
          <button
            className="glow-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={action?.disabled || busy}
            onClick={() => team && onRequest(team.id)}
          >
            {busy ? <Spinner size={12} /> : <Send size={12} />}
            {busy ? 'Sending...' : action?.label ?? 'Send request'}
          </button>
        </>
      )}
    >
      {detail.loading ? (
        <CardSkeleton rows={3} />
      ) : fullTeam ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[22px] font-black uppercase text-[#151320]">
                {fullTeam.name}
              </div>
              <div className="font-mono text-[12px] text-[#4a4458]">
                {fullTeam.domain?.name ?? 'No domain'} · led by {fullTeam.leader?.fullName}
              </div>
              <div className="font-mono text-[11px] text-[#5c556c]">Team ref {fullTeam.publicId}</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone={fullTeam.status === 'FORMING' ? 'cyan' : 'dim'}>{fullTeam.status}</Badge>
              <Badge tone="dim">{fullTeam.memberCount ?? fullTeam.members?.length ?? 0} members</Badge>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field icon={Layers} label="Domain" value={fullTeam.domain?.name ?? '—'} />
            <Field icon={User} label="Leader" value={fullTeam.leader?.fullName ?? '—'} />
            <Field icon={Users} label="Status" value={fullTeam.status ?? '—'} />
            <Field icon={Layers} label="Problem statement" value={fullTeam.problemStatement?.title ?? '—'} />
          </div>

          <div className="border-t-2 border-[#151320]/15 pt-4">
            <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[12px] font-black uppercase tracking-[0.16em] text-[#4a4458] mb-3">
              Team members
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {(fullTeam.members ?? []).map((member) => (
                <article
                  key={member.user.id}
                  className="border-2 border-[#151320]/20 bg-[#f3e9d2] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[14px] font-bold uppercase text-[#151320]">
                        {member.user.fullName}
                      </div>
                      {member.user.email && (
                        <div className="font-mono text-[11px] text-[#4a4458]">{member.user.email}</div>
                      )}
                    </div>
                    <Badge tone={member.role === 'LEADER' ? 'cyan' : 'dim'}>{member.role}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="dim">{member.user.domain?.name ?? 'No domain'}</Badge>
                    {member.user.gender === 'FEMALE' && <Badge tone="live">Female</Badge>}
                    {member.user.isDomainExpert && <Badge tone="warn">Expert</Badge>}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-[#151320]/15 pt-4 font-mono text-[11px] text-[#5c556c]">
            {action?.disabled ? action.label : 'This team is available for join requests.'}
          </div>
        </div>
      ) : (
        <Empty icon={Users} title="Team not found" description="This team detail could not be loaded." className="py-10" />
      )}
    </Modal>
  );
};

// ── Explore tab ───────────────────────────────────────────────────────────

const ExploreTab = ({ user, myTeam }) => {
  const toast = useToast();
  const [memberFilter, setMemberFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [inviteingId, setInviteingId] = useState('');
  const [requestingTeamId, setRequestingTeamId] = useState('');

  const [memberSearch, setMemberSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setMemberSearch(memberFilter.trim()), 300);
    return () => clearTimeout(t);
  }, [memberFilter]);

  const members = useInfiniteList(
    ({ offset, limit }) => api.get('/api/teams/explore/members', {
      query: { offset, limit, search: memberSearch || undefined },
    }),
    [memberSearch, myTeam?.id],
    { pageSize: 20, itemsKey: 'users' },
  );
  const teams = useApi(() => api.get('/api/teams'), [myTeam?.id]);
  const joinable = useApi(() => api.get('/api/teams/joinable'), [myTeam?.id]);
  const outgoingRequests = useApi(() => api.get('/api/join-requests/me'), [myTeam?.id]);

  const leaderOwnTeam = myTeam?.leader?.id === user.id ? myTeam : null;
  const pendingInvites = useApi(
    () => leaderOwnTeam
      ? api.get(`/api/teams/${leaderOwnTeam.id}/invites`, { query: { status: 'PENDING' } })
      : Promise.resolve({ invites: [] }),
    [leaderOwnTeam?.id],
  );

  const joinableTeamIds = useMemo(
    () => new Set((joinable.data?.teams ?? []).map((t) => t.id)),
    [joinable.data],
  );
  const pendingRequestTeamIds = useMemo(
    () => new Set((outgoingRequests.data?.requests ?? []).map((r) => r.team.id)),
    [outgoingRequests.data],
  );
  const pendingInviteUserIds = useMemo(
    () => new Set((pendingInvites.data?.invites ?? []).map((i) => i.invitee.id)),
    [pendingInvites.data],
  );

  const { setRootEl: setMembersPanel, setSentinelEl: setMembersSentinel } = members;
  const visibleMembers = members.items;
  const memberTotal = members.total;
  const matchCount = members.extra.matchCount ?? 0;

  const visibleTeams = useMemo(() => {
    const all = (teams.data?.teams ?? []).filter((t) => t.id !== myTeam?.id);
    const needle = teamFilter.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((t) =>
      [t.name, t.domain?.name, t.leader?.fullName]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(needle)),
    );
  }, [teams.data, teamFilter, myTeam?.id]);

  const inviteDisabledReason = useMemo(() => {
    if (!leaderOwnTeam && myTeam) return 'Only the creator of a team can send invites.';
    if (!leaderOwnTeam) return 'First create your own team.';
    if (leaderOwnTeam.status === 'FINALIZED') return 'Your team is finalized.';
    if (leaderOwnTeam.status === 'DISQUALIFIED') return 'Your team is disqualified.';
    return null;
  }, [leaderOwnTeam, myTeam]);

  const memberActionState = (member) => {
    if (pendingInviteUserIds.has(member.id))
      return { disabled: true, label: 'Invite pending', reason: 'An invite is already pending for this user.' };
    if (member.membership?.team)
      return { disabled: true, label: 'Already in a team', reason: `${member.fullName} is already in ${member.membership.team.name}.` };
    if (member.verificationStatus !== 'VERIFIED')
      return { disabled: true, label: 'Not verified', reason: 'This user must be verified before they can join a team.' };
    if (inviteDisabledReason)
      return { disabled: true, label: myTeam ? 'Invite unavailable' : 'Create team first', reason: inviteDisabledReason };
    return { disabled: false, label: 'Send invite', reason: 'Ready to invite.' };
  };

  const sendInvite = async (inviteeId) => {
    if (!leaderOwnTeam) return;
    setInviteingId(inviteeId);
    try {
      await api.post(`/api/teams/${leaderOwnTeam.id}/invites`, { inviteeId });
      toast.success('Invite sent.');
      pendingInvites.refetch();
    } catch (err) { toast.error(err.message); }
    finally { setInviteingId(''); }
  };

  const sendJoinRequest = async (teamId) => {
    setRequestingTeamId(teamId);
    try {
      await api.post(`/api/teams/${teamId}/join-requests`);
      toast.success('Join request sent.');
      outgoingRequests.refetch();
      joinable.refetch();
    } catch (err) { toast.error(err.message); }
    finally { setRequestingTeamId(''); }
  };

  const teamActionState = (team) => {
    if (pendingRequestTeamIds.has(team.id)) return { disabled: true, label: 'Request pending' };
    if (myTeam?.leader?.id === user.id) return { disabled: true, label: 'You already created your own team' };
    if (myTeam) return { disabled: true, label: 'You are already in a team' };
    if (!joinableTeamIds.has(team.id)) return { disabled: true, label: 'Not accepting requests' };
    return { disabled: false, label: 'Send request' };
  };

  // Shared card class for explore items
  const exploreCard = 'bg-[#fffaf0] border-2 border-[#151320] shadow-[0_3px_0_#151320] p-5 flex flex-col justify-between space-y-3 hover:bg-white transition-colors duration-150 min-h-[188px]';

  return (
    <div className="grid gap-8 xl:grid-cols-2 xl:items-start">
      {/* Members panel */}
      <section className="space-y-3 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[14px] font-black uppercase tracking-[0.18em] text-[#4a4458]">
              Available members
            </h2>
            <p className="font-mono text-[12px] text-[#5c556c]">
              Students sharing your domains first (most shared on top), then everyone else.
            </p>
          </div>
          <div className="relative w-full md:max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4458]" />
            <input
              className="input-glass !pl-10"
              placeholder="Search passengers..."
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
            />
          </div>
        </div>

        {(members.loading || pendingInvites.loading) ? <CardSkeleton rows={2} /> : null}
        {!members.loading && visibleMembers.length === 0 && (
          <Empty icon={Users} title="No members found" description="No registered student matched your search." />
        )}
        {!members.loading && visibleMembers.length > 0 && (
          <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[11px] uppercase tracking-[0.18em] text-[#4a4458]">
            {memberTotal} students · {matchCount} share your domains
          </div>
        )}

        <div ref={setMembersPanel} className="scroll-panel max-h-[75vh] space-y-4 overflow-y-auto overscroll-contain pr-2">
          {visibleMembers.map((member, index) => {
            const action = memberActionState(member);
            const startsOthers = index === matchCount && index > 0;
            return (
              <Fragment key={member.id}>
                {startsOthers && (
                  <div className="flex items-center gap-3 pt-2 font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[10px] uppercase tracking-[0.22em] text-[#4a4458]">
                    <span className="h-px flex-1 bg-[#151320]/20" />
                    Other students · no shared domains
                    <span className="h-px flex-1 bg-[#151320]/20" />
                  </div>
                )}
                <article className={exploreCard}>
                  <button type="button" className="w-full text-left" onClick={() => setSelectedMember(member)}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[16px] font-black uppercase tracking-[0.04em] text-[#151320]">
                          {member.fullName}
                        </div>
                        <div className="font-mono text-[12px] text-[#4a4458]">
                          {member.institution?.name ?? 'No institution'}
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Badge tone="cyan">{member.domain?.name ?? 'No domain'}</Badge>
                        {member.sharedPreferredDomains?.length
                          ? <Badge tone="live">Shared: {member.sharedPreferredDomains.length}</Badge>
                          : null}
                        {member.membership?.team && <Badge tone="dim">In team</Badge>}
                        {member.verificationStatus !== 'VERIFIED' && (
                          <Badge tone="warn">{titleCase(member.verificationStatus)}</Badge>
                        )}
                      </div>
                    </div>
                  </button>

                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] leading-relaxed text-[#4a4458]">
                    <span>
                      {[member.degree, member.branch, member.yearSemester].filter(Boolean).join(' · ') || 'Profile'}
                    </span>
                    {member.preferredTeamRole && (<><span>·</span><span>{member.preferredTeamRole}</span></>)}
                    {member.membership?.team && (
                      <><span>·</span><span>{member.membership.team.name}</span></>
                    )}
                  </div>

                  {member.sharedPreferredDomains?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {member.sharedPreferredDomains.map((domain) => (
                        <Badge key={domain.id} tone="live">{domain.name}</Badge>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      className="ghost-button inline-flex items-center gap-2"
                      onClick={() => setSelectedMember(member)}
                    >
                      <ExternalLink size={12} /> View details
                    </button>
                    <button
                      className="ghost-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={action.disabled || inviteingId === member.id}
                      onClick={() => sendInvite(member.id)}
                      title={action.reason}
                    >
                      {inviteingId === member.id ? <Spinner size={12} /> : <UserPlus size={12} />}
                      {inviteingId === member.id ? 'Sending...' : action.label}
                    </button>
                  </div>
                </article>
              </Fragment>
            );
          })}

          {!members.loading && members.hasMore && !members.error && (
            <div
              ref={setMembersSentinel}
              className="flex items-center justify-center gap-2 py-4 font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[11px] uppercase tracking-[0.18em] text-[#4a4458]"
            >
              {members.loadingMore && <><Spinner size={12} /> Loading more…</>}
            </div>
          )}
          {members.error && (
            <div className="flex items-center justify-center gap-3 py-4 font-mono text-[11px] text-[#b8102a]">
              Couldn&apos;t load students.
              <button
                type="button"
                className="ghost-button !px-3 !py-1 text-[11px]"
                onClick={visibleMembers.length ? members.loadMore : members.reload}
              >
                Retry
              </button>
            </div>
          )}
          {!members.loading && !members.hasMore && visibleMembers.length > 0 && (
            <div className="py-3 text-center font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[10px] uppercase tracking-[0.22em] text-[#4a4458]/60">
              End of list
            </div>
          )}
        </div>
      </section>

      {/* Teams panel */}
      <section className="space-y-3 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[14px] font-black uppercase tracking-[0.18em] text-[#4a4458]">
              Available teams
            </h2>
            <p className="font-mono text-[12px] text-[#5c556c]">
              Browse every other team and send a join request only when you are not already in one.
            </p>
          </div>
          <div className="relative w-full md:max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4458]" />
            <input
              className="input-glass !pl-10"
              placeholder="Search teams..."
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
            />
          </div>
        </div>

        {(teams.loading || joinable.loading || outgoingRequests.loading) && <CardSkeleton rows={2} />}
        {!teams.loading && visibleTeams.length === 0 && (
          <Empty icon={Users} title="No other teams visible" description="Your own team is hidden here. No other team matched your search." />
        )}

        <div className="scroll-panel max-h-[75vh] space-y-4 overflow-y-auto overscroll-contain pr-2">
          {visibleTeams.map((team) => {
            const action = teamActionState(team);
            return (
              <article key={team.id} className={exploreCard}>
                <button type="button" className="w-full text-left" onClick={() => setSelectedTeam(team)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[16px] font-black uppercase tracking-[0.04em] text-[#151320]">
                        {team.name}
                      </div>
                      <div className="font-mono text-[12px] text-[#4a4458]">
                        {team.domain?.name} · led by {team.leader?.fullName}
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Badge tone={joinableTeamIds.has(team.id) ? 'cyan' : 'dim'}>{team.status}</Badge>
                      <Badge tone="dim">{team.memberCount} members</Badge>
                    </div>
                  </div>
                </button>

                <div className="font-mono text-[11px] leading-relaxed text-[#5c556c]">
                  {action.disabled ? action.label : 'Open for join requests right now.'}
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    className="ghost-button inline-flex items-center gap-2"
                    onClick={() => setSelectedTeam(team)}
                  >
                    <ExternalLink size={12} /> View details
                  </button>
                  <button
                    className="glow-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={action.disabled || requestingTeamId === team.id}
                    onClick={() => sendJoinRequest(team.id)}
                  >
                    {requestingTeamId === team.id ? <Spinner size={12} /> : <Send size={12} />}
                    {requestingTeamId === team.id ? 'Sending...' : action.label}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <MemberDetailsModal
        member={selectedMember}
        action={selectedMember ? memberActionState(selectedMember) : { disabled: true, label: 'Invite unavailable', reason: '' }}
        busy={inviteingId === selectedMember?.id}
        onInvite={sendInvite}
        onClose={() => setSelectedMember(null)}
      />

      <TeamDetailsModal
        team={selectedTeam}
        action={selectedTeam ? teamActionState(selectedTeam) : { disabled: true, label: 'Request unavailable' }}
        busy={requestingTeamId === selectedTeam?.id}
        onRequest={sendJoinRequest}
        onClose={() => setSelectedTeam(null)}
      />
    </div>
  );
};

// ── Page entry ────────────────────────────────────────────────────────────

export const DashboardPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('profile');

  const me = useApi(() => api.get('/api/auth/me'), []);
  const myTeam = useApi(() => api.get('/api/teams/mine'), []);
  const { refetch: refetchMe } = me;
  const { refetch: refetchTeam } = myTeam;
  const u = me.data?.user ?? user;

  useEffect(() => {
    window.addEventListener(DOMAINS_SAVED_EVENT, refetchMe);
    return () => window.removeEventListener(DOMAINS_SAVED_EVENT, refetchMe);
  }, [refetchMe]);

  const handleTeamChanged = useCallback(() => {
    refetchTeam();
    refetchMe();
  }, [refetchTeam, refetchMe]);

  return (
    <section className="txp-station-app mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
      <PageHeader
        kicker={`Session Active: ${u.fullName.split(' ')[0]}`}
        title="Mission Dashboard"
        description="Your profile, team status, inbox and live signals."
        actions={
          u.role === 'STUDENT'
            ? (
              <Link to="/teams" className="glow-button inline-flex items-center gap-2 px-6">
                <Users size={14} /> <span>Team Hub</span>
              </Link>
            )
            : null
        }
      />

      <Tabs
        className="mb-8"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'profile', label: 'Profile', icon: User },
          ...(u.role === 'STUDENT' ? [{ value: 'explore', label: 'Explore', icon: Search }] : []),
          { value: 'inbox', label: 'Inbox', icon: Inbox },
          { value: 'broadcasts', label: 'Broadcasts', icon: Megaphone },
        ]}
      />

      <div className="fade-in mt-8">
        {me.loading || (u.role === 'STUDENT' && myTeam.loading)
          ? <CardSkeleton rows={4} />
          : tab === 'profile'
            ? <ProfileTab user={u} myTeam={myTeam.data?.team ?? null} />
            : tab === 'explore'
              ? <ExploreTab user={u} myTeam={myTeam.data?.team ?? null} />
              : tab === 'inbox'
                ? <InboxTab onTeamChanged={handleTeamChanged} />
                : <BroadcastsTab />}
      </div>
    </section>
  );
};
