import { useEffect, useState } from 'react';
import { PORTAL_EVENT, PORTAL_URL } from './portal.js';
import { prefersLessMotion } from '../lib/station.js';

// Warm light from an opening coach door fills the screen, then the portal
// loads. Reset on pageshow so coming Back (bfcache) shows the station again.
export default function DoorTransition() {
  const [phase, setPhase] = useState(null); // null | 'door' | 'fade'

  useEffect(() => {
    let timer;
    const onGo = (e) => {
      const target = e?.detail?.url || PORTAL_URL;
      const less = prefersLessMotion();
      setPhase(less ? 'fade' : 'door');
      timer = setTimeout(() => window.location.assign(target), less ? 150 : 600);
    };
    const onShow = () => {
      clearTimeout(timer);
      setPhase(null);
    };
    window.addEventListener(PORTAL_EVENT, onGo);
    window.addEventListener('pageshow', onShow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(PORTAL_EVENT, onGo);
      window.removeEventListener('pageshow', onShow);
    };
  }, []);

  if (!phase) return null;
  return (
    <div className={`txp-door txp-door--${phase}`} aria-hidden="true">
      <div className="txp-door-light" />
      <div className="txp-door-leaf txp-door-leaf--l" />
      <div className="txp-door-leaf txp-door-leaf--r" />
    </div>
  );
}
