import { EVENT, LABELS, LED } from '../../content/station.js';
import { countdownParts, countdownSpoken, timeLeft } from '../../lib/countdown.js';
import { useLedStatus, useNow } from '../hooks.js';
import { goToRegister, REGISTER_URL } from '../portal.js';
import { formatJourneyDate } from '../../lib/eticket.js';

// The orange dot-matrix departure board, enlarged.
export default function Countdown({ titleId }) {
  const now = useNow(15000);
  const statusKey = useLedStatus();
  const left = timeLeft(now, EVENT.startsAt);
  const parts = countdownParts(left);
  const status = LED.status[statusKey];
  const departed = statusKey === 'departed';

  return (
    <article className="m-countdown">
      <header className="led-head" data-grab>
        <p className="led-head-hindi" lang="hi">{LABELS.countdown.hindi}</p>
        <h2 id={titleId} tabIndex={-1} className="led-head-title">{LABELS.countdown.english}</h2>
      </header>
      <div className="led-housing">
        <div className="led-board">
          <p className="led-line led-line--head"><span className="led-dots">{LED.headline}</span></p>
          {!departed && (
            <>
              <p className="led-line led-line--prefix"><span className="led-dots">{LED.countdownPrefix}</span></p>
              <p className="led-digits" aria-label={countdownSpoken(left)}>
                {parts.map(([n, u]) => (
                  <span key={u} className="led-cell" aria-hidden="true">
                    <span className="led-dots led-num">{n}</span>
                    <span className="led-dots led-unit">{u}</span>
                  </span>
                ))}
              </p>
            </>
          )}
          <div className="led-line led-line--status">
            <p className="led-marquee" data-status={statusKey}>
              <span className="led-dots">{status}</span>
              <span className="led-dots led-marquee-copy" aria-hidden="true">{status}</span>
            </p>
          </div>
        </div>
        <p className="led-plate">
          {formatJourneyDate(EVENT.startsAt)} · {EVENT.startsAt.slice(11, 16)} IST
        </p>
      </div>
      <div className="paper led-note">
        <p>
          {LABELS.countdown.hint}: {departed ? status : countdownSpoken(left)}.
        </p>
        {statusKey === 'open' && (
          <a className="txp-btn txp-btn--pink" href={REGISTER_URL} onClick={goToRegister}>
            {LABELS.book.english}
          </a>
        )}
        {statusKey !== 'open' && !departed && <p>{status}</p>}
      </div>
    </article>
  );
}
