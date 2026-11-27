import { useEffect, useId, useRef, useState } from 'react';
import { BOOK, HINTS, LABELS, UI } from '../content/station.js';
import { readMotionOff, setMotionOff } from '../lib/station.js';
import { goToPortal, goToRegister, PORTAL_URL, REGISTER_URL } from './portal.js';

const ITEMS = ['about', 'timetable', 'prizes', 'faq', 'pnr', 'countdown'];

// The yellow "STATION GUIDE" plate, top right: every panel, booking, the
// portal and the motion switch.
export default function Menu({ onOpen }) {
  const [open, setOpen] = useState(false);
  const [motionOff, setMotion] = useState(readMotionOff);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return undefined;
    rootRef.current?.querySelector('.guide-list a, .guide-list button')?.focus();
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Arrow keys move between the items.
  const onListKey = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
    const items = [...rootRef.current.querySelectorAll('.guide-list a, .guide-list button')];
    const i = items.indexOf(document.activeElement);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    e.preventDefault();
    items[next]?.focus();
  };

  const pick = (e, name) => {
    e.preventDefault();
    setOpen(false);
    onOpen(name, null, buttonRef.current);
  };

  const toggleMotion = () => {
    const next = !motionOff;
    setMotion(next);
    setMotionOff(next);
  };

  return (
    <nav className="guide" ref={rootRef} aria-label={LABELS.guide.english}>
      <button
        ref={buttonRef}
        type="button"
        className="guide-plate"
        aria-label={LABELS.guide.english}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="guide-burger" aria-hidden="true"><i /><i /><i /></span>
        <span className="guide-plate-text">
          <span className="guide-plate-en">{LABELS.guide.english}</span>
          <span className="guide-plate-hi" lang="hi">{LABELS.guide.hindi}</span>
        </span>
      </button>
      <div id={listId} className="guide-pop" hidden={!open} onKeyDown={onListKey}>
        <p className="guide-pop-head">{UI.panelsHeading}</p>
        <ul className="guide-list">
          {ITEMS.map((name) => (
            <li key={name}>
              <a href={`#${name}`} onClick={(e) => pick(e, name)} className="guide-item">
                <span className="guide-item-en">{LABELS[name].english}</span>
                <span className="guide-item-hi" lang="hi">{LABELS[name].hindi}</span>
              </a>
            </li>
          ))}
          <li>
            <a href={REGISTER_URL} onClick={goToRegister} className="guide-item guide-item--book">
              <span className="guide-item-en">{LABELS.book.english}</span>
              <span className="guide-item-hi" lang="hi">{LABELS.book.hindi}</span>
            </a>
          </li>
          <li>
            <a href={PORTAL_URL} onClick={goToPortal} className="guide-item guide-item--portal">
              <span className="guide-item-en">{BOOK.login}</span>
              <span className="guide-item-arrow" aria-hidden="true">→</span>
            </a>
          </li>
          <li>
            <button type="button" role="switch" className="guide-item guide-item--motion" aria-checked={!motionOff} onClick={toggleMotion}>
              <span className="guide-item-en">{motionOff ? HINTS.motionOff : HINTS.motionOn}</span>
              <span className={`guide-switch${motionOff ? '' : ' is-on'}`} aria-hidden="true" />
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
