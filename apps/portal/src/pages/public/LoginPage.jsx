import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { homePathForRole } from '../../utils/authHome.js';

export const LoginPage = () => {
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      toast.success(`Welcome back, ${u.fullName.split(' ')[0]}.`);
      const dest = loc.state?.from ?? homePathForRole(u.role);
      nav(dest, { replace: true });
    } catch (apiErr) {
      // Account-status codes arrive in details.code (top-level code is FORBIDDEN).
      const code = apiErr.details?.code ?? apiErr.code;
      const messages = {
        ACCOUNT_PENDING: 'Your account is awaiting campus or organizer verification.',
        ACCOUNT_REJECTED: 'Your registration was not approved.',
        ACCOUNT_REVOKED: 'Your access has been revoked. Contact organizers.',
        RATE_LIMITED: 'Too many failed attempts. Please wait 15 minutes and try again.',
      };
      setErr(messages[code] ?? apiErr.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="m-book">
      <div className="counter-head">
        <div className="counter-head-hindi" lang="hi">लॉगिन काउंटर</div>
        <h1 className="counter-head-title">Sign in</h1>
        <p className="counter-head-sub">12026 TechXpress · Passenger access</p>
      </div>

      <div className="paper paper--form">
        <p className="paper-lede">
          Enter your registered email and the access code emailed to you after verification.
        </p>

        {err && (
          <div className="reg-alert" role="alert">
            <span>{err}</span>
          </div>
        )}

        <form onSubmit={submit} className="pnr-form">
          <div className="box-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@college.edu"
              disabled={busy}
            />
          </div>

          <div className="box-field">
            <label htmlFor="login-password">Access code</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              disabled={busy}
            />
            <span className="box-field-hint">Issued upon verification.</span>
          </div>

          <button type="submit" disabled={busy} className="txp-btn txp-btn--pink txp-btn--block">
            {busy ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <div className="login-divider" />

        <Link to="/register" className="txp-btn txp-btn--ghost txp-btn--block">
          New passenger? Register here
        </Link>
      </div>
    </article>
  );
};
