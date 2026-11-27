# TechXpress train experience

The animated, story-style landing site served at `/` on the TechXpress domain. React 19, Vite, GSAP + ScrollTrigger, Lenis smooth scrolling, react-router 7, plain CSS.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ (the root build copies it to the Worker's dist/)
npm run lint
```

## Routes

| Path | Page |
|---|---|
| `/` | `TrainScene`: loading gate, the train arrives, station master Rajesh speaks; scroll or double-tap to enter |
| `/interior` | `InteriorScene`: carriage interior with the hanging sign (About, Register, Ask) |
| `/about` | About page |
| `/ask` | Ask Rajesh (chat mock-up) |
| `/register` | Redirects to `/#book` (opens the `ReservationCounter` registration form on the site) |

## Notes

- Lenis and the global styles in `src/index.css` (hidden scrollbars, body overflow) apply to this app only; the portal is a separate bundle.
- `public/_headers` is copied to the root of the Worker's `dist/` and sets caching for **both** apps: hashed assets under `/assets/` and `/app-assets/` are immutable, page shells (`/` and `/_app/`) are `no-cache`.
- `source-assets/` holds the original artwork and video; it isn't part of the build.
