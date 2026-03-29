import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { label: 'Projects', path: '/dashboard' },
  { label: 'Scenarios', path: '/dashboard' },
  { label: 'Templates', path: '/dashboard' },
  { label: 'Documentation', path: '/dashboard' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <span className="navbar-logo-dot" />
          </div>
          <span className="navbar-wordmark">STRATEGOS</span>
        </Link>

        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`navbar-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          <button className="btn-ghost btn-sm">Sign In</button>
          <Link to="/dashboard">
            <button className="btn-primary btn-sm">Launch Simulator</button>
          </Link>
        </div>
      </div>

      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid var(--border);
          background: rgba(6,10,17,0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .navbar-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-primary);
          text-decoration: none;
        }
        .navbar-logo {
          width: 28px;
          height: 28px;
          border: 1px solid var(--border-bright);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .navbar-logo-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--teal);
          animation: pulseDot 2s ease-in-out infinite;
        }
        .navbar-wordmark {
          font-family: var(--display);
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 3px;
        }
        .navbar-links {
          display: flex;
          gap: 32px;
        }
        .navbar-link {
          font-family: var(--body);
          font-size: 13px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s;
          position: relative;
        }
        .navbar-link:hover,
        .navbar-link.active {
          color: var(--text-primary);
          opacity: 1;
        }
        .navbar-link.active::after {
          content: '';
          position: absolute;
          bottom: -18px;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--teal);
        }
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        @media (max-width: 768px) {
          .navbar-links { display: none; }
          .navbar-inner { padding: 0 16px; }
        }
      `}</style>
    </nav>
  );
}
