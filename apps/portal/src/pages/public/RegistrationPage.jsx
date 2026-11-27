import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { compressImage } from '../../utils/imageCompress.js';
import { normalizeRegistrationNo } from '../../utils/registrationNo.js';

const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const BRANCH_INSTITUTION_NAME = 'ITER | SOA';
const BRANCH_OPTIONS = ['CSE Core', 'CSE AIML', 'CSE CS', 'CSE DS', 'EE', 'ECE', 'EEE', 'Mech'];

const INITIAL_FORM = {
  fullName: '',
  email: '',
  registrationNo: '',
  phone: '',
  gender: '',
  tshirtSize: '',
  idCard: '',
  institutionId: '',
  preferredDomains: [],
  domainId: '',
  yearSemester: '',
  degree: '',
  branch: '',
  contributionAreas: [],
  preferredTeamRole: '',
  technicalSkills: '',
  nonTechnicalSkills: '',
  linkedinUrl: '',
  githubUrl: '',
  resumeDriveLink: '',
  researchPublicationUrl: '',
  certificationsAchievements: '',
  projectInitiative: '',
  participationExperience: '',
  bio: '',
  achievements: '',
  hackathonExperience: '',
  website: '', // honeypot — hidden from humans; must stay empty
};

const YEAR_SEMESTER_OPTIONS = [
  '1st Year / Semester 1',
  '1st Year / Semester 2',
  '2nd Year / Semester 3',
  '2nd Year / Semester 4',
  '3rd Year / Semester 5',
  '3rd Year / Semester 6',
  '4th Year / Semester 7',
  '4th Year / Semester 8',
  '5th Year / Semester 9',
  '5th Year / Semester 10',
  '6th Year / Semester 11',
  '6th Year / Semester 12',
];

const CONTRIBUTION_AREA_OPTIONS = [
  'Research & Documentation',
  'Problem Solving',
  'Idea Generation & Innovation',
  'Technical Development',
  'UI / UX Design',
  'Graphic Design',
  'Presentation & Pitching',
  'Public Speaking',
  'Content Writing',
  'Data Analysis',
  'Business Strategy',
  'Marketing & Outreach',
  'Project Coordination',
  'Leadership & Team Management',
  'Healthcare Knowledge',
  'Clinical Understanding',
  'Pharmaceutical Knowledge',
  'Legal Understanding',
  'Agricultural Knowledge',
  'Animal Care Knowledge',
  'Financial Planning',
  'Operations Management',
  'Hospitality Coordination',
  'Community Engagement',
  'Social Impact Planning',
  'Event Coordination',
  'Cybersecurity Awareness',
  'AI / Technology Awareness',
  'Field Research',
  'User Research',
  'Communication & Collaboration',
];

const TEAM_ROLE_OPTIONS = [
  'Developer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'AI/ML Engineer',
  'Cybersecurity Specialist',
  'UI/UX Designer',
  'Researcher',
  'Healthcare Specialist',
  'Pharmaceutical Researcher',
  'Legal Advisor',
  'Business Strategist',
  'Marketing Lead',
  'Financial Analyst',
  'Operations Coordinator',
  'Hospitality Coordinator',
  'Agriculture Domain Expert',
  'Veterinary Domain Expert',
  'Presentation Lead',
  'Content Writer',
  'Project Manager',
  'Team Leader',
  'Product Strategist',
  'Data Analyst',
  'Innovation Lead',
  'Open to Any Role',
];

const DEGREE_OPTIONS = [
  'Undergraduate',
  'Postgraduate',
  'Doctoral / Research',
  'Diploma',
  'Other',
];

const URL_FIELDS = ['linkedinUrl', 'githubUrl', 'resumeDriveLink', 'researchPublicationUrl'];

const URL_EXAMPLES = {
  linkedinUrl: 'https://linkedin.com/in/yourname',
  githubUrl: 'https://github.com/yourname',
  resumeDriveLink: 'https://drive.google.com/file/d/...',
  researchPublicationUrl: 'https://doi.org/...',
};

const FIELD_ORDER = [
  'fullName',
  'email',
  'registrationNo',
  'phone',
  'gender',
  'tshirtSize',
  'idCard',
  'institutionId',
  'preferredDomains',
  'domainId',
  'yearSemester',
  'degree',
  'branch',
  'contributionAreas',
  'preferredTeamRole',
  'technicalSkills',
  'nonTechnicalSkills',
  'linkedinUrl',
  'githubUrl',
  'resumeDriveLink',
  'researchPublicationUrl',
  'certificationsAchievements',
  'projectInitiative',
  'participationExperience',
  'bio',
  'achievements',
  'hackathonExperience',
];

const FIELD_LABELS = {
  fullName: 'Full Name',
  email: 'Email',
  registrationNo: 'Registration Number',
  phone: 'Phone',
  gender: 'Gender',
  tshirtSize: 'T-shirt size',
  idCard: 'College ID Card',
  institutionId: 'Institution',
  preferredDomains: 'Preferred Domain',
  domainId: 'Preferred Domain',
  yearSemester: 'Year / Semester',
  degree: 'Degree',
  branch: 'Branch',
  contributionAreas: 'Contribution Areas',
  preferredTeamRole: 'Preferred Team Role',
  technicalSkills: 'Technical Skills',
  nonTechnicalSkills: 'Non-Technical Skills',
  linkedinUrl: 'LinkedIn Profile',
  githubUrl: 'GitHub Profile',
  resumeDriveLink: 'Resume Drive Link',
  researchPublicationUrl: 'Research / Publication Link',
  certificationsAchievements: 'Certifications / Achievements',
  projectInitiative: 'Project / Initiative',
  participationExperience: 'Participation Experience',
  bio: 'Bio',
  achievements: 'Achievements',
  hackathonExperience: 'Hackathon Experience',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const normalizeUrl = (value) => {
  const v = (value ?? '').trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
};

const isValidUrl = (value) => {
  try {
    const u = new URL(value);
    return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.') && value.length <= 500;
  } catch {
    return false;
  }
};

const parseLink = (value) => {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
  } catch {
    return null;
  }
};
const onHost = (u, host) => u.hostname === host || u.hostname.endsWith(`.${host}`);
const GITHUB_USER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;

const isLinkedInProfile = (value) => {
  const u = parseLink(value);
  return Boolean(u && onHost(u, 'linkedin.com') && /^\/in\/[^/]+\/?$/i.test(u.pathname));
};
const isGitHubProfile = (value) => {
  const u = parseLink(value);
  if (!u || !['github.com', 'www.github.com'].includes(u.hostname)) return false;
  const [user, ...rest] = u.pathname.split('/').filter(Boolean);
  return Boolean(user && GITHUB_USER.test(user) && rest.length === 0);
};
const isDriveFileLink = (value) => {
  const u = parseLink(value);
  return Boolean(u && onHost(u, 'drive.google.com') && /^\/file\/d\/[^/]+/.test(u.pathname));
};

const PROFILE_CHECKS = {
  linkedinUrl: { valid: isLinkedInProfile, message: 'LinkedIn' },
  githubUrl: { valid: isGitHubProfile, message: 'GitHub' },
  resumeDriveLink: { valid: isDriveFileLink, message: 'Google Drive file' },
};

const validateRegistration = (f, { needsBranch = false } = {}) => {
  const e = {};
  const name = f.fullName.trim();
  if (name.length < 2) e.fullName = 'Enter your full name (at least 2 characters).';
  else if (name.length > 120) e.fullName = 'Name is too long — 120 characters at most.';

  const email = f.email.trim();
  if (!email) e.email = 'Email is required — your login details are sent here.';
  else if (!EMAIL_RE.test(email)) e.email = 'That does not look like a valid email. Use name@college.edu.';

  const reg = f.registrationNo.trim();
  if (!reg) e.registrationNo = 'Registration number is required — use the one issued by your institution.';
  else if (reg.length > 50) e.registrationNo = 'Registration number is too long — 50 characters at most.';

  const phone = f.phone.trim();
  if (phone && !/^\d{10}$/.test(phone)) e.phone = 'Phone number must be exactly 10 digits, with no spaces, dashes or +.';

  if (!f.gender) e.gender = 'Select your gender.';
  if (!TSHIRT_SIZES.includes(f.tshirtSize)) e.tshirtSize = 'Select your T-shirt size.';
  if (!f.idCard) e.idCard = 'Upload a photo of your college ID card.';
  if (!f.institutionId) e.institutionId = 'Select your institution from the list.';
  if (f.preferredDomains.length !== 4) e.preferredDomains = 'Pick exactly 4 domains. Your first pick is primary.';
  if (!YEAR_SEMESTER_OPTIONS.includes(f.yearSemester)) e.yearSemester = 'Select your year / semester.';
  if (!f.degree) e.degree = 'Select your degree.';
  if (needsBranch && !BRANCH_OPTIONS.includes(f.branch)) e.branch = 'Select your branch.';
  if (!f.contributionAreas.length) e.contributionAreas = 'Pick at least one area you can contribute to.';
  else if (f.contributionAreas.length > 12) e.contributionAreas = 'Pick at most 12 contribution areas.';
  if (!f.preferredTeamRole) e.preferredTeamRole = 'Select the role you would like to play in a team.';
  if (f.technicalSkills.length > 500) e.technicalSkills = 'Keep technical skills under 500 characters.';
  if (f.nonTechnicalSkills.length > 500) e.nonTechnicalSkills = 'Keep non-technical skills under 500 characters.';

  for (const key of URL_FIELDS) {
    if (!f[key]) continue;
    const profile = PROFILE_CHECKS[key];
    if (profile) {
      if (!profile.valid(f[key])) e[key] = `Enter your ${profile.message} link, e.g. ${URL_EXAMPLES[key]}`;
    } else if (!isValidUrl(f[key])) {
      e[key] = `Enter a complete link, e.g. ${URL_EXAMPLES[key]}`;
    }
  }

  const bio = f.bio.trim();
  if (!bio) e.bio = 'Bio is required — a few lines about what you build, study or care about.';
  else if (bio.length > 1000) e.bio = `Bio is too long — ${bio.length}/1000 characters.`;

  for (const key of [
    'certificationsAchievements',
    'projectInitiative',
    'participationExperience',
    'achievements',
    'hackathonExperience',
  ]) {
    if (f[key].length > 1500) e[key] = `Too long — ${f[key].length}/1500 characters.`;
  }

  return e;
};

const sanitizePayload = (form) =>
  Object.fromEntries(
    Object.entries(form)
      .map(([key, value]) => {
        if (Array.isArray(value)) return [key, value.length ? value : undefined];
        if (typeof value === 'string') {
          const trimmed = value.trim();
          return [key, trimmed === '' ? undefined : trimmed];
        }
        return [key, value];
      })
      .filter(([, value]) => value !== undefined),
  );

const buildSubmitPayload = (form) => {
  const payload = sanitizePayload(form);
  if (form.preferredDomains.length) {
    payload.preferredDomains = form.preferredDomains;
    payload.domainId = form.preferredDomains[0];
  }
  return payload;
};

const toggleListValue = (list, value) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

const focusField = (key) => {
  requestAnimationFrame(() => {
    const el = document.querySelector(`[data-field="${key}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.querySelector('input:not([tabindex="-1"]), select, textarea, button')?.focus({ preventScroll: true });
  });
};

function FieldWrap({ field, label, required, hint, error, children, fullWidth = false }) {
  return (
    <div data-field={field} className={`input-group ${fullWidth ? 'reg-span-2' : ''} ${error ? 'has-error' : ''}`}>
      <label>
        {label}
        {required && <span className="req-star"> *</span>}
      </label>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}

function IdCardUpload({ value, onChange, onError, disabled }) {
  const inputRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const [info, setInfo] = useState('');

  const handlePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setProcessing(true);
    try {
      const { dataUrl, bytes } = await compressImage(file);
      onChange(dataUrl);
      setInfo(`${file.name} · ${Math.max(1, Math.round(bytes / 1024))} KB ready`);
    } catch (err) {
      onError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="idcard-upload-box">
      <button
        type="button"
        className="idcard-preview-btn"
        onClick={() => inputRef.current?.click()}
        disabled={processing || disabled}
        aria-label={value ? 'Change college ID card photo' : 'Upload college ID card photo'}
      >
        {processing ? (
          <span className="idcard-status-txt">PROCESSING...</span>
        ) : value ? (
          <img src={value} alt="College ID card preview" className="idcard-preview-img" />
        ) : (
          <div className="idcard-placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="2" />
              <path d="M15 8h2M15 12h2M7 16h10" />
            </svg>
            <span>UPLOAD ID</span>
          </div>
        )}
      </button>

      <div className="idcard-meta">
        <p>
          Upload a clear photo or scan of the <strong>front of your college ID card</strong> showing your name and photo.
          Only organizers and campus coordinators see it during verification.
        </p>
        <span className="idcard-file-info">{info || 'JPG, PNG, or WebP · Auto-resized under 1.5 MB.'}</span>
        <button
          type="button"
          className="reg-secondary-btn"
          onClick={() => inputRef.current?.click()}
          disabled={processing || disabled}
        >
          {value ? 'CHANGE PHOTO' : 'CHOOSE PHOTO'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="sr-only-input"
        onChange={handlePick}
      />
    </div>
  );
}

function FormHeader({ title = 'Reservation requisition form' }) {
  return (
    <header className="req-head">
      <div className="req-head-top">
        <span>12026 · TECHXPRESS</span>
        <span className="req-head-hindi" lang="hi">यहाँ रजिस्टर करें</span>
      </div>
      <h1 className="req-head-title">
        <span className="req-head-kicker">Reservation counter</span>
        {title}
      </h1>
    </header>
  );
}

export const RegistrationPage = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [bannerError, setBannerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const [institutions, setInstitutions] = useState([]);
  const [domains, setDomains] = useState([]);
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);
  const [taxonomyError, setTaxonomyError] = useState('');

  const fetchMetadata = useCallback(async () => {
    const [instRes, domRes, statusRes] = await Promise.all([
      api.get('/api/taxonomy/institutions'),
      api.get('/api/taxonomy/domains'),
      api.get('/api/registration/status').catch(() => null),
    ]);
    if (!instRes || !domRes) throw new Error('Unable to connect to the TechXpress registration API.');
    return {
      institutions: instRes?.institutions ?? [],
      domains: domRes?.domains ?? [],
      registrationClosed: statusRes?.open === false,
    };
  }, []);

  const loadMetadata = useCallback(async () => {
    setTaxonomyLoading(true);
    setTaxonomyError('');
    try {
      const data = await fetchMetadata();
      setInstitutions(data.institutions);
      setDomains(data.domains);
      setRegistrationClosed(data.registrationClosed);
    } catch (err) {
      setTaxonomyError(err.message || 'Unable to connect to the TechXpress registration API.');
    } finally {
      setTaxonomyLoading(false);
    }
  }, [fetchMetadata]);

  useEffect(() => {
    let active = true;
    fetchMetadata()
      .then((data) => {
        if (!active) return;
        setInstitutions(data.institutions);
        setDomains(data.domains);
        setRegistrationClosed(data.registrationClosed);
      })
      .catch((err) => {
        if (!active) return;
        setTaxonomyError(err.message || 'Unable to connect to the TechXpress registration API.');
      })
      .finally(() => {
        if (active) setTaxonomyLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchMetadata]);

  const sortedDomains = useMemo(
    () => [...domains].sort((a, b) => a.name.localeCompare(b.name)),
    [domains],
  );

  const clearError = (...keys) => {
    setErrors((prev) => {
      if (!keys.some((k) => prev[k])) return prev;
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });
    if (bannerError) setBannerError('');
  };

  const setField = (key) => (e) => {
    const raw = e.target.value;
    const value = key === 'registrationNo' ? normalizeRegistrationNo(raw) : raw;
    setForm((prev) => ({ ...prev, [key]: value, ...(key === 'institutionId' && { branch: '' }) }));
    clearError(key, ...(key === 'institutionId' ? ['branch'] : []));
  };

  const needsBranch = institutions.find((i) => i.id === form.institutionId)?.name === BRANCH_INSTITUTION_NAME;

  const toggleContribution = (area) => {
    setForm((prev) => {
      const exists = prev.contributionAreas.includes(area);
      if (!exists && prev.contributionAreas.length >= 12) return prev;
      return { ...prev, contributionAreas: toggleListValue(prev.contributionAreas, area) };
    });
    clearError('contributionAreas');
  };

  const toggleDomain = (domainId) => {
    setForm((prev) => {
      const next = toggleListValue(prev.preferredDomains, domainId).slice(0, 4);
      return { ...prev, preferredDomains: next, domainId: next[0] ?? '' };
    });
    clearError('preferredDomains', 'domainId');
  };

  const handleNormalizeUrl = (key) => () => {
    setForm((prev) => ({ ...prev, [key]: normalizeUrl(prev[key]) }));
  };

  const reportErrors = (errs) => {
    setErrors(errs);
    const keys = FIELD_ORDER.filter((k) => errs[k]);
    const first = keys[0] ?? Object.keys(errs)[0];
    const count = Object.keys(errs).length;
    setBannerError(
      count === 1
        ? `${FIELD_LABELS[first] ?? 'Field'}: ${errs[first]}`
        : `Please fix ${count} highlighted fields — starting with ${FIELD_LABELS[first] ?? 'the first error'}.`,
    );
    focusField(first === 'domainId' ? 'preferredDomains' : first);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy || registrationClosed) return;

    const normalized = { ...form };
    for (const key of URL_FIELDS) normalized[key] = normalizeUrl(normalized[key]);
    setForm(normalized);

    const clientErrors = validateRegistration(normalized, { needsBranch });
    if (Object.keys(clientErrors).length) {
      reportErrors(clientErrors);
      return;
    }

    setErrors({});
    setBannerError('');
    setBusy(true);

    try {
      const res = await api.post('/api/registration', buildSubmitPayload(normalized));
      const selectedInstitution = institutions.find((i) => i.id === normalized.institutionId)?.name ?? '';
      const primaryDomain = domains.find((d) => d.id === normalized.domainId)?.name ?? '';
      setSubmitted({
        response: res,
        registrationNo: normalized.registrationNo,
        email: normalized.email.trim(),
        institutionName: selectedInstitution,
        primaryDomain,
      });
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR') {
        const fieldErrs = err.details?.body ?? err.details ?? {};
        const flat = {};
        for (const [key, value] of Object.entries(fieldErrs)) {
          flat[key] = Array.isArray(value) ? value[0] : String(value);
        }
        reportErrors(flat);
      } else if (err.code === 'CONFLICT') {
        setBannerError(err.message || 'You may already be registered. Check your PNR status or contact the organizers.');
      } else if (err.code === 'REGISTRATION_CLOSED') {
        setRegistrationClosed(true);
        setBannerError(err.message);
      } else {
        setBannerError(err.message || 'Registration submission failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    const user = submitted.response?.user;
    const rows = [
      ['PASSENGER', user?.fullName || form.fullName],
      ['EMAIL', user?.email || form.email],
      ['REGD. NUMBER', submitted.registrationNo],
      ['INSTITUTION', submitted.institutionName],
      ['PRIMARY DOMAIN', submitted.primaryDomain],
      ['PASSENGER REF', user?.publicId, true],
    ].filter(([, v]) => v);
    return (
      <article className="m-book m-book--slip">
        <FormHeader title="Reservation slip" />
        <div className="paper paper--form slip">
          <div className="slip-top">
            <p className="slip-message">
              {submitted.response?.message || 'Registration submitted. Awaiting organizer verification.'}
            </p>
            <div className="rubber-stamp rubber-stamp--wait" aria-hidden="true">
              <span className="rubber-stamp-top">PNR · TECHXPRESS JN.</span>
              <span className="rubber-stamp-label">WAITLISTED</span>
              <span className="rubber-stamp-bottom">12026</span>
            </div>
          </div>
          <dl className="slip-rows">
            {rows.map(([k, v, mono]) => (
              <div key={k} className="slip-row">
                <dt>{k}</dt>
                <dd className={mono ? 'slip-mono' : undefined}>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="notice-box">
            Your profile and college ID card are now in the verification queue. Once approved by campus coordinators or organizers, your login credentials will be sent to your email.
          </p>
          <div className="slip-actions">
            <a className="txp-btn txp-btn--ink" href="/#pnr">
              Check PNR status
            </a>
            <Link className="txp-btn txp-btn--ghost" to="/login">
              Go to login →
            </Link>
          </div>
        </div>
      </article>
    );
  }

  if (registrationClosed) {
    return (
      <article className="m-book m-book--closed">
        <FormHeader />
        <div className="shutter" role="status">
          <div className="shutter-slats" aria-hidden="true" />
          <div className="shutter-sign">
            <p className="shutter-hindi" lang="hi">यहाँ रजिस्टर करें</p>
            <h2 className="shutter-title">Booking closed</h2>
            <p className="shutter-note">Meanwhile, check the timetable or ask at the enquiry counter.</p>
            <div className="shutter-actions">
              <a className="txp-btn txp-btn--paper" href="/#timetable">Timetable</a>
              <a className="txp-btn txp-btn--paper" href="/#faq">Enquiry</a>
              <a className="txp-btn txp-btn--paper" href="/#pnr">PNR status</a>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="m-book">
      <FormHeader />
      <div className="paper paper--form">
        <div className="req-formno" aria-hidden="true">
          <span>FORM Nº TXP-1</span>
          <span>12026</span>
        </div>

        {taxonomyError && (
          <div className="reg-alert reg-alert-error">
            <span>{taxonomyError}</span>
            <button type="button" className="reg-retry-btn" onClick={loadMetadata}>
              RETRY CONNECTION
            </button>
          </div>
        )}

        {bannerError && (
          <div className="reg-alert reg-alert-error" role="alert">
            {bannerError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div aria-hidden="true" className="honeypot-field">
            <label>
              Website
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={setField('website')}
              />
            </label>
          </div>

          {/* 01. Identity */}
          <section className="reg-section">
            <div className="reg-section-head">
              <span className="reg-step-num">01</span>
              <div>
                <h3>PASSENGER IDENTITY</h3>
                <p>Required credentials and institutional ID card verification.</p>
              </div>
            </div>

            <div className="reg-grid">
              <FieldWrap field="fullName" label="FULL NAME" required error={errors.fullName}>
                <input
                  type="text"
                  placeholder="John Doe"
                  maxLength={120}
                  value={form.fullName}
                  onChange={setField('fullName')}
                  disabled={busy}
                />
              </FieldWrap>

              <FieldWrap field="email" label="EMAIL ADDRESS" required error={errors.email}>
                <input
                  type="email"
                  placeholder="name@college.edu"
                  value={form.email}
                  onChange={setField('email')}
                  disabled={busy}
                />
              </FieldWrap>

              <FieldWrap
                field="registrationNo"
                label="REGISTRATION NUMBER"
                required
                hint="Issued by your institution (auto-formatted)."
                error={errors.registrationNo}
              >
                <input
                  type="text"
                  placeholder="2024PS12345"
                  maxLength={50}
                  value={form.registrationNo}
                  onChange={setField('registrationNo')}
                  disabled={busy}
                />
              </FieldWrap>

              <FieldWrap field="phone" label="PHONE NUMBER" error={errors.phone}>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="9876543210"
                  maxLength={10}
                  value={form.phone}
                  onChange={setField('phone')}
                  disabled={busy}
                />
              </FieldWrap>

              <FieldWrap field="gender" label="GENDER" required error={errors.gender}>
                <select value={form.gender} onChange={setField('gender')} disabled={busy}>
                  <option value="" disabled>Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other / Prefer not to say</option>
                </select>
              </FieldWrap>

              <FieldWrap field="tshirtSize" label="T-SHIRT SIZE" required error={errors.tshirtSize}>
                <select value={form.tshirtSize} onChange={setField('tshirtSize')} disabled={busy}>
                  <option value="" disabled>Select size</option>
                  {TSHIRT_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </FieldWrap>

              <FieldWrap field="idCard" label="COLLEGE ID CARD PHOTO" required error={errors.idCard} fullWidth>
                <IdCardUpload
                  value={form.idCard}
                  onChange={(dataUrl) => {
                    setForm((prev) => ({ ...prev, idCard: dataUrl }));
                    clearError('idCard');
                  }}
                  onError={(msg) => setErrors((prev) => ({ ...prev, idCard: msg }))}
                  disabled={busy}
                />
              </FieldWrap>
            </div>
          </section>

          {/* 02. Academic */}
          <section className="reg-section">
            <div className="reg-section-head">
              <span className="reg-step-num">02</span>
              <div>
                <h3>ACADEMIC STATION</h3>
                <p>Institution, preferred domains (exactly 4), and academic standing.</p>
              </div>
            </div>

            <div className="reg-grid">
              <FieldWrap field="institutionId" label="INSTITUTION" required error={errors.institutionId}>
                <select
                  value={form.institutionId}
                  onChange={setField('institutionId')}
                  disabled={busy || taxonomyLoading}
                >
                  <option value="">
                    {taxonomyLoading ? 'Loading institutions...' : 'Select institution...'}
                  </option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </FieldWrap>

              <FieldWrap field="degree" label="DEGREE" required error={errors.degree}>
                <select value={form.degree} onChange={setField('degree')} disabled={busy}>
                  <option value="">Select degree...</option>
                  {DEGREE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </FieldWrap>

              {needsBranch && (
                <FieldWrap field="branch" label="BRANCH" required error={errors.branch}>
                  <select value={form.branch} onChange={setField('branch')} disabled={busy}>
                    <option value="">Select branch...</option>
                    {BRANCH_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </FieldWrap>
              )}

              <FieldWrap
                field="yearSemester"
                label="YEAR / SEMESTER"
                required
                error={errors.yearSemester}
                fullWidth
              >
                <select value={form.yearSemester} onChange={setField('yearSemester')} disabled={busy}>
                  <option value="" disabled>Select year / semester</option>
                  {YEAR_SEMESTER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </FieldWrap>

              <FieldWrap
                field="preferredDomains"
                label="PREFERRED DOMAINS (PICK 1 TO 4)"
                required
                hint="Your #1 pick is your primary domain for qualification and team matching."
                error={errors.preferredDomains ?? errors.domainId}
                fullWidth
              >
                {taxonomyLoading ? (
                  <div className="pill-loading">Loading domains from station registry...</div>
                ) : (
                  <div className="reg-pill-grid">
                    {sortedDomains.map((dom) => {
                      const rank = form.preferredDomains.indexOf(dom.id);
                      const active = rank !== -1;
                      const atCap = !active && form.preferredDomains.length >= 4;
                      return (
                        <button
                          key={dom.id}
                          type="button"
                          disabled={busy || atCap}
                          aria-pressed={active}
                          className={`reg-pill ${active ? 'active' : ''}`}
                          onClick={() => toggleDomain(dom.id)}
                        >
                          <span>{dom.name}</span>
                          {active && <span className="pill-rank">#{rank + 1}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </FieldWrap>
            </div>
          </section>

          {/* 03. Skills & Contribution */}
          <section className="reg-section">
            <div className="reg-section-head">
              <span className="reg-step-num">03</span>
              <div>
                <h3>SKILLS &amp; CREW ROLE</h3>
                <p>How you contribute on board and your preferred team role.</p>
              </div>
            </div>

            <div className="reg-grid">
              <FieldWrap
                field="contributionAreas"
                label="CONTRIBUTION AREAS (PICK AT LEAST 1, UP TO 12)"
                required
                error={errors.contributionAreas}
                fullWidth
              >
                <div className="reg-pill-grid">
                  {CONTRIBUTION_AREA_OPTIONS.map((area) => {
                    const active = form.contributionAreas.includes(area);
                    const atCap = !active && form.contributionAreas.length >= 12;
                    return (
                      <button
                        key={area}
                        type="button"
                        disabled={busy || atCap}
                        aria-pressed={active}
                        className={`reg-pill ${active ? 'active' : ''}`}
                        onClick={() => toggleContribution(area)}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
              </FieldWrap>

              <FieldWrap
                field="preferredTeamRole"
                label="PREFERRED TEAM ROLE"
                required
                error={errors.preferredTeamRole}
                fullWidth
              >
                <select value={form.preferredTeamRole} onChange={setField('preferredTeamRole')} disabled={busy}>
                  <option value="">Select preferred role...</option>
                  {TEAM_ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </FieldWrap>

              <FieldWrap
                field="technicalSkills"
                label="TECHNICAL SKILLS"
                hint="Optional — stack, tools, labs, platforms (max 500 chars)."
                error={errors.technicalSkills}
              >
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="React, Node.js, Python, Figma, SQL, Embedded..."
                  value={form.technicalSkills}
                  onChange={setField('technicalSkills')}
                  disabled={busy}
                />
              </FieldWrap>

              <FieldWrap
                field="nonTechnicalSkills"
                label="NON-TECHNICAL SKILLS"
                hint="Optional — pitching, leadership, research, outreach (max 500 chars)."
                error={errors.nonTechnicalSkills}
              >
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="Leadership, communication, product strategy, documentation..."
                  value={form.nonTechnicalSkills}
                  onChange={setField('nonTechnicalSkills')}
                  disabled={busy}
                />
              </FieldWrap>
            </div>
          </section>

          {/* 04. Profiles & Experience (Optional) */}
          <section className="reg-section">
            <div className="reg-section-head">
              <span className="reg-step-num">04</span>
              <div>
                <h3>PROFILES &amp; WORK (OPTIONAL)</h3>
                <p>Share any links, projects, or prior participation you want evaluators to see.</p>
              </div>
            </div>

            <div className="reg-grid">
              <FieldWrap field="linkedinUrl" label="LINKEDIN PROFILE" error={errors.linkedinUrl}>
                <input
                  type="text"
                  inputMode="url"
                  placeholder="https://linkedin.com/in/..."
                  value={form.linkedinUrl}
                  onChange={setField('linkedinUrl')}
                  onBlur={handleNormalizeUrl('linkedinUrl')}
                  disabled={busy}
                />
              </FieldWrap>

              <FieldWrap field="githubUrl" label="GITHUB / TECHNICAL PROFILE" error={errors.githubUrl}>
                <input
                  type="text"
                  inputMode="url"
                  placeholder="https://github.com/..."
                  value={form.githubUrl}
                  onChange={setField('githubUrl')}
                  onBlur={handleNormalizeUrl('githubUrl')}
                  disabled={busy}
                />
              </FieldWrap>

              <FieldWrap
                field="resumeDriveLink"
                label="RESUME / CV DRIVE LINK"
                hint="Paste a shared Google Drive link."
                error={errors.resumeDriveLink}
              >
                <input
                  type="text"
                  inputMode="url"
                  placeholder="https://drive.google.com/..."
                  value={form.resumeDriveLink}
                  onChange={setField('resumeDriveLink')}
                  onBlur={handleNormalizeUrl('resumeDriveLink')}
                  disabled={busy}
                />
              </FieldWrap>

              <FieldWrap field="researchPublicationUrl" label="PUBLICATION LINK" error={errors.researchPublicationUrl}>
                <input
                  type="text"
                  inputMode="url"
                  placeholder="https://doi.org/..."
                  value={form.researchPublicationUrl}
                  onChange={setField('researchPublicationUrl')}
                  onBlur={handleNormalizeUrl('researchPublicationUrl')}
                  disabled={busy}
                />
              </FieldWrap>

              <FieldWrap
                field="certificationsAchievements"
                label="CERTIFICATIONS / LICENSES"
                error={errors.certificationsAchievements}
              >
                <textarea
                  rows={3}
                  maxLength={1500}
                  placeholder="Licenses, certifications, fellowships..."
                  value={form.certificationsAchievements}
                  onChange={setField('certificationsAchievements')}
                  disabled={busy}
                />
              </FieldWrap>

              <FieldWrap field="projectInitiative" label="PROJECT / INITIATIVE" error={errors.projectInitiative}>
                <textarea
                  rows={3}
                  maxLength={1500}
                  placeholder="Startup, project, society, or initiative you are building..."
                  value={form.projectInitiative}
                  onChange={setField('projectInitiative')}
                  disabled={busy}
                />
              </FieldWrap>

              <FieldWrap
                field="participationExperience"
                label="PARTICIPATION EXPERIENCE"
                error={errors.participationExperience}
                fullWidth
              >
                <textarea
                  rows={3}
                  maxLength={1500}
                  placeholder="Competitions, moot courts, case challenges, paper presentations, community work..."
                  value={form.participationExperience}
                  onChange={setField('participationExperience')}
                  disabled={busy}
                />
              </FieldWrap>
            </div>
          </section>

          {/* 05. Bio & Background */}
          <section className="reg-section">
            <div className="reg-section-head">
              <span className="reg-step-num">05</span>
              <div>
                <h3>PASSENGER BRIEFING</h3>
                <p>Bio is required; achievements and hackathon experience are optional.</p>
              </div>
            </div>

            <div className="reg-grid">
              <FieldWrap
                field="bio"
                label="SHORT BIO"
                required
                hint={`${form.bio.length}/1000 characters`}
                error={errors.bio}
                fullWidth
              >
                <textarea
                  rows={4}
                  maxLength={1000}
                  placeholder="Tell us what you build, study, care about, and the kind of team you want to join."
                  value={form.bio}
                  onChange={setField('bio')}
                  disabled={busy}
                />
              </FieldWrap>

              <FieldWrap field="achievements" label="ACHIEVEMENTS" error={errors.achievements}>
                <textarea
                  rows={3}
                  maxLength={1500}
                  placeholder="Highlight work or awards you are proud of..."
                  value={form.achievements}
                  onChange={setField('achievements')}
                  disabled={busy}
                />
              </FieldWrap>

              <FieldWrap field="hackathonExperience" label="HACKATHON EXPERIENCE" error={errors.hackathonExperience}>
                <textarea
                  rows={3}
                  maxLength={1500}
                  placeholder="Prior hackathons, roles, outcomes..."
                  value={form.hackathonExperience}
                  onChange={setField('hackathonExperience')}
                  disabled={busy}
                />
              </FieldWrap>
            </div>
          </section>

          <div className="reg-submit-footer">
            <p className="reg-consent">
              By submitting, you agree to organizer verification of your college ID and TechXpress event guidelines.
            </p>
            <button
              type="submit"
              className="submit-btn"
              disabled={busy || registrationClosed || taxonomyLoading}
            >
              {busy ? 'ISSUING BOARDING REQUEST...' : 'SUBMIT STUDENT REGISTRATION'}
            </button>
          </div>
        </form>
      </div>
    </article>
  );
};
