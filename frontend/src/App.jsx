import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AuctionPage from "./pages/AuctionPage";

function App() {
  return (
    <BrowserRouter>
      <nav style={{ display: "flex", gap: "12px", padding: "16px" }}>
        <Link to="/">Dashboard</Link>
        <Link to="/login">Login</Link>
        <Link to="/auction/demo-auction-1">Demo Auction</Link>
      </nav>

      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auction/:auctionId" element={<AuctionPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;