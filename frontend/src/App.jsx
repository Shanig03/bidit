import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import AuctionPage from "./pages/AuctionPage";
import "./App.css";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/login", label: "Login" },
  { to: "/auction/demo-auction-1", label: "Live Auction" },
];

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <NavLink to="/" className="brand">
            <span className="brand-mark">B</span>
            <span>Bidit</span>
          </NavLink>

          <nav className="topbar-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button className="ghost-btn" type="button">
            Become a Seller
          </button>
        </header>

        <main className="page-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auction/:auctionId" element={<AuctionPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
