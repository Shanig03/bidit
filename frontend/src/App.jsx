import { BrowserRouter, Route, Routes, Outlet } from 'react-router-dom';
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LiveAuctionsPage from './pages/LiveAuctionsPage';
import AuctionDetailsPage from './pages/AuctionDetailsPage';
import GoLivePage from './pages/GoLivePage';
import DashboardPage from './pages/DashboardPage';

const agoraEngineClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

// A simple layout wrapper that applies the Agora Provider to sub-routes
const AgoraLayout = () => (
  <AgoraRTCProvider client={agoraEngineClient}>
    <Outlet />
  </AgoraRTCProvider>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Completely independent pages (No Agora context exists here) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auctions" element={<LiveAuctionsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Streaming-only pages (Wrapped securely in the Agora Provider) */}
        <Route element={<AgoraLayout />}>
          <Route path="/auction/:id" element={<AuctionDetailsPage />} />
          <Route path="/go-live" element={<GoLivePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;