import net from 'node:net';
import { env, isProd } from '../config/env.js';
import { logger } from './logger.js';
import { COMMUNITY_LINKS } from '../config/community.js';
import { AppError } from './errors.js';

// Transactional email via Cloudflare Email Service (REST API).
//
//   POST https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/email/sending/send
//   Authorization: Bearer {CF_EMAIL_API_TOKEN}   (token with "Email Sending Write" only)
//
// Sending is enabled only when MAIL_FROM, CF_ACCOUNT_ID and CF_EMAIL_API_TOKEN
// are all set; MAIL_FROM must be on the domain onboarded in Email Service,
// e.g. "TechXpress <noreply@your-domain>". Without them, mail is logged and
// skipped so local dev still works.
//
// Every helper resolves to { delivered: boolean, ... } and never throws, so a
// mail outage can't break the business action that triggered it. Swapping
// provider means replacing only `deliver()` below.

const SEND_TIMEOUT_MS = 10_000;

// "Name <addr@x>" -> { address, name }; a bare address -> { address }.
const parseAddress = (value) => {
  const match = /^\s*(.*?)\s*<\s*([^>]+?)\s*>\s*$/.exec(value);
  if (!match) return { address: value.trim() };
  const name = match[1].replace(/^"|"$/g, '');
  return name ? { address: match[2], name } : { address: match[2] };
};

const FROM = env.MAIL_FROM ? parseAddress(env.MAIL_FROM) : null;
const REPLY_TO = env.MAIL_REPLY_TO;
const cfEnabled = Boolean(FROM && env.CF_ACCOUNT_ID && env.CF_EMAIL_API_TOKEN);
const smtpEnabled = Boolean(!isProd && !cfEnabled && env.SMTP_HOST);
const effectiveFrom = FROM ?? (smtpEnabled ? { address: 'noreply@localhost', name: 'TechXpress Dev' } : null);
const enabled = cfEnabled || smtpEnabled;
const SEND_URL = cfEnabled
  ? `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CF_ACCOUNT_ID)}/email/sending/send`
  : null;

if (!enabled) {
  const msg = 'mail.disabled — MAIL_FROM, CF_ACCOUNT_ID or CF_EMAIL_API_TOKEN is not set; emails will be logged and skipped';
  if (isProd) logger.error(msg);
  else logger.warn(msg);
} else if (smtpEnabled) {
  logger.info('mail.smtp.dev — routing local emails to SMTP', { host: env.SMTP_HOST, port: env.SMTP_PORT });
}

// Minimal unauthenticated SMTP client for local Mailpit testing (!isProd only).
const deliverSmtp = ({ to, subject, text, html }) =>
  new Promise((resolve) => {
    const socket = net.createConnection({ host: env.SMTP_HOST, port: env.SMTP_PORT });
    socket.setTimeout(SEND_TIMEOUT_MS);

    const boundary = `txp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const fromHeader = effectiveFrom.name
      ? `"${effectiveFrom.name.replace(/"/g, '')}" <${effectiveFrom.address}>`
      : effectiveFrom.address;
    const dotStuff = (s) => String(s ?? '').replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');
    const rawBody = [
      `From: ${fromHeader}`,
      `To: <${to}>`,
      ...(REPLY_TO ? [`Reply-To: ${REPLY_TO}`] : []),
      `Subject: ${String(subject).replace(/[\r\n]+/g, ' ')}`,
      'MIME-Version: 1.0',
      html
        ? `Content-Type: multipart/alternative; boundary="${boundary}"`
        : 'Content-Type: text/plain; charset=utf-8',
      '',
      ...(html
        ? [
            `--${boundary}`,
            'Content-Type: text/plain; charset=utf-8',
            '',
            dotStuff(text),
            `--${boundary}`,
            'Content-Type: text/html; charset=utf-8',
            '',
            dotStuff(html),
            `--${boundary}--`,
          ]
        : [dotStuff(text)]),
      '.',
    ].join('\r\n');

    const steps = [
      { expect: 220, send: 'EHLO localhost' },
      { expect: 250, send: `MAIL FROM:<${effectiveFrom.address}>` },
      { expect: 250, send: `RCPT TO:<${to}>` },
      { expect: 250, send: 'DATA' },
      { expect: 354, send: rawBody },
      { expect: 250, send: 'QUIT' },
    ];

    let stepIdx = 0;
    let buf = '';
    let settled = false;
    const finish = (out) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(out);
    };

    socket.on('timeout', () => finish({ delivered: false, error: 'SMTP timeout' }));
    socket.on('error', (err) => finish({ delivered: false, error: `${err.name}: ${err.message}` }));
    socket.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      const lines = buf.split('\r\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line || line[3] === '-') continue; // wait for final multiline SMTP line
        const code = Number.parseInt(line.slice(0, 3), 10);
        const step = steps[stepIdx];
        if (!step) return;
        if (code !== step.expect) {
          return finish({ delivered: false, error: `SMTP ${code}: ${line}` });
        }
        stepIdx += 1;
        socket.write(`${step.send}\r\n`);
        if (stepIdx === steps.length) {
          return finish({ delivered: true, id: `smtp-${Date.now()}` });
        }
      }
    });
  });

// Sends one message. Resolves to { delivered, id?, error? }; never throws.
const deliver = async ({ to, subject, text, html }) => {
  if (smtpEnabled) return deliverSmtp({ to, subject, text, html });
  let res;
  let body = null;
  try {
    res = await fetch(SEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.CF_EMAIL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: effectiveFrom,
        to,
        ...(REPLY_TO ? { reply_to: REPLY_TO } : {}),
        subject,
        text,
        ...(html ? { html } : {}),
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    body = await res.json().catch(() => null);
  } catch (err) {
    return { delivered: false, error: `${err.name}: ${err.message}` };
  }

  if (!res.ok || !body?.success) {
    const first = body?.errors?.[0];
    const error = first ? `${first.code} ${first.message}` : `HTTP ${res.status}`;
    return { delivered: false, error, status: res.status };
  }

  // A 200 can still report the recipient as bounced or suppressed.
  const result = body.result ?? {};
  const rejected = [...(result.permanent_bounces ?? []), ...(result.suppressed_recipients ?? [])];
  if (rejected.length) {
    return { delivered: false, id: result.message_id, error: 'recipient bounced or suppressed' };
  }
  return { delivered: true, id: result.message_id };
};

// Login page, included in credential emails.
const loginUrl = () => (env.APP_URL ? `${env.APP_URL.replace(/\/+$/, '')}/login` : null);

// User-supplied values (names, rejection reasons) must never be interpreted
// as HTML inside the email body.
const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

// heading/intro/footer are trusted template strings; callers escape any
// user-supplied parts before passing them in.
const wrapHtml = ({ heading, intro, body, footer }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Vortex</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;color:#f5f5f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#121212;border:1px solid #1c1c1c;border-radius:4px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid #1c1c1c;">
                <span style="font-size:14px;font-weight:800;letter-spacing:0.22em;color:#f5f5f5;">VORTEX</span>
                <span style="color:#666;margin:0 6px;">·</span>
                <span style="font-size:11px;letter-spacing:0.2em;color:#22d3ee;text-transform:uppercase;">Mission Control</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 8px 28px;">
                <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.25;font-weight:800;color:#f5f5f5;letter-spacing:-0.01em;">${heading}</h1>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#a3a3a3;">${intro}</p>
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 28px 28px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#666;">${footer}</p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:11px;color:#404040;">You received this because you registered for SOA TECHEXPRESS 2026.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const credBlock = ({ email, password }) => `
  <div style="margin:16px 0 20px 0;padding:16px 18px;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:4px;font-family:'Courier New',Courier,monospace;font-size:13px;color:#f5f5f5;">
    <div style="margin-bottom:8px;"><span style="color:#666;">Email&nbsp;&nbsp;&nbsp;&nbsp;</span> ${escapeHtml(email)}</div>
    <div><span style="color:#666;">Password</span> <span style="color:#22d3ee;font-weight:bold;">${escapeHtml(password)}</span></div>
  </div>
`;

// Login link block for credential emails (empty when APP_URL is unset).
const loginButton = () => {
  const url = loginUrl();
  if (!url) return '';
  return `
  <p style="margin:0 0 20px 0;">
    <a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 18px;background:#22d3ee;color:#0a0a0a;font-size:13px;font-weight:bold;text-decoration:none;border-radius:4px;">Log in to Vortex</a>
  </p>
`;
};
const loginLine = () => (loginUrl() ? `Log in at: ${loginUrl()}\n\n` : '');

// "Join the community" block for the approval email. Links come from
// config/community.js; empty ones are left out, and with none set the block
// disappears entirely.
const communityLinks = () => [
  ['WhatsApp group', COMMUNITY_LINKS.whatsapp, '#25d366'],
  ['Discord server', COMMUNITY_LINKS.discord, '#5865f2'],
].filter(([, url]) => typeof url === 'string' && /^https:\/\//.test(url.trim()));

const communityBlock = () => {
  const links = communityLinks();
  if (!links.length) return '';
  const buttons = links.map(([label, url, color]) =>
    `<a href="${escapeHtml(url.trim())}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 16px;background:${color};color:#ffffff;font-size:13px;font-weight:bold;text-decoration:none;border-radius:4px;">Join the ${label}</a>`).join('');
  return `
  <div style="margin:4px 0 20px 0;padding:14px 16px;border:1px solid #2a2a2a;border-radius:4px;">
    <div style="margin:0 0 10px 0;font-size:13px;color:#d4d4d4;">Join the community for announcements, team-finding and help:</div>
    ${buttons}
  </div>
`;
};
const communityLines = () => {
  const links = communityLinks();
  if (!links.length) return '';
  return `Join the community:\n${links.map(([label, url]) => `  ${label}: ${url.trim()}`).join('\n')}\n\n`;
};

export const sendMail = async ({ to, subject, text, html }) => {
  if (!enabled) {
    logger.warn('mail.skipped — mail is not configured', { to, subject });
    return { delivered: false, reason: 'not-configured' };
  }
  const out = await deliver({ to, subject, text, html });
  if (out.delivered) logger.info('mail.sent', { to, subject, id: out.id });
  else logger.error('mail.failed', { to, subject, err: out.error, status: out.status, id: out.id });
  return out;
};

// Used where a password change must not stand unless its email went out:
// inside the transaction that saves the change, so a failed send rolls it back.
export const requireDelivered = (mail) => {
  if (!mail.delivered) {
    throw new AppError(502, 'MAIL_NOT_SENT',
      'The email could not be sent, so nothing was changed. Check the mail settings and try again.',
      { mailError: mail.error ?? mail.reason ?? null }); // 'not-configured' when mail is off
  }
  return mail;
};

export const sendVerificationApprovedMail = ({ to, fullName, password }) =>
  sendMail({
    to,
    subject: 'Your Vortex account is verified',
    text:
      `Hi ${fullName},\n\n` +
      `Your registration has been verified.\n` +
      `Use the credentials below to log in:\n\n` +
      `  Email:    ${to}\n` +
      `  Password: ${password}\n\n` +
      loginLine() +
      communityLines() +
      `Keep this password safe — it is your only credential.\n` +
      `If you lose it, contact the organizers to reissue.\n`,
    html: wrapHtml({
      heading: `Welcome, ${escapeHtml(fullName)}.`,
      intro: 'Your registration has been verified. You can now log in to Vortex with the credentials below.',
      body: credBlock({ email: to, password }) + loginButton() + communityBlock(),
      footer: 'Keep this password safe — it is your only login credential. If you lose it, contact the organizers to reissue a new one.',
    }),
  });

export const sendVerificationRejectedMail = ({ to, fullName, reason }) =>
  sendMail({
    to,
    subject: 'Vortex registration update',
    text:
      `Hi ${fullName},\n\n` +
      `Your registration was not approved.\n` +
      (reason ? `Reason: ${reason}\n\n` : '\n') +
      `Reach out to the organizers if you believe this is an error.\n`,
    html: wrapHtml({
      heading: 'Registration not approved',
      intro: `Hi ${escapeHtml(fullName)}, your Vortex registration was not approved.`,
      body: reason
        ? `<div style="margin:8px 0 16px 0;padding:14px 16px;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:4px;font-size:13px;color:#f5f5f5;"><strong style="color:#fbbf24;">Reason:</strong> ${escapeHtml(reason)}</div>`
        : '',
      footer: 'Reach out to the organizers if you believe this is an error.',
    }),
  });

// The registration was removed so the student can register again: either the
// ID card photo couldn't be read (pending), or an admin is giving a rejected
// student a second try (previouslyRejected).
export const sendReregisterRequestMail = ({ to, fullName, note, previouslyRejected = false }) => {
  const registerUrl = env.APP_URL ? `${env.APP_URL.replace(/\/+$/, '')}/register` : null;
  const why = previouslyRejected
    ? 'Your earlier Vortex registration was not approved. The organizers have cleared it, so you can register again.'
    : 'We couldn’t verify your Vortex registration because your college ID card photo wasn’t clear enough. Your earlier registration has been removed.';
  const tips = previouslyRejected
    ? 'Make sure your details match your college ID card and upload a clear photo of its front.'
    : 'Register again with a clear photo of the front of your ID card: name, photo and registration number readable, no glare or blur.';
  return sendMail({
    to,
    subject: previouslyRejected ? 'You can register again for Vortex' : 'Action needed: please register again for Vortex',
    text:
      `Hi ${fullName},\n\n${why}\n` +
      (note ? `Note from the organizers: ${note}\n` : '') +
      `\n${tips}${registerUrl ? `\n${registerUrl}` : ''}\n\n` +
      `You can use the same email and registration number.\n`,
    html: wrapHtml({
      heading: 'Please register again',
      intro: `Hi ${escapeHtml(fullName)}, ${escapeHtml(why.charAt(0).toLowerCase() + why.slice(1))}`,
      body:
        (note
          ? `<div style="margin:8px 0 16px 0;padding:14px 16px;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:4px;font-size:13px;color:#f5f5f5;"><strong style="color:#fbbf24;">Note from the organizers:</strong> ${escapeHtml(note)}</div>`
          : '') +
        `<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#d4d4d4;">${escapeHtml(tips)} You can use the same email and registration number.</p>` +
        (registerUrl
          ? `<p style="margin:0 0 8px 0;"><a href="${escapeHtml(registerUrl)}" style="display:inline-block;padding:12px 20px;background:#22d3ee;color:#000;text-decoration:none;font-weight:700;border-radius:4px;">Register again</a></p>`
          : ''),
      footer: 'Reach out to the organizers if you have questions.',
    }),
  });
};

export const sendPasswordReissuedMail = ({ to, fullName, password }) =>
  sendMail({
    to,
    subject: 'Your new Vortex password',
    text:
      `Hi ${fullName},\n\n` +
      `An organizer issued you a new password for Vortex.\n\n` +
      `  Email:    ${to}\n` +
      `  Password: ${password}\n\n` +
      loginLine() +
      `Your previous password no longer works.\n`,
    html: wrapHtml({
      heading: 'New password issued',
      intro: `Hi ${escapeHtml(fullName)}, an organizer issued you a new password. Use the credentials below to log in.`,
      body: credBlock({ email: to, password }) + loginButton(),
      footer: 'Your previous password no longer works — use this new one to log in.',
    }),
  });

export const sendAccessRevokedMail = ({ to, fullName }) =>
  sendMail({
    to,
    subject: 'Vortex access revoked',
    text:
      `Hi ${fullName},\n\n` +
      `Your access to Vortex has been revoked by an organizer.\n` +
      `Contact the team if you have questions.\n`,
    html: wrapHtml({
      heading: 'Access revoked',
      intro: `Hi ${escapeHtml(fullName)}, your Vortex access has been revoked by an organizer.`,
      body: '',
      footer: 'Contact the organizers if you have questions or believe this is in error.',
    }),
  });

export const sendAccessRestoredMail = ({ to, fullName, password }) =>
  sendMail({
    to,
    subject: 'Your Vortex access has been restored',
    text:
      `Hi ${fullName},\n\n` +
      `An organizer restored your access to Vortex.\n` +
      `Use the credentials below to log in again:\n\n` +
      `  Email:    ${to}\n` +
      `  Password: ${password}\n\n` +
      loginLine() +
      `Your previous revoked password no longer works.\n`,
    html: wrapHtml({
      heading: 'Access restored',
      intro: `Hi ${escapeHtml(fullName)}, an organizer restored your access. Use the credentials below to log back in.`,
      body: credBlock({ email: to, password }) + loginButton(),
      footer: 'Your previous password no longer works — use this new one to log in.',
    }),
  });
