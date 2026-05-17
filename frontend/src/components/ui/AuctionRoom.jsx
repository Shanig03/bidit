import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
  LocalUser,
  RemoteUser
} from 'agora-rtc-react';

import BidPanel from './BidPanel';
import Button from './Button';
import './AuctionRoom.css';

function AuctionRoom() {
  const { id } = useParams(); // Grabs the auction ID from your route path='/auction/:id'
  
  // --- Component & Auction States ---
  const [isJoined, setIsJoined] = useState(false);
  const [currentBid, setCurrentBid] = useState(1250); // Initial mock data, will sync with database later
  const [bidCount, setBidCount] = useState(14);
  const [watchers, setWatchers] = useState(42);
  
  // Mock auction details matching your data structure
  const [auction, setAuction] = useState({
    id: id,
    title: 'Vintage Charizard First Edition Holo',
    seller: 'CryptoCollector',
    sellerId: 'usr_9842x',
    category: 'Cards',
    startingPrice: 500,
    endsAt: '18:45 UTC',
    status: 'LIVE'
  });

  // --- Mock Authorization Check ---
  // In your production build, compare logged-in user ID with auction.sellerId
  const isHost = window.location.pathname.includes('go-live') || auction.sellerId === 'usr_9842x';

  // --- Agora Live Streaming Hardware Initialization ---
  // Ready local tracks strictly if the user is the authorized host
  const { localCameraTrack, isLoading: loadingCam } = useLocalCameraTrack(isHost);
  const { localMicrophoneTrack, isLoading: loadingMic } = useLocalMicrophoneTrack(isHost);

  // --- Agora Channel Lifecycle Hook ---
  // Pass your Agora Project App ID, channel name, and token (null safely falls back for testing mode)
  useJoin({
    appid: 'YOUR_AGORA_APP_ID', 
    channel: `auction-${id}`,
    token: null 
  }, isJoined);

  // Automatically publish microphone and camera streams over the network if user is the host
  usePublish([localMicrophoneTrack, localCameraTrack], isJoined && isHost);

  // Automatically track incoming remote streams (viewers see the host stream here)
  const remoteUsers = useRemoteUsers();
  const hostUser = remoteUsers.find((user) => user.hasVideo || user.hasAudio);

  // --- Bid Handling Pipeline ---
  async function handlePlaceBid(amount) {
    // This is where your Phase 1 Firebase Realtime Database write logic will execute
    setCurrentBid(amount);
    setBidCount(prev => prev + 1);
  }

  // Safe resource cleanup if a user abruptly routes away
  useEffect(() => {
    return () => {
      setIsJoined(false);
    };
  }, []);

  return (
    <main className="room-container">
      {/* Top utility action navbar */}
      <header className="room-header">
        <Link to="/auctions">
          <Button variant="secondary">← Leave Room</Button>
        </Link>
        <div className="room-badge-group">
          <span className="room-status-tag">Channel: auction-{id}</span>
          {isHost && <span className="room-host-indicator">Host Dashboard Active</span>}
        </div>
      </header>

      <div className="room-grid">
        {/* Left Column: Live Streaming Processing Core */}
        <section className="room-video-card card">
          <div className="room-media-viewport">
            
            {/* Overlay Status Headers */}
            <div className="room-media-overlay-top">
              <span className={`room-live-badge ${isJoined ? 'room-live-badge--active' : ''}`}>
                {isJoined ? 'LIVE' : 'DISCONNECTED'}
              </span>
              <span className="room-viewer-count">👁 {watchers} watching</span>
            </div>

            {/* Main Interactive Video Stream Processor */}
            <div className="room-stream-canvas">
              {!isJoined ? (
                <div className="room-placeholder-state">
                  <p>You are currently backstage.</p>
                  <Button variant="primary" onClick={() => setIsJoined(true)}>
                    {isHost ? 'Start Broadcasting Stream' : 'Connect to Live Feed'}
                  </Button>
                </div>
              ) : (
                <div className="room-active-video-wrapper">
                  {isHost ? (
                    <LocalUser
                      cameraOn={true}
                      micOn={true}
                      videoTrack={localCameraTrack}
                      audioTrack={localMicrophoneTrack}
                      className="agora-video-element"
                    />
                  ) : hostUser ? (
                    <RemoteUser user={hostUser} className="agora-video-element" />
                  ) : (
                    <div className="room-placeholder-state">
                      <p>📡 Waiting for the host to start the camera broadcast...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Absolute Positioned Broadcaster Info Bar */}
            <div className="room-media-overlay-bottom">
              <div className="room-avatar-icon">👑</div>
              <div>
                <p className="room-seller-name">
                  {auction.seller} <span>{isHost ? 'You' : 'Seller'}</span>
                </p>
                <small className="room-seller-id">{auction.sellerId}</small>
              </div>
            </div>
          </div>

          <h2 className="room-item-title">{auction.title}</h2>
          <p className="room-item-category">{auction.category} Collector Marketplace Item</p>
        </section>

        {/* Right Column: Real-time Bidding Control Interface */}
        <aside className="room-sidebar">
          <BidPanel
            auction={{
              ...auction,
              currentPrice: currentBid,
              bidCount: bidCount,
              watchers: watchers
            }}
            currentBid={currentBid}
            watchers={watchers}
            onPlaceBid={handlePlaceBid}
          />
        </aside>
      </div>
    </main>
  );
}

export default AuctionRoom;