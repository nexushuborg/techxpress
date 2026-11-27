import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { cn } from '../../utils/cn.js';
import { homePathForRole } from '../../utils/authHome.js';

const NavItem = ({ to, children, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => cn(
      'rounded-[4px] border-2 px-3.5 py-1.5 font-bold uppercase tracking-[0.06em] transition-all duration-160',
      'font-["Barlow_Condensed","Arial_Narrow",sans-serif] text-[17px] leading-none',
      isActive
        ? 'border-[#151320] bg-[#c8235f] text-white shadow-[0_2px_0_#151320]'
        : 'border-transparent text-[#151320] hover:border-[#151320] hover:bg-[#fffaf0]',
      'w-full md:w-auto md:text-center',
    )}
  >
    {children}
  </NavLink>
);

// Back to the TechXpress train site, which is a separate app at the domain
// root: a plain <a> (full page load), not a router <Link>, so the browser
// requests / from the Worker instead of navigating inside this SPA.
const TechXpressLink = () => (
  <a
    href="/"
    className={cn(
      'rounded-[4px] border-2 border-[#151320] bg-[#fffaf0] px-3.5 py-1.5 font-bold uppercase tracking-[0.06em] text-[#151320] shadow-[0_2px_0_#151320] transition-all duration-160',
      'font-["Barlow_Condensed","Arial_Narrow",sans-serif] text-[17px] leading-none hover:bg-[#f3e9d2] hover:text-[#151320]',
      'w-full md:w-auto md:text-center',
    )}
  >
    ← TechXpress
  </a>
);

export const TopAppBar = () => {
  const { user, isAuth, logout } = useAuth();
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (pathname.startsWith('/admin') || pathname.startsWith('/coordinator')) return null;

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-50 border-t-[5px] border-b-2 border-[#151320] bg-[#f3e9d2]/95 text-[#151320] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-6">
        <Link
          to={isAuth ? homePathForRole(user.role) : '/login'}
          onClick={closeMenu}
          className="group flex items-center gap-3 text-[#151320] transition-opacity duration-160 hover:opacity-85 hover:text-[#151320]"
        >
          <span className="border-2 border-[#151320] bg-[#f5b800] px-2 py-0.5 font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[15px] font-extrabold tracking-[0.12em] text-[#151320] shadow-[2px_2px_0_#151320]">
            12026
          </span>
          <span className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[22px] font-extrabold tracking-[0.12em] text-[#151320]">
            TECHXPRESS
          </span>
          {isAuth && user && (
            <span className="hidden sm:inline font-mono text-[11px] font-semibold text-[#4a4458] truncate max-w-[180px]">
              · {user.email}
            </span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-2 md:flex">
          <TechXpressLink />
          {/*
          <NavItem to="/leaderboard">Leaderboard</NavItem>
          <NavItem to="/problem-statements">Problems</NavItem>
          <NavItem to="/awards">Awards</NavItem>
          */}

          {isAuth ? (
            <div className="ml-2 flex items-center gap-2 border-l-2 border-[#151320]/20 pl-3">
              <NavItem to={homePathForRole(user.role)}>Dashboard</NavItem>
              {/* <NavItem to="/directory">Directory</NavItem> */}
              {user.role === 'STUDENT' && <NavItem to="/teams">My Team</NavItem>}
              {/* {user.role === 'JURY' && <NavItem to="/jury">Evaluations</NavItem>} */}
              {user.role === 'ADMIN' && <NavItem to="/admin">Admin</NavItem>}
              {/* {user.role === 'COORDINATOR' && <NavItem to="/coordinator">Coordinator</NavItem>} */}
              <button
                onClick={logout}
                className="ghost-button ml-1 inline-flex items-center gap-2 !py-1.5"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <div className="ml-2 flex items-center gap-2">
              <NavItem to="/login">Login</NavItem>
              <Link to="/register" className="glow-button">
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-[4px] border-2 border-[#151320] bg-[#fffaf0] text-[#151320] shadow-[0_2px_0_#151320] md:hidden"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        'fixed inset-x-0 top-[69px] z-40 border-b-2 border-[#151320] bg-[#fffaf0] transition-all duration-320 ease-out-expo md:hidden',
        isOpen ? 'h-[calc(100vh-69px)] opacity-100' : 'h-0 overflow-hidden opacity-0',
      )}>
        <nav className="flex flex-col gap-3 p-6">
          <TechXpressLink />
          {/*
          <NavItem to="/leaderboard" onClick={closeMenu}>Leaderboard</NavItem>
          <NavItem to="/problem-statements" onClick={closeMenu}>Problems</NavItem>
          <NavItem to="/awards" onClick={closeMenu}>Awards</NavItem>
          */}

          <div className="my-2 h-0.5 w-full bg-[#151320]/15" />

          {isAuth ? (
            <div className="flex flex-col gap-3">
              <NavItem to={homePathForRole(user.role)} onClick={closeMenu}>Dashboard</NavItem>
              {/* <NavItem to="/directory" onClick={closeMenu}>Directory</NavItem> */}
              {user.role === 'STUDENT' && <NavItem to="/teams" onClick={closeMenu}>My Team</NavItem>}
              {/* {user.role === 'JURY' && <NavItem to="/jury" onClick={closeMenu}>Evaluations</NavItem>} */}
              {user.role === 'ADMIN' && <NavItem to="/admin" onClick={closeMenu}>Admin</NavItem>}
              {/* {user.role === 'COORDINATOR' && <NavItem to="/coordinator" onClick={closeMenu}>Coordinator</NavItem>} */}
              <button
                onClick={() => { logout(); closeMenu(); }}
                className="ghost-button mt-4 inline-flex w-full items-center justify-center gap-2"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <NavItem to="/login" onClick={closeMenu}>Login</NavItem>
              <Link to="/register" onClick={closeMenu} className="glow-button text-center">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
