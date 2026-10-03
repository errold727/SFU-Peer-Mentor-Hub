import { lazy, Suspense, useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation, Link } from 'react-router-dom';
import { Mountain, Menu, X } from 'lucide-react';
import Home from '../pages/Home';
import Resources from '../pages/Resources';
import About from '../pages/About';
const Poster = lazy(() => import('../pages/Poster'));
const Courses = lazy(() => import('../pages/Courses'));
const Templates = lazy(() => import('../pages/Templates'));
export default function App() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="top-strip">AN INDEPENDENT TOOL FOR THE SFU COMMUNITY</div>
      <header className="site-header">
        <Link to="/" className="brand">
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
          {[
            ['/', 'Home'],
            ['/resources', 'Resources'],
            ['/poster', 'Poster Maker'],
            ['/course-planner', 'Course Planner'],
            ['/about', 'About'],
          ].map(([to, name]) => (
            <NavLink key={to} end={to === '/'} to={to} onClick={() => setOpen(false)}>
              {name}
            </NavLink>
          ))}
        </nav>
        <Link className="button small header-cta" to="/poster">
          Create something ↗
        </Link>
      </header>
      <main id="main" tabIndex={-1}>
        <Suspense fallback={<p role="status">Loading your workspace…</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/poster" element={<Poster />} />
            <Route path="/poster/templates" element={<Templates />} />
            <Route path="/course-planner" element={<Courses />} />
            <Route path="/about" element={<About />} />
            <Route
              path="*"
              element={
                <div className="empty-state">
                  <h1>Page not found</h1>
                  <Link to="/">Return home</Link>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </main>
      <footer className="site-footer">
        <strong>SFU Peer Mentor Hub</strong>
        <span>Find. Select. Create.</span>
        <p>Peer-created · Not an official SFU website</p>
        <Link to="/about">Privacy & sources ↗</Link>
      </footer>
    </>
  );
}
