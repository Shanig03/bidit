import { BrowserRouter, Route, Routes, Outlet } from 'react-router-dom';
// ❌ REMOVE THIS LINE: import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";

//  REPLACE WITH THESE TWO SEPARATE IMPORTS:
import AgoraRTC from "agora-rtc-sdk-ng"; 
import { AgoraRTCProvider } from "agora-rtc-react";

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LiveAuctionsPage from './pages/LiveAuctionsPage';
import AuctionDetailsPage from './pages/AuctionDetailsPage';
import GoLivePage from './pages/GoLivePage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider } from './context/AuthContext';

// This will now execute perfectly without throwing an undefined error!
const agoraEngineClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

const AgoraLayout = () => (
  <AgoraRTCProvider client={agoraEngineClient}>
    <Outlet />
  </AgoraRTCProvider>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auctions" element={<LiveAuctionsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route element={<AgoraLayout />}>
          <Route path="/auction/:id" element={<AuctionDetailsPage />} />
          <Route path="/go-live" element={<GoLivePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;