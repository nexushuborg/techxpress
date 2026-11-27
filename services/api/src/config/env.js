import 'dotenv/config';
import { z } from 'zod';

// An optional setting where an empty string (e.g. `MAIL_FROM=""` in .env)
// counts as unset.
const optionalString = (inner) =>
  z.preprocess((v) => (v === '' ? undefined : v), inner.min(1).optional());

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  // Number of reverse proxies in front of the app, so req.ip is the real client
  // IP (used by rate limiting). 1 = Cloud Run's Google front end, or the Vite
  // dev proxy. Check the `ip` field in the http logs after any change.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(1),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  DATABASE_URL: z.string().min(1),

  ACCESS_TOKEN_SECRET: z.string().min(32, 'ACCESS_TOKEN_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_EXPIRY: z.string().default('2h'),

  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173,http://localhost:5174,http://localhost:8787')
    .transform((s) => s.split(',').map((o) => o.trim()).filter(Boolean)),

  // Mount /api/admin/testing (bulk test-data import). Off unless explicitly
  // "true"; keep it off in production.
  ENABLE_TESTING_IMPORT: z
    .enum(['true', 'false', ''])
    .default('false')
    .transform((v) => v === 'true'),

  // Public URL of the website (no trailing slash), e.g. https://your-domain.
  // Used for links in emails: ${APP_URL}/login.
  APP_URL: optionalString(z.string().url()),

  // Cloudflare Email Service (transactional email). Optional — when any of
  // MAIL_FROM, CF_ACCOUNT_ID or CF_EMAIL_API_TOKEN is absent, mail.js logs and
  // skips. MAIL_FROM must be on the domain onboarded in Email Service, e.g.
  // "TechXpress <noreply@your-domain>". The token needs only the
  // "Email Sending Write" permission.
  MAIL_FROM: optionalString(z.string()),
  MAIL_REPLY_TO: optionalString(z.string().email()),
  CF_ACCOUNT_ID: optionalString(z.string()),
  CF_EMAIL_API_TOKEN: optionalString(z.string()),

  // Local dev-only SMTP fallback (e.g. Mailpit on 127.0.0.1:1025). Ignored in production.
  SMTP_HOST: optionalString(z.string()),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('[env] Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
