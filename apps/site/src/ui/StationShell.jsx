import { useCallback, useEffect, useState } from 'react';
import Station from '../scene/Station.jsx';
import { BOOT_MIN_MS, INTRO_TOTAL_MS } from '../scene/stage.js';
import { LED, UI } from '../content/station.js';
import { applyMotionPref, readMotionOff } from '../lib/station.js';
import { useLedStatus, usePanelRoute, usePresence } from './hooks.js';
import { goToRegister, REGISTER_URL } from './portal.js';
import Panel from './Panel.jsx';
import Menu from './Menu.jsx';
import BookButton from './BookButton.jsx';
import LoginButton from './LoginButton.jsx';
import Hints from './Hints.jsx';
import DoorTransition from './DoorTransition.jsx';
import About from './panels/About.jsx';
import Timetable from './panels/Timetable.jsx';
import Prizes from './panels/Prizes.jsx';
import Faq from './panels/Faq.jsx';
import Countdown from './panels/Countdown.jsx';
import PnrStatus from './panels/PnrStatus.jsx';
import '../styles/ui.css';
import logoUrl from '../assets/stage/logo.webp';
import soaLogoUrl from '../assets/stage/sun.webp';

// Apply the saved motion preference before the stage first renders.
applyMotionPref(readMotionOff());

const EXIT_MS = 240;
// If the stage never reports the end of its opening, show the UI anyway.
// Boarding + art loading (preload gives up after 4 s) + the opening + slack.
const INTRO_FALLBACK_MS = BOOT_MIN_MS + 4000 + INTRO_TOTAL_MS + 1500;

const PANEL_VIEWS = {
  about: About,
  timetable: Timetable,
  prizes: Prizes,
  faq: Faq,
  countdown: Countdown,
  pnr: PnrStatus,
};

// Announces the departure board's status line to screen readers.
function LiveStatus({ ready }) {
  const key = useLedStatus();
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {ready ? `${UI.liveStatusPrefix} ${LED.status[key]}` : ''}
    </p>
  );
}

// The landing page: the station stage plus everything on top of it.
export default function StationShell() {
  const { panel, open, close } = usePanelRoute();
  const [shown, leaving] = usePresence(panel, EXIT_MS);
  const [introDone, setIntroDone] = useState(() => Boolean(panel));
  const [pnrPrefill, setPnrPrefill] = useState(null);
  const [opener, setOpener] = useState(null);

  // Fallback in case the stage never calls onIntroDone.
  useEffect(() => {
    if (introDone) return undefined;
    const t = setTimeout(() => setIntroDone(true), INTRO_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [introDone]);

  const onIntroDone = useCallback(() => setIntroDone(true), []);

  // Redirect /#book straight to the standalone /register page.
  useEffect(() => {
    if (panel === 'book') {
      window.location.replace(REGISTER_URL);
    }
  }, [panel]);

  // open(name, pnrPrefill?, opener?)
  const openPanel = useCallback(
    (name, prefill = null, openerEl = null) => {
      if (name === 'book') {
        goToRegister();
        return;
      }
      if (!panel) setOpener(openerEl ?? document.activeElement);
      if (name === 'pnr') setPnrPrefill(prefill);
      setIntroDone(true);
      open(name);
    },
    [open, panel],
  );

  const shouldConfirm = useCallback(() => false, []);

  const panelOpen = Boolean(panel) && panel !== 'book';
  const titleId = shown ? `panel-title-${shown}` : undefined;
  const View = shown ? PANEL_VIEWS[shown] : null;

  return (
    <div className={`txp-shell${introDone ? ' is-ready' : ''}${panelOpen ? ' has-panel' : ''}`}>
      <div className="txp-stage" inert={panelOpen}>
        <Station onHotspot={(name) => openPanel(name)} dimmed={panelOpen} onIntroDone={onIntroDone} />
      </div>

      {introDone && (
        <div className="txp-chrome" inert={panelOpen}>
          {/* On phones the SOA logo sits exactly below the TechXpress logo
              (on wide screens it stays in the sky, as a scene piece). */}
          <div className="txp-brand">
            <img className="txp-logo" src={logoUrl} alt="TechXpress Hackathon" />
            <img className="txp-soa" src={soaLogoUrl} alt="Siksha 'O' Anusandhan" />
          </div>
          <Menu onOpen={openPanel} />
          <div className="book-tickets-wrap">
            <LoginButton />
            <BookButton onOpen={openPanel} />
          </div>
          <Hints />
        </div>
      )}

      {shown && shown !== 'book' && (
        <Panel
          key={shown}
          name={shown}
          titleId={titleId}
          leaving={leaving}
          onClose={close}
          shouldConfirm={shouldConfirm}
          returnFocus={opener}
        >
          {shown === 'pnr' ? (
            <PnrStatus titleId={titleId} prefill={pnrPrefill} onOpen={openPanel} />
          ) : (
            <View titleId={titleId} onOpen={openPanel} />
          )}
        </Panel>
      )}

      <LiveStatus ready={introDone} />
      <DoorTransition />
    </div>
  );
}
