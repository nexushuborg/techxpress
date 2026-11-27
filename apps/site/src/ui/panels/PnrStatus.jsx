import { useEffect, useRef, useState } from 'react';
import { LABELS, PNR, UI } from '../../content/station.js';
import { checkPnr } from '../../lib/station.js';
import { goToRegister, REGISTER_URL } from '../portal.js';
import { canShareFiles, downloadTicket, shareTicket } from '../../lib/eticket.js';
import { normalizeRegistrationNo } from '../../utils/registrationNo.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const STAMP_TONE = {
  CONFIRMED: 'ok',
  WAITLISTED: 'wait',
  NOT_CONFIRMED: 'bad',
  CANCELLED: 'bad',
  NO_RESERVATION: 'none',
};

function Stamp({ status }) {
  const { label } = PNR.stamps[status];
  return (
    <div className={`rubber-stamp rubber-stamp--${STAMP_TONE[status]}`} aria-hidden="true">
      <span className="rubber-stamp-top">PNR · TECHXPRESS JN.</span>
      <span className="rubber-stamp-label">{label}</span>
      <span className="rubber-stamp-bottom">12026</span>
    </div>
  );
}

function TicketActions({ ticket }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [shareable] = useState(canShareFiles);

  const run = (kind, fn) => async () => {
    setBusy(kind);
    setError('');
    try {
      await fn(ticket);
    } catch (err) {
      setError(err?.message || 'Could not create the ticket.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="pnr-ticket-actions">
      <button type="button" className="txp-btn txp-btn--pink" onClick={run('download', downloadTicket)} disabled={Boolean(busy)}>
        {busy === 'download' ? PNR.checking : PNR.download}
      </button>
      {shareable && (
        <button type="button" className="txp-btn txp-btn--ghost" onClick={run('share', shareTicket)} disabled={Boolean(busy)}>
          {PNR.share}
        </button>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}

// PNR enquiry counter: registration number + email -> a rubber stamp.
export default function PnrStatus({ titleId, prefill }) {
  const [form, setForm] = useState(() => ({
    registrationNo: prefill?.registrationNo ?? '',
    email: prefill?.email ?? '',
  }));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  useEffect(() => {
    if (result) resultRef.current?.focus({ preventScroll: false });
  }, [result]);

  const set = (key) => (e) => {
    const v = key === 'registrationNo' ? normalizeRegistrationNo(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [key]: v }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const body = { registrationNo: form.registrationNo.trim(), email: form.email.trim() };
    const errs = {};
    if (!body.registrationNo) errs.registrationNo = UI.pnrRequired.registrationNo;
    if (!body.email) errs.email = UI.pnrRequired.email;
    else if (!EMAIL_RE.test(body.email)) errs.email = UI.pnrBadEmail;
    if (Object.keys(errs).length) {
      setErrors(errs);
      document.getElementById(`pnr-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setErrors({});
    setBusy(true);
    const r = await checkPnr(body);
    setBusy(false);
    if (r.kind === 'invalid') {
      setErrors(r.fields);
      const first = Object.keys(r.fields)[0];
      if (first) document.getElementById(`pnr-${first}`)?.focus();
      if (!Object.keys(r.fields).length) setResult({ kind: 'error', message: r.message });
      return;
    }
    setResult(r);
  };

  const field = (key, type, autoComplete) => (
    <div className={`box-field${errors[key] ? ' has-error' : ''}`}>
      <label htmlFor={`pnr-${key}`}>{PNR.fields[key]}</label>
      <input
        id={`pnr-${key}`}
        type={type}
        autoComplete={autoComplete}
        inputMode={type === 'email' ? 'email' : undefined}
        autoCapitalize={key === 'registrationNo' ? 'characters' : 'off'}
        spellCheck={false}
        value={form[key]}
        onChange={set(key)}
        disabled={busy}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `pnr-${key}-err` : undefined}
      />
      {errors[key] && <span className="field-error" id={`pnr-${key}-err`}>{errors[key]}</span>}
    </div>
  );

  const showResult = result && result.kind === 'result';

  return (
    <article className="m-pnr">
      <header className="counter-head" data-grab>
        <p className="counter-head-hindi" lang="hi">{LABELS.pnr.hindi}</p>
        <h2 id={titleId} tabIndex={-1} className="counter-head-title">{PNR.title}</h2>
        <p className="counter-head-sub">{LABELS.pnr.english}</p>
      </header>
      <div className="paper paper--form">
        {!showResult && (
          <form className="pnr-form" onSubmit={submit} noValidate>
            <p className="paper-lede">{PNR.intro}</p>
            {field('registrationNo', 'text', 'off')}
            {field('email', 'email', 'email')}
            <button type="submit" className="txp-btn txp-btn--ink txp-btn--block" disabled={busy}>
              {busy ? PNR.checking : PNR.submit}
            </button>
            <div aria-live="polite" ref={resultRef} tabIndex={-1} className="pnr-note-wrap">
              {result?.kind === 'soon' && <p className="pnr-note">{PNR.soon}</p>}
              {result?.kind === 'limited' && <p className="pnr-note pnr-note--warn">{result.message}</p>}
              {result?.kind === 'error' && <p className="pnr-note pnr-note--warn">{result.message}</p>}
            </div>
          </form>
        )}

        {showResult && (
          <section className="pnr-result" ref={resultRef} tabIndex={-1} aria-live="polite" aria-label={`${PNR.title}: ${PNR.stamps[result.status].label}`}>
            <div className="pnr-slip">
              <dl className="pnr-slip-rows">
                <div><dt>{PNR.fields.registrationNo}</dt><dd>{form.registrationNo}</dd></div>
                <div><dt>{PNR.fields.email}</dt><dd>{form.email}</dd></div>
              </dl>
              <Stamp status={result.status} />
            </div>
            <p className="pnr-result-text">
              <strong>{PNR.stamps[result.status].label}.</strong> {PNR.stamps[result.status].text}
            </p>
            {result.status === 'NO_RESERVATION' && (
              <a className="txp-btn txp-btn--pink" href={REGISTER_URL} onClick={goToRegister}>
                {LABELS.book.english}
              </a>
            )}
            {result.status === 'CONFIRMED' && result.ticket && <TicketActions ticket={result.ticket} />}
            <button type="button" className="txp-link" onClick={() => setResult(null)}>
              {UI.pnrAgain}
            </button>
          </section>
        )}
      </div>
    </article>
  );
}
