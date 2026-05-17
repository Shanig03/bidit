import { Link, NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';
import Button from './Button';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Live Auctions', to: '/auctions' },
  { label: 'Go Live', to: '/go-live' },
  { label: 'Dashboard', to: '/dashboard' },
];
const DEV_SHOW_PROFILE_LINK = true;
// Temporary development-only profile access. Remove or disable when authentication is connected.

function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <header className="navbar-wrap">
      <nav className="navbar" aria-label="Main navigation">
        <Link className="navbar__logo" to="/">
          <span className="navbar__logo-dot" aria-hidden="true" />
          <span>BidIt</span>
        </Link>

        <div className="navbar__links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="navbar__actions">
          {!user ? (
            <>
              {DEV_SHOW_PROFILE_LINK ? (
                <Link className="navbar__dev-profile-link" to="/profile">
                  Profile
                </Link>
              ) : null}
              <Link to="/login">
                <Button variant="secondary">Log In</Button>
              </Link>
              <Link to="/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          ) : (
            <button type="button" className="navbar__user" onClick={() => navigate('/profile')}>
              <span className="navbar__bell" aria-hidden="true">🔔</span>
              {user.photoURL ? (
                <img src={user.photoURL} alt={displayName} className="navbar__avatar" />
              ) : (
                <span className="navbar__avatar navbar__avatar--fallback" aria-hidden="true">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="navbar__user-name">{displayName}</span>
              <span aria-hidden="true">▾</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
