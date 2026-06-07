import { BrowserRouter, Route, Routes, Outlet, Navigate } from 'react-router-dom';



import AgoraRTC from "agora-rtc-sdk-ng"; 
import { AgoraRTCProvider } from "agora-rtc-react";
import Navbar from './components/Navbar';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LiveAuctionsPage from './pages/LiveAuctionsPage';
import AuctionDetailsPage from './pages/AuctionDetailsPage';
import GoLivePage from './pages/GoLivePage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { USER_ROLES } from '../constants/authConstants';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminAuctionsPage from './pages/AdminAuctionsPage';

// This will now execute perfectly without throwing an undefined error!
const agoraEngineClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== USER_ROLES.ADMIN) {
    return <Navigate to="/" replace />; // Kick non-admins back to the home page
  }
  
  return children;
}

const AgoraLayout = () => (
  <AgoraRTCProvider client={agoraEngineClient}>
    <Outlet />
  </AgoraRTCProvider>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Navbar />
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

        <Route 
        path="/admin/users" 
        element={
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        } 
      />
      
      <Route 
        path="/admin/auctions" 
        element={
          <AdminRoute>
            <AdminAuctionsPage />
          </AdminRoute>
        } 
      />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;