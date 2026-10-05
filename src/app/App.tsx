import { lazy, Suspense, useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate, Link } from 'react-router-dom';
import { Mountain, Menu, X } from 'lucide-react';
import Home from '../pages/Home';
import Resources from '../pages/Resources';
import About from '../pages/About';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import AccessEntry from './AccessEntry';
import { readSessionRole, writeSessionRole, RoleContext, type AccessRole } from './access';
const PosterStart = lazy(() => import('../pages/PosterStart'));
const Poster = lazy(() => import('../pages/Poster'));
const Courses = lazy(() => import('../pages/Courses'));
const Templates = lazy(() => import('../pages/Templates'));
export default function App() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState(readSessionRole);
  function changeRole(next: AccessRole | null) {
    writeSessionRole(next);
    setRole(next);
    setOpen(false);
    navigate(next === 'mentee' ? '/course-planner' : '/', { replace: true });
  }
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  if (!role) return <AccessEntry onEnter={changeRole} />;
  const home = role === 'mentee' ? '/course-planner' : '/';
  const routes =
    role === 'mentor'
      ? [
          ['/', 'Home'],
          ['/resources', 'Resources'],
          ['/poster', 'Poster Maker'],
          ['/course-planner', 'Course Planner'],
          ['/about', 'About'],
        ]
      : [
          ['/course-planner', 'Course Planner'],
          ['/about', 'About'],
        ];
  return (
    <RoleContext.Provider value={{ role }}>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="site-header role-header">
        <Link to={home} className="brand">
          <span className="brand-icon">
            <Mountain />
          </span>
          <span>
            SFU Peer
            <br />
            <strong>Mentor Hub</strong>
          </span>
        </Link>
        <button
          className="mobile-menu"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav aria-label="Main navigation" className={open ? 'open' : ''}>
          {routes.map(([to, name]) => (
            <NavLink key={to} end={to === '/'} to={to} onClick={() => setOpen(false)}>
              {name}
            </NavLink>
          ))}
          <div className="role-control">
            <span>{role === 'mentor' ? 'Peer Mentor' : 'Student'}</span>
            <button onClick={() => changeRole(null)}>Switch role</button>
          </div>
        </nav>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className={location.pathname === '/poster/edit' ? 'editor-main' : undefined}
      >
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<p role="status">Loading your workspace…</p>}>
            {role === 'mentee' && !['/course-planner', '/about'].includes(location.pathname) ? (
              <Navigate to="/course-planner" replace />
            ) : (
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/poster" element={<PosterStart />} />
                <Route path="/poster/edit" element={<Poster />} />
                <Route path="/poster/templates" element={<Templates />} />
                <Route path="/course-planner" element={<Courses />} />
                <Route path="/about" element={<About />} />
                <Route
                  path="*"
                  element={
                    <div className="empty-state">
                      <h1>Page not found</h1>
                      <Link to={home}>Return home</Link>
                    </div>
                  }
                />
              </Routes>
            )}
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer className="site-footer">
        <strong>SFU Peer Mentor Hub</strong>
        <p>Peer-created · Not an official SFU website</p>
        <Link to="/about">Privacy & sources ↗</Link>
      </footer>
    </RoleContext.Provider>
  );
}
