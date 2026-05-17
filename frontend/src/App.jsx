import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LiveAuctionsPage from './pages/LiveAuctionsPage';
import AuctionDetailsPage from './pages/AuctionDetailsPage';
import GoLivePage from './pages/GoLivePage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auctions" element={<LiveAuctionsPage />} />
        <Route path="/auction/:id" element={<AuctionDetailsPage />} />
        <Route path="/go-live" element={<GoLivePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
