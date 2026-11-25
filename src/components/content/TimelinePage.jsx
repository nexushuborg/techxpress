import React, { useState } from 'react';
import './ContentPages.css';

const PRE_DEPARTURE_STATIONS = [
  {
    date: '20-22 NOV',
    title: 'Registrations open',
    detail: 'Posters released, candidate onboarding and team formation',
  },
  {
    date: '23 NOV',
    title: 'Public announcement',
    detail: 'Banner drop on campus (Monday)',
  },
  {
    date: '24-30 NOV',
    title: 'Screening & campaigning',
    detail: 'Registrations continue with screening and outreach',
  },
  {
    date: '01 DEC',
    title: 'Registrations close',
    detail: 'Final call - the gates shut',
    isKeyJunction: true,
  },
  {
    date: '02-03 DEC',
    title: 'Final shortlist',
    detail: 'Shortlist announced; venue arrangements and preparations',
    isKeyJunction: true,
  },
  {
    date: '04 DEC',
    title: 'Departure',
    detail: 'TechXpress leaves the station',
    isKeyJunction: true,
  },
];

const CHECKPOINT_DAYS = [
  {
    id: 'day1',
    coach: 'COACH 1 / 3',
    label: 'CHECKPOINT DAY 1',
    subtitle: 'The Hackathon Express departs',
    datePlatform: 'Friday, 04 December 2026  |  Platform: SOA TechXpress',
    stops: [
      {
        arr: '9:30 AM',
        title: 'Registrations',
        detail: 'Participant check-in and team confirmation',
        venue: 'BGA A',
        audience: 'Participants',
      },
      {
        arr: '10:30 AM',
        title: 'Inauguration & Briefing',
        detail: 'Official flag-off with rules, flow and evaluation briefing',
        venue: 'BGA A',
        audience: 'All Students',
      },
      {
        arr: '12:30 PM',
        title: 'Lunch',
        detail: 'Refuel before departure',
        venue: 'CL 3rd Floor (Middle Hall)',
        audience: 'Participants',
      },
      {
        arr: '1:30 PM',
        title: 'TechXpress Begins',
        detail: 'Hackathon clock starts - the build journey is underway',
        venue: 'CL 3rd Floor',
        audience: 'Participants',
        isKeyJunction: true,
      },
      {
        arr: '3:00 PM',
        title: 'Evaluation Wave 1 - Framing',
        detail: 'Problem framing and approach reviewed by evaluators',
        venue: 'CL 3rd Floor',
        audience: 'Participants',
      },
      {
        arr: '5:30 PM',
        title: 'Evaluation Wave 2 - Integration',
        detail: 'Integration checks; Elimination 1 - Top 20 continue',
        venue: 'CL 3rd Floor',
        audience: 'Participants',
        isKeyJunction: true,
      },
      {
        arr: '8:30 PM',
        title: 'Dinner',
        detail: 'Evening halt for the crew',
        venue: 'CL Parking',
        audience: 'Participants',
      },
      {
        arr: '10:00 PM',
        title: 'Hackathon Continues',
        detail: 'Overnight run - the build continues through the night',
        venue: 'CL 3rd Floor',
        audience: 'Participants',
      },
    ],
  },
  {
    id: 'day2',
    coach: 'COACH 2 / 3',
    label: 'CHECKPOINT DAY 2',
    subtitle: 'Final approach to the terminus',
    datePlatform: 'Saturday, 05 December 2026  |  Platform: SOA TechXpress',
    stops: [
      {
        arr: '8:00 AM',
        title: 'Breakfast',
        detail: 'Morning halt after the overnight run',
        venue: 'CL 3rd Floor',
        audience: 'Participants',
      },
      {
        arr: '9:00 AM',
        title: 'Evaluation Wave 3',
        detail: 'Final build review; Elimination - Top 10 advance',
        venue: 'CL 3rd Floor',
        audience: 'Participants',
        isKeyJunction: true,
      },
      {
        arr: '1:00 PM',
        title: 'Lunch',
        detail: 'Last halt before the finals',
        venue: 'CL 3rd Floor',
        audience: 'Participants',
      },
      {
        arr: '1:30 PM',
        title: 'Final Jury Evaluation',
        detail: 'Top 10 present to the jury panel',
        venue: 'CL 3rd Floor',
        audience: 'Participants',
        isKeyJunction: true,
      },
      {
        arr: '3:00 PM',
        title: 'Conclusion of SOA TechXpress',
        detail: 'The hackathon arrives at its terminus',
        venue: 'CL 3rd Floor',
        audience: 'Participants',
      },
    ],
  },
  {
    id: 'day3',
    coach: 'COACH 3 / 3',
    label: 'CHECKPOINT DAY 3',
    subtitle: 'Grand terminus: Abinya 3.1',
    datePlatform: 'Sunday, 06 December 2026  |  Platform: Abinya 3.1',
    stops: [
      {
        arr: '10:00 AM',
        title: 'Registrations',
        detail: 'Guest check-in',
        venue: 'CL 3rd Floor',
        audience: 'Invited',
      },
      {
        arr: '10:30 AM',
        title: 'Abinya 3.1 Inauguration',
        detail: 'Opening ceremony of Abinya 3.1',
        venue: 'BGA A',
        audience: 'All Students',
      },
      {
        arr: '11:00 AM',
        title: 'Project Exhibition',
        detail: 'Showcase of projects open to all students',
        venue: 'CL 3rd Floor',
        audience: 'All Students',
        isKeyJunction: true,
      },
      {
        arr: '1:00 PM',
        title: 'Lunch',
        detail: 'Guest lunch and networking',
        venue: 'Glass House, TP Cell',
        audience: 'Invited',
      },
      {
        arr: '2:30 PM',
        title: 'Felicitation Ceremony',
        detail: 'Honouring SOA TechXpress + Abinya 3.1 achievers',
        venue: 'BGA A',
        audience: 'Invited',
        isKeyJunction: true,
      },
      {
        arr: '4:30 PM',
        title: 'Cultural Night',
        detail: 'Evening performances close the journey (line-up below)',
        venue: 'BGA A',
        audience: 'Invited',
      },
    ],
  },
];

const EVENING_CARRIAGES = [
  { coach: 'COACH 1', act: 'Danza', time: '4:30 - 5:00 PM' },
  { coach: 'COACH 2', act: 'TSK', time: '5:00 - 5:30 PM' },
  { coach: 'COACH 3', act: 'SMC', time: '5:30 - 6:30 PM' },
];

const STATION_GUIDE = [
  {
    venue: 'BGA A',
    usage: 'Registrations (Day 1), inaugurations, felicitation, cultural night',
  },
  {
    venue: 'CL 3rd Floor',
    usage: 'Hackathon floor, evaluations, jury, exhibition, Day 3 registrations',
  },
  {
    venue: 'CL Parking',
    usage: 'Day 1 dinner',
  },
  {
    venue: 'Glass House, TP Cell',
    usage: 'Day 3 lunch for invited guests',
  },
];

const FILTER_TABS = [
  { id: 'all', label: 'ALL STOPS' },
  { id: 'route', label: 'PRE-DEPARTURE' },
  { id: 'day1', label: 'DAY 1 · 04 DEC' },
  { id: 'day2', label: 'DAY 2 · 05 DEC' },
  { id: 'day3', label: 'DAY 3 · 06 DEC' },
  { id: 'venues', label: 'STATION GUIDE' },
];

export default function TimelinePage({ onBack }) {
  const [activeTab, setActiveTab] = useState('all');

  const showSection = (sectionId) => activeTab === 'all' || activeTab === sectionId;

  return (
    <div className="content-page timeline-page" data-lenis-prevent>
      <button className="back-btn" onClick={onBack}>← BACK TO SEAT</button>

      <div className="content-container animate-fade-in">
        {/* Boarding Pass Hero */}
        <header className="timeline-hero glass">
          <div className="timeline-hero-top">
            <span className="hero-eyebrow">ALL ABOARD &nbsp;|&nbsp; ITER, SOA UNIVERSITY</span>
            <span className="boarding-pass-badge">BOARDING PASS · 3 DAYS · FINAL SERVICE</span>
          </div>

          <h1 className="timeline-main-title">
            SOA TECHXPRESS <span>2026</span>
          </h1>
          <p className="subtitle">
            A hackathon express from registrations to the Abinya 3.1 terminus
          </p>

          <div className="boarding-route-strip">
            <div className="route-leg">
              <span className="leg-label">FROM</span>
              <strong className="leg-place">Registrations</strong>
              <span className="leg-date">20 Nov 2026</span>
            </div>
            <span className="route-arrow">➜</span>
            <div className="route-leg">
              <span className="leg-label">VIA</span>
              <strong className="leg-place">TechXpress</strong>
              <span className="leg-date">04-05 Dec 2026</span>
            </div>
            <span className="route-arrow">➜</span>
            <div className="route-leg">
              <span className="leg-label">TO</span>
              <strong className="leg-place">Abinya 3.1</strong>
              <span className="leg-date">06 Dec 2026</span>
            </div>
          </div>

          <div className="timeline-legend">
            <span className="legend-item">
              <span className="legend-dot legend-dot-station" /> Station / stage
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-dot-junction" /> Key junction (cut-off, elimination or milestone)
            </span>
            <span className="legend-item">
              <span className="legend-arr-tag">ARR</span> Arrival time at each stage
            </span>
          </div>
        </header>

        {/* Filter Navigation */}
        <nav className="timeline-filter-bar" aria-label="Timeline sections">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`timeline-filter-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Pre-departure Route Map */}
        {showSection('route') && (
          <section className="timeline-section">
            <div className="section-heading-row">
              <div>
                <span className="section-kicker">THE ROUTE MAP</span>
                <h2>Pre-departure stations</h2>
                <p className="section-desc">
                  Every journey begins at the platform. Here is the line from registrations to the starting whistle.
                </p>
              </div>
            </div>

            <div className="predeparture-grid">
              {PRE_DEPARTURE_STATIONS.map((station) => (
                <article
                  key={station.date}
                  className={`predeparture-card glass ${station.isKeyJunction ? 'is-junction' : ''}`}
                >
                  <div className="predeparture-top">
                    <span className="predeparture-date">{station.date}</span>
                    {station.isKeyJunction && <span className="junction-pill">KEY JUNCTION</span>}
                  </div>
                  <h3>{station.title}</h3>
                  <p>{station.detail}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Checkpoint Days 1, 2, 3 */}
        {CHECKPOINT_DAYS.filter((day) => showSection(day.id)).map((day) => (
          <section key={day.id} className="timeline-section">
            <div className="checkpoint-header glass">
              <div className="checkpoint-title-group">
                <span className="coach-badge">{day.coach}</span>
                <span className="checkpoint-label">{day.label}</span>
              </div>
              <h2>{day.subtitle}</h2>
              <p className="checkpoint-platform">{day.datePlatform}</p>
            </div>

            <div className="timeline-list">
              {day.stops.map((stop) => (
                <article
                  key={`${day.id}-${stop.arr}-${stop.title}`}
                  className={`timeline-item glass ${stop.isKeyJunction ? 'is-junction' : ''}`}
                >
                  <div className="timeline-marker">
                    <span className={`timeline-dot ${stop.isKeyJunction ? 'junction' : ''}`} />
                    <span className="timeline-time">ARR {stop.arr}</span>
                    {stop.isKeyJunction && <span className="junction-pill">KEY JUNCTION</span>}
                    <div className="timeline-meta-pills">
                      <span className="venue-pill">{stop.venue}</span>
                      <span className="audience-pill">{stop.audience}</span>
                    </div>
                  </div>
                  <div className="timeline-body">
                    <h3>{stop.title}</h3>
                    <p>{stop.detail}</p>
                  </div>
                </article>
              ))}
            </div>

            {/* Cultural Night Line-up under Day 3 */}
            {day.id === 'day3' && (
              <div className="cultural-night-box glass">
                <div className="cultural-header">
                  <span className="section-kicker">CULTURAL NIGHT &nbsp;|&nbsp; BGA A</span>
                  <h3>The evening carriages</h3>
                </div>
                <div className="evening-carriages-grid">
                  {EVENING_CARRIAGES.map((carriage) => (
                    <div key={carriage.coach} className="carriage-card">
                      <span className="carriage-coach">{carriage.coach}</span>
                      <strong className="carriage-act">{carriage.act}</strong>
                      <span className="carriage-time">{carriage.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        ))}

        {/* Station Guide */}
        {showSection('venues') && (
          <section className="timeline-section">
            <div className="section-heading-row">
              <div>
                <span className="section-kicker">STATION GUIDE</span>
                <h2>Venues at a glance</h2>
              </div>
            </div>

            <div className="station-guide-grid">
              {STATION_GUIDE.map((item) => (
                <article key={item.venue} className="station-card glass">
                  <h3>{item.venue}</h3>
                  <p>{item.usage}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <footer className="page-footer">
          <p>SOA TECHXPRESS 2026 + ABINYA 3.1 &nbsp;|&nbsp; ITER, SOA UNIVERSITY</p>
        </footer>
      </div>
    </div>
  );
}
