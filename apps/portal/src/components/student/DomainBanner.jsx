import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { DomainPicker, DOMAIN_PICKS, DOMAINS_SAVED_EVENT } from './DomainPicker.jsx';
import { TshirtSizePicker } from './TshirtSizePicker.jsx';
import { BranchPicker, BRANCH_INSTITUTION_NAME } from './BranchPicker.jsx';

// Shown on every page to a signed-in student who has fewer than 4 domains
// (for example after the domain list was replaced and everyone's picks were
// cleared), until they choose again.
const Banner = () => {
  const me = useApi(() => api.get('/api/auth/me'), []);
  const [open, setOpen] = useState(false);
  const { refetch } = me;

  useEffect(() => {
    window.addEventListener(DOMAINS_SAVED_EVENT, refetch);
    return () => window.removeEventListener(DOMAINS_SAVED_EVENT, refetch);
  }, [refetch]);

  const user = me.data?.user;
  if (!user || user.role !== 'STUDENT') return null;
  const needDomains = (user.preferredDomains?.length ?? 0) < DOMAIN_PICKS;
  const needSize = !user.tshirtSize;
  const needBranch = user.institution?.name === BRANCH_INSTITUTION_NAME && !user.branch;
  if (!needDomains && !needSize && !needBranch) return null;

  return (
    <div role="alert" className="relative z-20 border-b-2 border-[#151320] bg-[#f5b800]/25 text-[#151320]">
      {needDomains && (
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <AlertTriangle size={16} className="shrink-0 text-[#a81f55]" />
          <p className="flex-1 font-sans text-[13px] font-semibold text-[#151320]">
            The domains have changed. Please choose your {DOMAIN_PICKS} domains again.
          </p>
          <button type="button" className="glow-button" onClick={() => setOpen(true)}>Choose domains</button>
        </div>
      )}
      {needSize && (
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <AlertTriangle size={16} className="shrink-0 text-[#a81f55]" />
          <p className="flex-1 font-sans text-[13px] font-semibold text-[#151320]">Please tell us your T-shirt size.</p>
          <TshirtSizePicker compact />
        </div>
      )}
      {needBranch && (
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <AlertTriangle size={16} className="shrink-0 text-[#a81f55]" />
          <p className="flex-1 font-sans text-[13px] font-semibold text-[#151320]">Please tell us your branch.</p>
          <BranchPicker compact />
        </div>
      )}
      <DomainPicker open={open} onClose={() => setOpen(false)} initial={user.preferredDomains ?? []} />
    </div>
  );
};

export const DomainBanner = () => {
  const { user } = useAuth();
  return user?.role === 'STUDENT' ? <Banner /> : null;
};
