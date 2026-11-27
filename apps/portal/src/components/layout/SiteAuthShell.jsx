import { Outlet, useLocation } from 'react-router-dom';
import '../../styles/stationTheme.css';

// Station paper-theatre shell for /login and /register so they match
// apps/site's visual theme and have no portal navbar.
export const SiteAuthShell = () => {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';

  return (
    <div className="txp-auth-page">
      <header className="txp-auth-topbar">
        <a href="/" className="txp-btn txp-btn--paper">
          ← TechXpress
        </a>
      </header>
      <main className={`txp-auth-container${isLogin ? ' txp-auth-container--narrow' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};
