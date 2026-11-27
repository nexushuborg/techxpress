import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TopAppBar } from './TopAppBar.jsx';
import { DomainBanner } from '../student/DomainBanner.jsx';
import '../../styles/stationTheme.css';

// Student-facing shell (/dashboard, /teams). Applies the TechXpress
// paper-theatre theme across the layout and body portals (modals/toasts).

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
};

const PAGE_TRANSITION = {
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1],
};

export const AppLayout = () => {
  const location = useLocation();

  useEffect(() => {
    document.body.dataset.txpTheme = 'station';
    return () => {
      delete document.body.dataset.txpTheme;
    };
  }, []);

  return (
    <div className="txp-station-app relative min-h-screen">
      <TopAppBar />
      <DomainBanner />
      <main className="relative pb-12">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={PAGE_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={PAGE_TRANSITION}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
