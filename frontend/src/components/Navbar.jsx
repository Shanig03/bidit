import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';
import Button from './Button';
import { useAuth } from '../context/AuthContext';
import { useLogout } from '../hooks/useLogOut';
import { USER_ROLES } from '../../constants/authConstants';


const standardNavItems = [
  { label: 'Home', to: '/' },
  { label: 'Live Auctions', to: '/auctions' },
  { label: 'Go Live', to: '/go-live' },
  { label: 'Dashboard', to: '/dashboard' },
];

const adminNavItems = [
  { label: 'Manage Auctions', to: '/admin/auctions' },
  { label: 'Manage Users', to: '/admin/users' },
];

function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { executeLogout, loading: isLoggingOut } = useLogout();
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const isAdmin = user?.role === USER_ROLES.ADMIN;

  const currentNavItems = isAdmin ? adminNavItems : standardNavItems
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="navbar-wrap">
      <nav className="navbar" aria-label="Main navigation">
        <Link className="navbar__logo" to="/">
          <span className="navbar__logo-dot" aria-hidden="true" />
          <span>BidIt</span>
        </Link>

        <div className="navbar__links">
          {currentNavItems.map((item) => (
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
              <Link to="/login">
                <Button variant="secondary">Log In</Button>
              </Link>
              <Link to="/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          ) : (
            <div className="navbar__user-group">
              <div className="navbar__user-menu">
                <button
                  type="button"
                  className="navbar__user-trigger"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                >
                  <span>Hello, {displayName}</span>
                  <span
                    className={`navbar__user-arrow ${isUserMenuOpen ? 'navbar__user-arrow--open' : ''
                      }`}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="navbar__user-dropdown">
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Profile
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Settings
                    </Link>

                    <button
                      type="button"
                      className="navbar__dropdown-logout"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        executeLogout();
                      }}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
            </div>

          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
