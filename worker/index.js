// TechXpress Worker.
//
// Static files in ./dist are served by Cloudflare before this code runs
// (assets.not_found_handling = "none"), so this only sees requests that
// matched no file. It sends page navigations to the right single-page app:
//
//   /login, /register, /dashboard, /teams, /admin/*, ...  ->  /_app/  (app shell)
//   everything else                                       ->  /       (train experience)
//
// Requests for missing files (a .js, .png, ...) get a real 404 rather than
// an HTML page, so broken asset links fail loudly instead of silently.

const PORTAL_ROUTES = new Set([
  '/login',
  '/register',
  '/dashboard',
  '/teams',
  '/problemstatement',
  '/admin',
]);

const PORTAL_PREFIXES = ['/admin/'];

const isPortalPath = (pathname) => {
  const normalized = pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
  if (PORTAL_ROUTES.has(normalized)) return true;
  return PORTAL_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

const isPageRequest = (request, pathname) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1);
  if (lastSegment.includes('.')) return false; // looks like a file
  const accept = request.headers.get('Accept') ?? '';
  return accept === '' || accept.includes('text/html') || accept.includes('*/*');
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (!isPageRequest(request, pathname)) {
      return new Response('Not found', { status: 404 });
    }

    // Fetch the directory path, not ".../index.html": the assets binding
    // redirects index.html to the bare directory under its default
    // html_handling, and we want the page itself.
    const shell = new URL(isPortalPath(pathname) ? '/_app/' : '/', url);
    return env.ASSETS.fetch(new Request(shell, request));
  },
};
