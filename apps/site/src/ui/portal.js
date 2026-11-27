// Portal links (/login, /register): the portal is a separate bundle, so each
// is a full page load. A plain left click plays the coach-door transition first
// (DoorTransition listens for this event); modified clicks behave normally.
export const PORTAL_URL = '/login';
export const REGISTER_URL = '/register';
export const PROBLEMS_URL = '/problemstatement';
export const PORTAL_EVENT = 'txp:portal';

export function goToPortal(event, url = PORTAL_URL) {
  if (event && (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
  event?.preventDefault();
  window.dispatchEvent(new CustomEvent(PORTAL_EVENT, { detail: { url } }));
}

export function goToRegister(event) {
  return goToPortal(event, REGISTER_URL);
}

export function goToProblems(event) {
  return goToPortal(event, PROBLEMS_URL);
}
