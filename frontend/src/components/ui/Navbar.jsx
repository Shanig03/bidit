import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';
import Button from './Button';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Live Auctions', to: '/auctions' },
  { label: 'Go Live', to: '/go-live' },
  { label: 'Dashboard', to: '/dashboard' },
];

function Navbar() {
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
          <Link to="/login">
            <Button variant="secondary">Log In</Button>
          </Link>
          <Link to="/signup">
            <Button>Sign Up</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
